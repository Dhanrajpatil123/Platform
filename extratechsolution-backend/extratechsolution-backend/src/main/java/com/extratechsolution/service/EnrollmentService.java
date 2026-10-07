package com.extratechsolution.service;

import com.extratechsolution.dto.EnrollmentResponse;
import com.extratechsolution.entity.*;
import com.extratechsolution.enums.SubmissionStatus;
import com.extratechsolution.exception.PremiumRequiredException;
import com.extratechsolution.repository.CourseEnrollmentRepository;
import com.extratechsolution.repository.CourseRepository;
import com.extratechsolution.repository.SubmissionRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final PremiumService premiumService;

    public EnrollmentResponse enroll(String username, Long courseId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (course.isPremium() && !premiumService.hasPremiumAccess(user)) {
            throw new PremiumRequiredException(
                    "This is a Premium course. Upgrade to Premium to enroll.");
        }

        if (enrollmentRepository.existsByUserAndCourse(user, course)) {
            throw new IllegalArgumentException("Already enrolled in this course");
        }

        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setUser(user);
        enrollment.setCourse(course);
        enrollmentRepository.save(enrollment);

        return toResponse(user, course);
    }

    public List<EnrollmentResponse> getMyEnrollments(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return enrollmentRepository.findByUser(user)
                .stream()
                .map(enrollment -> toResponse(user, enrollment.getCourse()))
                .collect(Collectors.toList());
    }

    public boolean isEnrolled(String username, Long courseId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        return enrollmentRepository.existsByUserAndCourse(user, course);
    }

    private EnrollmentResponse toResponse(User user, Course course) {
        List<Submission> userSubmissions = submissionRepository.findByUserOrderBySubmittedAtDesc(user);

        Set<Long> acceptedProblemIds = userSubmissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .map(s -> s.getProblem().getId())
                .collect(Collectors.toSet());

        int totalProblems = course.getSyllabus().size();
        int solvedProblems = (int) course.getSyllabus().stream()
                .map(CourseProblem::getProblem)
                .filter(problem -> acceptedProblemIds.contains(problem.getId()))
                .count();

        int progressPercent = totalProblems == 0
                ? 0
                : (int) Math.round((solvedProblems * 100.0) / totalProblems);

        return new EnrollmentResponse(
                course.getId(),
                course.getTitle(),
                course.getDifficulty(),
                totalProblems,
                solvedProblems,
                progressPercent
        );
    }
}
