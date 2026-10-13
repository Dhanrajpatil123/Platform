package com.extratechsolution.service;

import com.extratechsolution.entity.Bootcamp;
import com.extratechsolution.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class BootcampPaymentService {

    private static final Set<String> METHODS = Set.of("UPI", "CARD", "NETBANKING");

    @Value("${bootcamp.mock-payment-enabled:true}")
    private boolean mockPaymentEnabled;

    /**
     * Charges the student and returns a payment reference.
     * Replace the body of this method with a real gateway call (e.g. Razorpay) later.
     */
    public String charge(User user, Bootcamp bootcamp, String paymentMethod) {
        if (!mockPaymentEnabled) {
            throw new IllegalStateException("Online payments are not enabled yet. Please contact the administrator.");
        }
        String method = paymentMethod == null ? "" : paymentMethod.trim().toUpperCase(Locale.ROOT);
        if (!METHODS.contains(method)) {
            throw new IllegalArgumentException("Please choose a payment method.");
        }
        return "MOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }
}