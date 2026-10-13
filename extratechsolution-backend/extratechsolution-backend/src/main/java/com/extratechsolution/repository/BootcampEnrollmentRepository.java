package com.extratechsolution.repository;

import com.extratechsolution.entity.Bootcamp;
import com.extratechsolution.entity.BootcampEnrollment;
import com.extratechsolution.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BootcampEnrollmentRepository extends JpaRepository<BootcampEnrollment, Long> {

    boolean existsByUserAndBootcamp(User user, Bootcamp bootcamp);

    Optional<BootcampEnrollment> findByUserAndBootcamp(User user, Bootcamp bootcamp);

    List<BootcampEnrollment> findByUser(User user);

    long countByBootcampId(Long bootcampId);

    void deleteByBootcampId(Long bootcampId);

    @Query("select coalesce(sum(e.amountPaid), 0) from BootcampEnrollment e where e.bootcamp.id = :bootcampId")
    long sumAmountPaidByBootcampId(@Param("bootcampId") Long bootcampId);

    List<BootcampEnrollment> findByBootcampId(Long bootcampId);
}