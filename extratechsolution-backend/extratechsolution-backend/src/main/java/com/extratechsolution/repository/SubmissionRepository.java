package com.extratechsolution.repository;

import com.extratechsolution.entity.Submission;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByUserOrderBySubmittedAtDesc(User user);

    List<Submission> findByUserAndProblemIdOrderBySubmittedAtDesc(User user, Long problemId);

    List<Submission> findByProblemIdAndLanguageAndStatus(Long problemId, String language, SubmissionStatus status);

    void deleteByProblemId(Long problemId);
}
