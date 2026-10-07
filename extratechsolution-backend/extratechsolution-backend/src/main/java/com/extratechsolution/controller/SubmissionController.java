package com.extratechsolution.controller;

import com.extratechsolution.dto.SubmissionRequest;
import com.extratechsolution.dto.SubmissionResponse;
import com.extratechsolution.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<?> createSubmission(
            @Valid @RequestBody SubmissionRequest request,
            Authentication authentication
    ) {
        try {
            SubmissionResponse response =
                    submissionService.createSubmission(authentication.getName(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<List<SubmissionResponse>> getMySubmissions(Authentication authentication) {
        return ResponseEntity.ok(submissionService.getMySubmissions(authentication.getName()));
    }

    @GetMapping("/me/problem/{problemId}")
    public ResponseEntity<List<SubmissionResponse>> getMySubmissionsForProblem(
            @PathVariable Long problemId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                submissionService.getMySubmissionsForProblem(authentication.getName(), problemId)
        );
    }

    @GetMapping("/me/solved")
    public ResponseEntity<Set<Long>> getSolvedProblemIds(Authentication authentication) {
        return ResponseEntity.ok(submissionService.getSolvedProblemIds(authentication.getName()));
    }
}
