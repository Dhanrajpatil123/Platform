package com.extratechsolution.service;

import com.extratechsolution.dto.EnrollmentResponse;
import com.extratechsolution.entity.Course;
import com.extratechsolution.entity.CourseEnrollment;
import com.extratechsolution.entity.CourseProblem;
import com.extratechsolution.entity.User;
import com.extratechsolution.repository.CourseEnrollmentRepository;
import com.extratechsolution.repository.CourseRepository;
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
public class EnrollmentService {

    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseProgressService progressService;

    @Transactional
    public EnrollmentResponse enroll(String username, Long courseId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        if (enrollmentRepository.existsByUserAndCourse(user, course)) {
            throw new IllegalArgumentException("Already enrolled in this course");
        }

        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setUser(user);
        enrollment.setCourse(course);
        enrollmentRepository.save(enrollment);

        return toResponse(user, course, enrollment.getEnrolledAt());
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyEnrollments(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return enrollmentRepository.findByUser(user)
                .stream()
                .map(e -> toResponse(user, e.getCourse(), e.getEnrolledAt()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isEnrolled(String username, Long courseId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));

        return enrollmentRepository.existsByUserAndCourse(user, course);
    }

    // Only problems solved AFTER enrolling count towards progress.
    private EnrollmentResponse toResponse(User user, Course course, LocalDateTime enrolledAt) {
        Set<Long> solvedIds = progressService.solvedProblemIdsSince(user, enrolledAt);

        int totalProblems = course.getSyllabus().size();
        int solvedProblems = (int) course.getSyllabus().stream()
                .map(CourseProblem::getProblem)
                .filter(problem -> solvedIds.contains(problem.getId()))
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