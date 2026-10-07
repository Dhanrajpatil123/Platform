package com.extratechsolution.service;

import com.extratechsolution.dto.AuthResponse;
import com.extratechsolution.dto.UpdateProfileRequest;
import com.extratechsolution.dto.UserProfileResponse;
import com.extratechsolution.entity.User;
import com.extratechsolution.repository.UserRepository;
import com.extratechsolution.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String username) {
        User user = findUser(username);
        return toResponse(user);
    }

    // Returns an AuthResponse (with a fresh token) instead of UserProfileResponse,
    // because a username change invalidates the token that made this very
    // request — the client MUST replace its stored token immediately or every
    // subsequent call fails with a stale-subject 401.
    @Transactional
    public AuthResponse updateProfile(String currentUsername, UpdateProfileRequest request) {
        User user = findUser(currentUsername);

        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw new IllegalArgumentException("That email is already in use by another account");
            }
        });

        String newUsername = request.getUsername().trim();
        if (!newUsername.equals(user.getUsername())) {
            userRepository.findByUsername(newUsername).ifPresent(existing -> {
                throw new IllegalArgumentException("That username is already taken");
            });
            user.setUsername(newUsername);
        }

        user.setEmail(request.getEmail());
        user.setBio(request.getBio());
        user.setPreferredLanguage(request.getPreferredLanguage());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getRole().name());
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private UserProfileResponse toResponse(User user) {
        return new UserProfileResponse(
                user.getUsername(),
                user.getEmail(),
                user.getBio(),
                user.getPreferredLanguage()
        );
    }
}