package com.extratechsolution.repository;

import com.extratechsolution.entity.Submission;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByUserOrderBySubmittedAtDesc(User user);

    List<Submission> findByUserAndProblemIdOrderBySubmittedAtDesc(User user, Long problemId);

    List<Submission> findByProblemIdAndLanguageAndStatus(Long problemId, String language, SubmissionStatus status);

    void deleteByProblemId(Long problemId);

    boolean existsByUser_UsernameAndProblem_IdAndStatus(String username, Long problemId, SubmissionStatus status);

    @Query("select distinct s.problem.id from Submission s "
            + "where s.user.id = :userId and s.status = :status and s.submittedAt >= :since")
    List<Long> findSolvedProblemIdsSince(@Param("userId") Long userId,
                                         @Param("status") SubmissionStatus status,
                                         @Param("since") LocalDateTime since);

    @Query("select max(s.submittedAt) from Submission s where s.user.id = :userId")
    LocalDateTime findLastSubmittedAt(@Param("userId") Long userId);
}
