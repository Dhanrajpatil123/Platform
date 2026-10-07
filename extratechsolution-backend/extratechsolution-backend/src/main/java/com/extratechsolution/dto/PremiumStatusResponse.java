package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class PremiumStatusResponse {

    private boolean premium;
    private LocalDateTime premiumUntil;
    private boolean mockCheckout;
}
