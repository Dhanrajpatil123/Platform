package com.extratechsolution.controller;

import com.extratechsolution.dto.CheckoutRequest;
import com.extratechsolution.dto.PlanResponse;
import com.extratechsolution.dto.PremiumStatusResponse;
import com.extratechsolution.enums.PremiumPlan;
import com.extratechsolution.service.PremiumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/premium")
@RequiredArgsConstructor
public class PremiumController {

    private final PremiumService premiumService;

    @GetMapping("/plans")
    public List<PlanResponse> getPlans() {
        return Arrays.stream(PremiumPlan.values())
                .map(p -> new PlanResponse(p.name(), p.getLabel(), p.getDays(), p.getPriceInr()))
                .collect(Collectors.toList());
    }

    @GetMapping("/status")
    public PremiumStatusResponse getStatus(Authentication authentication) {
        return premiumService.getStatus(authentication.getName());
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            @Valid @RequestBody CheckoutRequest request,
            Authentication authentication
    ) {
        try {
            return ResponseEntity.ok(
                    premiumService.mockCheckout(authentication.getName(), request.getPlan()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancel(Authentication authentication) {
        try {
            return ResponseEntity.ok(premiumService.mockCancel(authentication.getName()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
