package com.extratechsolution.controller;

import com.extratechsolution.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/preferences")
    public ResponseEntity<?> get(Authentication authentication) {
        return ResponseEntity.ok(Map.of("emailEnabled", notificationService.isEnabledFor(authentication.getName())));
    }

    @PutMapping("/preferences")
    public ResponseEntity<?> update(@RequestBody Map<String, Boolean> body, Authentication authentication) {
        boolean enabled = Boolean.TRUE.equals(body.get("emailEnabled"));
        return ResponseEntity.ok(Map.of("emailEnabled",
                notificationService.setEnabledFor(authentication.getName(), enabled)));
    }

    @PostMapping("/test")
    public ResponseEntity<?> test(Authentication authentication) {
        try {
            String email = notificationService.sendTest(authentication.getName());
            return ResponseEntity.ok(Map.of("message", "Test email queued for " + email));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}