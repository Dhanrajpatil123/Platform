package com.extratechsolution.controller;

import com.extratechsolution.dto.BookmarkedProblemResponse;
import com.extratechsolution.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @PostMapping("/{problemId}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Long problemId, Authentication authentication) {
        try {
            boolean bookmarked = bookmarkService.toggle(authentication.getName(), problemId);
            return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public List<BookmarkedProblemResponse> getMyBookmarks(Authentication authentication) {
        return bookmarkService.getMyBookmarks(authentication.getName());
    }
}