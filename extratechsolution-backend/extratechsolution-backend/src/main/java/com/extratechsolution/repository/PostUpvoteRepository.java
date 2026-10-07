package com.extratechsolution.repository;

import com.extratechsolution.entity.DiscussionPost;
import com.extratechsolution.entity.PostUpvote;
import com.extratechsolution.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostUpvoteRepository extends JpaRepository<PostUpvote, Long> {

    Optional<PostUpvote> findByUserAndPost(User user, DiscussionPost post);

    long countByPost(DiscussionPost post);

    void deleteByPostId(Long postId);
}
