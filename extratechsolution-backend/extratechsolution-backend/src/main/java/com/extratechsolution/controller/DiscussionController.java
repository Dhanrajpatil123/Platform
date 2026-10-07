package com.extratechsolution.controller;

import com.extratechsolution.dto.CommentRequest;
import com.extratechsolution.dto.CommentResponse;
import com.extratechsolution.dto.PostRequest;
import com.extratechsolution.dto.PostResponse;
import com.extratechsolution.service.DiscussionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discussions")
@RequiredArgsConstructor
public class DiscussionController {

    private final DiscussionService discussionService;

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(
            @Valid @RequestBody PostRequest request,
            Authentication authentication
    ) {
        try {
            PostResponse response =
                    discussionService.createPost(authentication.getName(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<List<PostResponse>> getPostsForProblem(
            @PathVariable Long problemId,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(discussionService.getPostsForProblem(problemId, username));
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<?> getPostById(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            return ResponseEntity.ok(discussionService.getPostById(postId, username));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/posts/{postId}/upvote")
    public ResponseEntity<?> toggleUpvote(
            @PathVariable Long postId,
            Authentication authentication
    ) {
        try {
            PostResponse response =
                    discussionService.toggleUpvote(authentication.getName(), postId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        try {
            CommentResponse response =
                    discussionService.addComment(authentication.getName(), postId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(discussionService.getCommentsForPost(postId));
    }


    @PutMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        try {
            CommentResponse response =
                    discussionService.updateComment(authentication.getName(), postId, commentId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            Authentication authentication
    ) {
        try {
            discussionService.deleteComment(authentication.getName(), postId, commentId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    @DeleteMapping("/admin/posts/{postId}")
    public ResponseEntity<?> adminDeletePost(@PathVariable Long postId) {
        try {
            discussionService.adminDeletePost(postId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/comments/{commentId}")
    public ResponseEntity<?> adminDeleteComment(@PathVariable Long commentId) {
        try {
            discussionService.adminDeleteComment(commentId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }


}
