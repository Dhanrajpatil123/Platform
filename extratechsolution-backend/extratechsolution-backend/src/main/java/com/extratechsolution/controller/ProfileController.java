package com.extratechsolution.controller;


import com.extratechsolution.dto.ProfileStatsResponse;
import com.extratechsolution.dto.UpdateProfileRequest;
import com.extratechsolution.dto.UserProfileResponse;
import com.extratechsolution.service.ProfileStatsService;
import com.extratechsolution.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileStatsService profileStatsService;

    private final UserProfileService userProfileService;

    @GetMapping("/stats")
    public ProfileStatsResponse getStats(Authentication authentication) {
        return profileStatsService.getStats(authentication.getName());
    }

    @GetMapping("/me")
    public UserProfileResponse getMyProfile(Authentication authentication) {
        return userProfileService.getProfile(authentication.getName());
    }


    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication
    ) {
        try {
            return ResponseEntity.ok(userProfileService.updateProfile(authentication.getName(), request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}