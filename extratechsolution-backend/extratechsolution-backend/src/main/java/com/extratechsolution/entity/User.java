package com.extratechsolution.entity;

import com.extratechsolution.enums.AcademicYear;
import com.extratechsolution.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String preferredLanguage;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime premiumUntil;

    public boolean isPremiumActive() {
        return premiumUntil != null && premiumUntil.isAfter(LocalDateTime.now());
    }

    @Enumerated(EnumType.STRING)
    @Column
    private AcademicYear year;
}
