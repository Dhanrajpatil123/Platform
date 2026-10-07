package com.extratechsolution.controller;

import com.extratechsolution.dto.EnrollmentResponse;
import com.extratechsolution.service.EnrollmentService;
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
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping("/{courseId}")
    public ResponseEntity<?> enroll(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        try {
            EnrollmentResponse response =
                    enrollmentService.enroll(authentication.getName(), courseId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<List<EnrollmentResponse>> getMyEnrollments(Authentication authentication) {
        return ResponseEntity.ok(enrollmentService.getMyEnrollments(authentication.getName()));
    }

    @GetMapping("/me/course/{courseId}")
    public ResponseEntity<?> checkEnrollment(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        try {
            boolean enrolled = enrollmentService.isEnrolled(authentication.getName(), courseId);
            return ResponseEntity.ok(Map.of("enrolled", enrolled));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
