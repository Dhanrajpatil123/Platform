package com.extratechsolution.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PremiumRequiredException.class)
    public ResponseEntity<Map<String, String>> handlePremiumRequired(PremiumRequiredException e) {
        return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                .body(Map.of("error", e.getMessage(), "code", "PREMIUM_REQUIRED"));
    }

    @ExceptionHandler(ContestAccessException.class)
    public ResponseEntity<Map<String, String>> handleContestAccess(ContestAccessException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", e.getMessage(), "code", "CONTEST_ACCESS_REQUIRED"));
    }
}
