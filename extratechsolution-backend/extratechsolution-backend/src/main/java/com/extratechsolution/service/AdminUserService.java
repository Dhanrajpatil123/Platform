package com.extratechsolution.service;

import com.extratechsolution.dto.AdminUserDetailResponse;
import com.extratechsolution.dto.AdminUserSummaryResponse;
import com.extratechsolution.entity.Contest;
import com.extratechsolution.entity.ContestRegistration;
import com.extratechsolution.entity.Course;
import com.extratechsolution.entity.CourseProblem;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.AcademicYear;
import com.extratechsolution.enums.SubmissionStatus;
import com.extratechsolution.repository.ContestRegistrationRepository;
import com.extratechsolution.repository.CourseEnrollmentRepository;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.SubmissionRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final ContestRegistrationRepository contestRegistrationRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;

    @Transactional(readOnly = true)
    public List<AdminUserSummaryResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse getUserDetail(Long userId) {
        User user = findUser(userId);

        Set<Long> acceptedProblemIds = submissionRepository.findByUserOrderBySubmittedAtDesc(user).stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .map(s -> s.getProblem().getId())
                .collect(Collectors.toSet());

        List<AdminUserDetailResponse.CourseEnrollmentSummary> courses = courseEnrollmentRepository
                .findByUser(user).stream()
                .map(enrollment -> {
                    Course course = enrollment.getCourse();
                    int total = course.getSyllabus().size();
                    int solved = (int) course.getSyllabus().stream()
                            .map(CourseProblem::getProblem)
                            .filter(p -> acceptedProblemIds.contains(p.getId()))
                            .count();
                    int percent = total == 0 ? 0 : (int) Math.round(solved * 100.0 / total);
                    return new AdminUserDetailResponse.CourseEnrollmentSummary(
                            course.getId(), course.getTitle(), percent);
                })
                .collect(Collectors.toList());

        List<AdminUserDetailResponse.ContestParticipationSummary> contests = contestRegistrationRepository
                .findByUser(user).stream()
                .map(reg -> toContestSummary(user, reg))
                .collect(Collectors.toList());

        return new AdminUserDetailResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getYear() != null ? user.getYear().name() : null,
                user.isPremiumActive(),
                user.getPremiumUntil(),
                acceptedProblemIds.size(),
                courses,
                contests
        );
    }

    @Transactional
    public AdminUserSummaryResponse grantPremium(Long userId, int days) {
        User user = findUser(userId);
        LocalDateTime base = user.isPremiumActive() ? user.getPremiumUntil() : LocalDateTime.now();
        user.setPremiumUntil(base.plusDays(days));
        userRepository.save(user);
        return toSummary(user);
    }

    @Transactional
    public AdminUserSummaryResponse revokePremium(Long userId) {
        User user = findUser(userId);
        user.setPremiumUntil(null);
        userRepository.save(user);
        return toSummary(user);
    }

    @Transactional
    public AdminUserSummaryResponse updateYear(Long userId, AcademicYear year) {
        User user = findUser(userId);
        user.setYear(year);
        userRepository.save(user);
        return toSummary(user);
    }

    private AdminUserDetailResponse.ContestParticipationSummary toContestSummary(
            User user, ContestRegistration reg) {
        Contest contest = reg.getContest();
        String status = reg.getAttemptStartedAt() == null
                ? "NOT_STARTED"
                : reg.getAttemptEndedAt() == null ? "IN_PROGRESS" : "ENDED";

        int solved = 0;
        List<Problem> contestProblems = problemRepository.findByContestId(contest.getId());
        if (reg.getAttemptStartedAt() != null) {
            LocalDateTime end = reg.getAttemptEndedAt() != null ? reg.getAttemptEndedAt() : LocalDateTime.now();
            solved = countSolvedInWindow(user, contestProblems, reg.getAttemptStartedAt(), end);
        }

        return new AdminUserDetailResponse.ContestParticipationSummary(
                contest.getId(), contest.getTitle(), status, solved, contestProblems.size());
    }

    private int countSolvedInWindow(User user, List<Problem> problems, LocalDateTime start, LocalDateTime end) {
        int count = 0;
        for (Problem p : problems) {
            boolean solved = submissionRepository
                    .findByUserAndProblemIdOrderBySubmittedAtDesc(user, p.getId())
                    .stream()
                    .anyMatch(s -> s.getStatus() == SubmissionStatus.ACCEPTED
                            && !s.getSubmittedAt().isBefore(start)
                            && !s.getSubmittedAt().isAfter(end));
            if (solved) count++;
        }
        return count;
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private AdminUserSummaryResponse toSummary(User user) {
        return new AdminUserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getYear() != null ? user.getYear().name() : null,
                user.isPremiumActive(),
                user.getPremiumUntil()
        );
    }
}