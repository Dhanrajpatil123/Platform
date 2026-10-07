package com.extratechsolution.service;

import com.extratechsolution.dto.PremiumStatusResponse;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.PremiumPlan;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PremiumService {

    private final UserRepository userRepository;

    @Value("${premium.mock-checkout-enabled:false}")
    private boolean mockCheckoutEnabled;

    @PostConstruct
    void warnIfMockCheckoutEnabled() {
        if (mockCheckoutEnabled) {
            System.out.println("WARNING: premium.mock-checkout-enabled=true, so anyone can activate "
                    + "Premium without paying. Set it to false before any real deployment.");
        }
    }

    // Admins always have full access; everyone else needs an unexpired premiumUntil.
    public boolean hasPremiumAccess(User user) {
        return user != null && (user.getRole() == Role.ADMIN || user.isPremiumActive());
    }

    public boolean hasPremiumAccessByUsername(String usernameOrNull) {
        if (usernameOrNull == null) {
            return false;
        }
        return userRepository.findByUsername(usernameOrNull)
                .map(this::hasPremiumAccess)
                .orElse(false);
    }

    public PremiumStatusResponse getStatus(String username) {
        User user = findUser(username);
        return new PremiumStatusResponse(
                hasPremiumAccess(user), user.getPremiumUntil(), mockCheckoutEnabled);
    }

    // Stand-in for a real payment. Replace with: create a gateway order, let the
    // gateway's checkout run, then grant premium ONLY from a signature-verified
    // webhook, never from anything the browser claims.
    @Transactional
    public PremiumStatusResponse mockCheckout(String username, PremiumPlan plan) {
        requireMockCheckout();
        User user = findUser(username);

        // Buying while already premium extends the current period instead of resetting it
        LocalDateTime base = user.isPremiumActive() ? user.getPremiumUntil() : LocalDateTime.now();
        user.setPremiumUntil(base.plusDays(plan.getDays()));
        userRepository.save(user);

        return new PremiumStatusResponse(true, user.getPremiumUntil(), mockCheckoutEnabled);
    }

    @Transactional
    public PremiumStatusResponse mockCancel(String username) {
        requireMockCheckout();
        User user = findUser(username);
        user.setPremiumUntil(null);
        userRepository.save(user);

        return new PremiumStatusResponse(hasPremiumAccess(user), null, mockCheckoutEnabled);
    }

    private void requireMockCheckout() {
        if (!mockCheckoutEnabled) {
            throw new IllegalStateException("Online payments are not set up on this server yet.");
        }
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
