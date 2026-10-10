package com.extratechsolution.repository;

import com.extratechsolution.entity.Bootcamp;
import com.extratechsolution.entity.BootcampEnrollment;
import com.extratechsolution.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BootcampEnrollmentRepository extends JpaRepository<BootcampEnrollment, Long> {

    boolean existsByUserAndBootcamp(User user, Bootcamp bootcamp);

    Optional<BootcampEnrollment> findByUserAndBootcamp(User user, Bootcamp bootcamp);

    List<BootcampEnrollment> findByUser(User user);

    long countByBootcampId(Long bootcampId);

    void deleteByBootcampId(Long bootcampId);
}