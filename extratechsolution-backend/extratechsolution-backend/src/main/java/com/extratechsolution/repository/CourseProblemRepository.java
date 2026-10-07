package com.extratechsolution.repository;

import com.extratechsolution.entity.CourseProblem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseProblemRepository extends JpaRepository<CourseProblem, Long> {

    List<CourseProblem> findByProblemId(Long problemId);
}
