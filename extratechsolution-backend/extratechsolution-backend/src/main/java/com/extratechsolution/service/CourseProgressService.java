package com.extratechsolution.service;

import com.extratechsolution.entity.Course;
import com.extratechsolution.entity.CourseProblem;
import com.extratechsolution.entity.Submission;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.SubmissionStatus;
import com.extratechsolution.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseProgressService {

    private final SubmissionRepository submissionRepository;

    public record CourseStat(Long id, String title, String difficulty, boolean premium, int total, int solved) {
        public boolean completed() {
            return total > 0 && solved >= total;
        }
    }

    public record Stats(List<CourseStat> courses, int totalProblems, int solvedProblems, int percent,
                        boolean complete) {}

    /** Problems the user solved (ACCEPTED) at or after the given moment. */
    public Set<Long> solvedProblemIdsSince(User user, LocalDateTime since) {
        if (since == null) return Set.of();
        return submissionRepository.findByUserOrderBySubmittedAtDesc(user).stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .filter(s -> s.getSubmittedAt() != null && !s.getSubmittedAt().isBefore(since))
                .map(s -> s.getProblem().getId())
                .collect(Collectors.toSet());
    }

    /** Progress across one or more courses. Distinct problems are counted once overall. */
    public Stats stats(User user, List<Course> courses, LocalDateTime since) {
        Set<Long> solved = user == null ? Set.of() : solvedProblemIdsSince(user, since);
        Set<Long> allProblems = new LinkedHashSet<>();
        Set<Long> allSolved = new HashSet<>();
        List<CourseStat> stats = new ArrayList<>();

        for (Course course : courses) {
            int total = 0;
            int done = 0;
            for (CourseProblem cp : course.getSyllabus()) {
                Long problemId = cp.getProblem().getId();
                total++;
                allProblems.add(problemId);
                if (solved.contains(problemId)) {
                    done++;
                    allSolved.add(problemId);
                }
            }
            stats.add(new CourseStat(course.getId(), course.getTitle(), String.valueOf(course.getDifficulty()),
                    course.isPremium(), total, done));
        }

        int totalProblems = allProblems.size();
        int solvedProblems = allSolved.size();
        int percent = totalProblems == 0 ? 0 : solvedProblems * 100 / totalProblems;
        return new Stats(stats, totalProblems, solvedProblems, percent,
                totalProblems > 0 && solvedProblems >= totalProblems);
    }
}