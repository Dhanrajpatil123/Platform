package com.extratechsolution.controller;

import com.extratechsolution.service.DailyChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// Full path is /api/problems/daily/today (two segments after /problems),
// which never collides with ProblemController's /api/problems/{id}
// (one segment) — Spring disambiguates by path shape, not declaration order.
@RestController
@RequestMapping("/api/problems/daily")
@RequiredArgsConstructor
public class DailyChallengeController {

    private final DailyChallengeService dailyChallengeService;

    @GetMapping("/today")
    public ResponseEntity<?> getToday() {
        try {
            return ResponseEntity.ok(dailyChallengeService.getToday());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}