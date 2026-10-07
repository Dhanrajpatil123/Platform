package com.extratechsolution.controller;

import com.extratechsolution.dto.ProblemRequest;
import com.extratechsolution.dto.ProblemResponse;
import com.extratechsolution.service.ProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;



    @GetMapping
    public ResponseEntity<List<ProblemResponse>> getAllProblems(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(problemService.getAllProblems(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProblemById(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            return ResponseEntity.ok(problemService.getProblemById(id, username));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // Admin only — enforced below at the method level, in addition to SecurityConfig
    @PostMapping("/admin")
    public ResponseEntity<?> createProblem(@Valid @RequestBody ProblemRequest request) {
        ProblemResponse response = problemService.createProblem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<?> updateProblem(@PathVariable Long id, @Valid @RequestBody ProblemRequest request) {
        try {
            return ResponseEntity.ok(problemService.updateProblem(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }


    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteProblem(@PathVariable Long id) {
        try {
            problemService.deleteProblem(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/admin/bulk-import")
    public ResponseEntity<?> bulkImport(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            return ResponseEntity.ok(problemService.bulkImportProblems(file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
