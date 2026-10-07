package com.extratechsolution.repository;

import com.extratechsolution.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProblemRepository extends JpaRepository<Problem, Long> {

    List<Problem> findByContestId(Long contestId);

}
