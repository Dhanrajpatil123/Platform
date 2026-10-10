package com.extratechsolution.service;

import com.extratechsolution.dto.ProblemNeighborsResponse;
import com.extratechsolution.entity.Course;
import com.extratechsolution.entity.CourseProblem;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.ContestStatus;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.CourseRepository;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProblemNavigationService {

    private final ProblemRepository problemRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ContestAccessService contestAccessService;

    @Transactional(readOnly = true)
    public ProblemNeighborsResponse getNeighbors(Long problemId, Long courseId, String usernameOrNull) {
        Problem current = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        User viewer = usernameOrNull == null
                ? null
                : userRepository.findByUsername(usernameOrNull).orElse(null);
        boolean isAdmin = viewer != null && viewer.getRole() == Role.ADMIN;

        // 1. Course scope: only if the problem really is in that course's syllabus
        if (courseId != null) {
            Optional<Course> course = courseRepository.findById(courseId);
            if (course.isPresent()) {
                List<Long> ids = course.get().getSyllabus().stream()
                        .sorted(Comparator.comparing(CourseProblem::getSequenceOrder))
                        .map(cp -> cp.getProblem().getId())
                        .toList();
                if (ids.contains(problemId)) {
                    return buildByIndex(ids, problemId, "COURSE", course.get().getTitle());
                }
            }
        }

        // 2. Contest scope: only for a contest that hasn't ended, and only if
        //    this viewer is actually allowed to open its problems right now.
        if (current.getContest() != null
                && contestAccessService.statusOf(current.getContest()) != ContestStatus.ENDED) {
            if (!contestAccessService.canAccessProblem(viewer, isAdmin, current)) {
                return new ProblemNeighborsResponse(null, null, null, 0, "NONE", null);
            }
            List<Long> ids = problemRepository.findByContestId(current.getContest().getId()).stream()
                    .map(Problem::getId)
                    .sorted()
                    .toList();
            return buildByIndex(ids, problemId, "CONTEST", current.getContest().getTitle());
        }

        // 3. Global catalog scope, based on ID order among problems this
        //    viewer can see. Works even if the current problem isn't in the list.
        List<Long> visibleIds = problemRepository.findAll().stream()
                .filter(p -> contestAccessService.isVisibleInCatalog(p, isAdmin))
                .map(Problem::getId)
                .sorted()
                .toList();
        return buildByValue(visibleIds, problemId);
    }

    private ProblemNeighborsResponse buildByIndex(List<Long> ids, Long problemId, String type, String label) {
        int idx = ids.indexOf(problemId);
        Long prev = idx > 0 ? ids.get(idx - 1) : null;
        Long next = (idx >= 0 && idx < ids.size() - 1) ? ids.get(idx + 1) : null;
        return new ProblemNeighborsResponse(prev, next, idx >= 0 ? idx + 1 : null, ids.size(), type, label);
    }

    private ProblemNeighborsResponse buildByValue(List<Long> sortedIds, Long problemId) {
        Long prev = null;
        Long next = null;
        int before = 0;
        for (Long id : sortedIds) {
            if (id < problemId) {
                prev = id;
                before++;
            } else if (id > problemId && next == null) {
                next = id;
            }
        }
        int total = sortedIds.contains(problemId) ? sortedIds.size() : sortedIds.size() + 1;
        return new ProblemNeighborsResponse(prev, next, before + 1, total, "CATALOG", null);
    }
}