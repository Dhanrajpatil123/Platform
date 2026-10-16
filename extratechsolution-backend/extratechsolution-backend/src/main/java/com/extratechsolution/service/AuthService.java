package com.extratechsolution.service;


import com.extratechsolution.dto.AuthResponse;
import com.extratechsolution.dto.LoginRequest;
import com.extratechsolution.dto.SignupRequest;
import com.extratechsolution.entity.PasswordResetToken;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.PasswordResetTokenRepository;
import com.extratechsolution.repository.UserRepository;
import com.extratechsolution.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final NotificationService notificationService;


    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.STUDENT);
        user.setYear(request.getYear());

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository
                .findByUsernameOrEmail(request.getIdentifier(), request.getIdentifier())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getRole().name());
    }



    public void forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setToken(java.util.UUID.randomUUID().toString());
            resetToken.setUser(user);
            resetToken.setExpiresAt(java.time.LocalDateTime.now().plusMinutes(30));
            passwordResetTokenRepository.save(resetToken);

            String resetLink = "http://localhost:5173/reset-password/confirm?token=" + resetToken.getToken();

            // No email service configured yet — printing to console instead.
            // Swap this line for a real email send once SMTP is set up.
            System.out.println("=== PASSWORD RESET LINK for " + email + " ===");
            System.out.println(resetLink);
            notificationService.passwordReset(user.getEmail(), user.getUsername(), resetLink);
            System.out.println("=== Expires in 30 minutes ===");


        });

        // Deliberately does nothing different if the email doesn't exist —
        // never reveal whether an email is registered (same principle as login's
        // generic "Invalid credentials" message).
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset link"));

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("Invalid or expired reset link");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
    }

}
