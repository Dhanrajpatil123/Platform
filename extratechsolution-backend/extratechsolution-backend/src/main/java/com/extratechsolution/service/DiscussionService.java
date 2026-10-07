package com.extratechsolution.service;

import com.extratechsolution.dto.CommentRequest;
import com.extratechsolution.dto.CommentResponse;
import com.extratechsolution.dto.PostRequest;
import com.extratechsolution.dto.PostResponse;
import com.extratechsolution.entity.*;
import com.extratechsolution.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionPostRepository postRepository;
    private final DiscussionCommentRepository commentRepository;
    private final PostUpvoteRepository upvoteRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final PremiumService premiumService;

    public PostResponse createPost(String username, PostRequest request) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        DiscussionPost post = new DiscussionPost();
        post.setProblem(problem);
        post.setAuthor(author);
        post.setTitle(request.getTitle());
        post.setBody(request.getBody());
        post.setCode(request.getCode());

        DiscussionPost saved = postRepository.save(post);
        return toPostResponse(saved, author, true);
    }

    public List<PostResponse> getPostsForProblem(Long problemId, String usernameOrNull) {
        User viewer = usernameOrNull == null
                ? null
                : userRepository.findByUsername(usernameOrNull).orElse(null);
        boolean viewerHasAccess = premiumService.hasPremiumAccessByUsername(usernameOrNull);

        return postRepository.findByProblemIdOrderByCreatedAtDesc(problemId)
                .stream()
                .map(post -> toPostResponse(post, viewer, viewerHasAccess))
                .collect(Collectors.toList());
    }

    public PostResponse getPostById(Long postId, String usernameOrNull) {
        User viewer = usernameOrNull == null
                ? null
                : userRepository.findByUsername(usernameOrNull).orElse(null);
        boolean viewerHasAccess = premiumService.hasPremiumAccessByUsername(usernameOrNull);

        DiscussionPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        return toPostResponse(post, viewer, viewerHasAccess);
    }

    public PostResponse toggleUpvote(String username, Long postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        DiscussionPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        upvoteRepository.findByUserAndPost(user, post)
                .ifPresentOrElse(
                        upvoteRepository::delete,
                        () -> {
                            PostUpvote upvote = new PostUpvote();
                            upvote.setUser(user);
                            upvote.setPost(post);
                            upvoteRepository.save(upvote);
                        }
                );

        boolean viewerHasAccess = premiumService.hasPremiumAccess(user);
        return toPostResponse(post, user, viewerHasAccess);
    }

    public CommentResponse addComment(String username, Long postId, CommentRequest request) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        DiscussionPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        DiscussionComment comment = new DiscussionComment();
        comment.setPost(post);
        comment.setAuthor(author);
        comment.setBody(request.getBody());

        DiscussionComment saved = commentRepository.save(comment);
        return toCommentResponse(saved);
    }

    public List<CommentResponse> getCommentsForPost(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());
    }

    public CommentResponse updateComment(String username, Long postId, Long commentId, CommentRequest request) {
        DiscussionComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getPost().getId().equals(postId)) {
            throw new IllegalArgumentException("Comment does not belong to this post");
        }
        if (!comment.getAuthor().getUsername().equals(username)) {
            throw new IllegalArgumentException("You can only edit your own comments");
        }

        comment.setBody(request.getBody());
        DiscussionComment saved = commentRepository.save(comment);
        return toCommentResponse(saved);
    }

    public void deleteComment(String username, Long postId, Long commentId) {
        DiscussionComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getPost().getId().equals(postId)) {
            throw new IllegalArgumentException("Comment does not belong to this post");
        }
        if (!comment.getAuthor().getUsername().equals(username)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    // For a locked problem's post, the title and author stay visible (so the
    // thread doesn't just vanish) but the body/code that could contain a
    // solution are withheld, same principle as locking the problem itself.
    private PostResponse toPostResponse(DiscussionPost post, User viewer, boolean viewerHasAccess) {
        long upvoteCount = upvoteRepository.countByPost(post);
        boolean upvotedByMe = viewer != null
                && upvoteRepository.findByUserAndPost(viewer, post).isPresent();

        boolean locked = post.getProblem().isPremium() && !viewerHasAccess;

        return new PostResponse(
                post.getId(),
                post.getProblem().getId(),
                post.getTitle(),
                locked ? "This discussion is on a Premium problem. Upgrade to Premium to read it." : post.getBody(),
                locked ? null : post.getCode(),
                post.getAuthor().getUsername(),
                upvoteCount,
                upvotedByMe,
                locked,
                post.getCreatedAt()
        );
    }

    private CommentResponse toCommentResponse(DiscussionComment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getBody(),
                comment.getAuthor().getUsername(),
                comment.getCreatedAt()
        );
    }



    @Transactional
    public void adminDeletePost(Long postId) {
        DiscussionPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .forEach(commentRepository::delete);
        upvoteRepository.deleteByPostId(postId);
        postRepository.delete(post);
    }

    @Transactional
    public void adminDeleteComment(Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new IllegalArgumentException("Comment not found");
        }
        commentRepository.deleteById(commentId);
    }


}
