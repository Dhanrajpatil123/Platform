package com.extratechsolution.controller;

import com.extratechsolution.dto.AdminUserDetailResponse;
import com.extratechsolution.dto.AdminUserSummaryResponse;
import com.extratechsolution.dto.GrantPremiumRequest;
import com.extratechsolution.dto.UpdateYearRequest;
import com.extratechsolution.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<AdminUserSummaryResponse> getAllUsers() {
        return adminUserService.getAllUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserDetail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminUserService.getUserDetail(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/premium/grant")
    public ResponseEntity<?> grantPremium(@PathVariable Long id, @Valid @RequestBody GrantPremiumRequest request) {
        try {
            return ResponseEntity.ok(adminUserService.grantPremium(id, request.getDays()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/premium/revoke")
    public ResponseEntity<?> revokePremium(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminUserService.revokePremium(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/year")
    public ResponseEntity<?> updateYear(@PathVariable Long id, @RequestBody UpdateYearRequest request) {
        try {
            return ResponseEntity.ok(adminUserService.updateYear(id, request.getYear()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}