package com.extratechsolution.controller;

import com.extratechsolution.dto.ContestDetailResponse;
import com.extratechsolution.dto.ContestRequest;
import com.extratechsolution.dto.ContestSummaryResponse;
import com.extratechsolution.service.ContestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestService contestService;

    @GetMapping
    public ResponseEntity<List<ContestSummaryResponse>> getAllContests(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(contestService.getAllContests(username));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getContestById(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : null;
            return ResponseEntity.ok(contestService.getContestById(id, username));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<?> register(@PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(contestService.register(authentication.getName(), id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/admin")
    public ResponseEntity<?> createContest(@Valid @RequestBody ContestRequest request) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(contestService.createContest(request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<?> updateContest(@PathVariable Long id, @Valid @RequestBody ContestRequest request) {
        try {
            return ResponseEntity.ok(contestService.updateContest(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteContest(@PathVariable Long id) {
        try {
            contestService.deleteContest(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }



    @PostMapping("/{id}/start")
    public ResponseEntity<?> startAttempt(@PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(contestService.startAttempt(authentication.getName(), id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/attempt")
    public ResponseEntity<?> getAttempt(@PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(contestService.getAttemptStatus(authentication.getName(), id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<?> endAttempt(@PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(contestService.endAttempt(authentication.getName(), id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    @PostMapping("/{id}/warning")
    public ResponseEntity<?> recordWarning(@PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(contestService.recordWarning(authentication.getName(), id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<?> getLeaderboard(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(contestService.getLeaderboard(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }


    @GetMapping("/admin/{id}/report")
    public ResponseEntity<?> getContestReport(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(contestService.getContestReport(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }



}
