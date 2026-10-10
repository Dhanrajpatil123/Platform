package com.extratechsolution.controller;

import com.extratechsolution.service.ProblemNavigationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemNavigationController {

    private final ProblemNavigationService problemNavigationService;

    @GetMapping("/{id}/neighbors")
    public ResponseEntity<?> getNeighbors(
            @PathVariable Long id,
            @RequestParam(required = false) Long course,
            Authentication authentication
    ) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            return ResponseEntity.ok(problemNavigationService.getNeighbors(id, course, username));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}