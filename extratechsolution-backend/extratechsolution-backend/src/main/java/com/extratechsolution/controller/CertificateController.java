// CertificateController.java
package com.extratechsolution.controller;

import com.extratechsolution.dto.ClaimRequest;
import com.extratechsolution.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @GetMapping("/me")
    public ResponseEntity<?> getMine(Authentication authentication) {
        return ResponseEntity.ok(certificateService.getMine(authentication.getName()));
    }

    @GetMapping("/eligibility")
    public ResponseEntity<?> getEligibility(Authentication authentication) {
        return ResponseEntity.ok(certificateService.getEligibility(authentication.getName()));
    }

    @PostMapping("/claim")
    public ResponseEntity<?> claim(@RequestBody ClaimRequest request, Authentication authentication) {
        return ResponseEntity.ok(certificateService.claim(authentication.getName(), request));
    }
}