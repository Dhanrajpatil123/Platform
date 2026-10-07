package com.extratechsolution.repository;

import com.extratechsolution.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {

    List<TestCase> findByProblemId(Long problemId);

    void deleteByProblemId(Long problemId);
}
