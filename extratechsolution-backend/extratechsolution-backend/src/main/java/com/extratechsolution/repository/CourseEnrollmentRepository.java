package com.extratechsolution.repository;

import com.extratechsolution.entity.Course;
import com.extratechsolution.entity.CourseEnrollment;
import com.extratechsolution.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    Optional<CourseEnrollment> findByUserAndCourse(User user, Course course);

    List<CourseEnrollment> findByUser(User user);

    boolean existsByUserAndCourse(User user, Course course);

    long countByCourseId(Long courseId);

    void deleteByCourseId(Long courseId);

    List<CourseEnrollment> findByCourse_Id(Long courseId);
}