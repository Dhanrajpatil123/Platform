package com.extratechsolution.repository;

import com.extratechsolution.entity.Course;
import com.extratechsolution.entity.CourseEnrollment;
import com.extratechsolution.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    List<CourseEnrollment> findByUser(User user);

    Optional<CourseEnrollment> findByUserAndCourse(User user, Course course);

    boolean existsByUserAndCourse(User user, Course course);

    void deleteByCourseId(Long courseId);
}
