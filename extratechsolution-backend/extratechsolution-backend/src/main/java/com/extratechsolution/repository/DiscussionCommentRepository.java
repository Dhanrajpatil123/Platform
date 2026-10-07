package com.extratechsolution.repository;

import com.extratechsolution.entity.DiscussionComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiscussionCommentRepository extends JpaRepository<DiscussionComment, Long> {

    List<DiscussionComment> findByPostIdOrderByCreatedAtAsc(Long postId);

    void deleteByPostId(Long postId);
}
