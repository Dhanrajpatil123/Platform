// PublicCertificateController.java
package com.extratechsolution.controller;

import com.extratechsolution.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/certificates")
@RequiredArgsConstructor
public class PublicCertificateController {

    private final CertificateService certificateService;

    @GetMapping("/{code}")
    public ResponseEntity<?> verify(@PathVariable String code) {
        return ResponseEntity.ok(certificateService.verify(code));
    }
}