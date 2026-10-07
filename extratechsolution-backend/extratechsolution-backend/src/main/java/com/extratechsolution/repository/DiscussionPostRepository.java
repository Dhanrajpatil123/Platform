package com.extratechsolution.repository;


import com.extratechsolution.entity.DiscussionPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiscussionPostRepository extends JpaRepository<DiscussionPost, Long> {

    List<DiscussionPost> findByProblemIdOrderByCreatedAtDesc(Long problemId);
}
