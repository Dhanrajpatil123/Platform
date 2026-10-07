package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AdminUserSummaryResponse {

    private Long id;
    private String username;
    private String email;
    private String role;
    private String year;
    private boolean premiumActive;
    private LocalDateTime premiumUntil;
}