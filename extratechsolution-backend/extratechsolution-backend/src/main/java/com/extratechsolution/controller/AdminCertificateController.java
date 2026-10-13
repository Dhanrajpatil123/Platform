// AdminCertificateController.java
package com.extratechsolution.controller;

import com.extratechsolution.dto.RevokeRequest;
import com.extratechsolution.service.CertificateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/certificates")
@RequiredArgsConstructor
public class AdminCertificateController {

    private final CertificateService certificateService;

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(certificateService.adminList(q));
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<?> revoke(@PathVariable Long id, @RequestBody(required = false) RevokeRequest request) {
        return ResponseEntity.ok(certificateService.revoke(id, request == null ? null : request.getReason()));
    }

    @PostMapping("/{id}/reinstate")
    public ResponseEntity<?> reinstate(@PathVariable Long id) {
        return ResponseEntity.ok(certificateService.reinstate(id));
    }
}