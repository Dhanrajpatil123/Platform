package com.extratechsolution.repository;

import com.extratechsolution.entity.Contest;
import com.extratechsolution.entity.ContestRegistration;
import com.extratechsolution.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContestRegistrationRepository extends JpaRepository<ContestRegistration, Long> {

    boolean existsByUserAndContest(User user, Contest contest);

    Optional<ContestRegistration> findByUserAndContest(User user, Contest contest);

    List<ContestRegistration> findByContestId(Long contestId);

    List<ContestRegistration> findByUser(User user);

    void deleteByContestId(Long contestId);
}