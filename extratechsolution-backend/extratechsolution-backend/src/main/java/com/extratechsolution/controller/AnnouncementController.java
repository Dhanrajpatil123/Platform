package com.extratechsolution.controller;

import com.extratechsolution.dto.AnnouncementRequest;
import com.extratechsolution.dto.AnnouncementResponse;
import com.extratechsolution.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping("/api/announcements/active")
    public ResponseEntity<AnnouncementResponse> getActive() {
        AnnouncementResponse response = announcementService.getActivePublic();
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.noContent().build();
    }

    @GetMapping("/api/admin/announcements")
    public ResponseEntity<AnnouncementResponse> getCurrentAdmin() {
        AnnouncementResponse response = announcementService.getCurrentAdmin();
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.noContent().build();
    }

    @PutMapping("/api/admin/announcements")
    public ResponseEntity<AnnouncementResponse> update(@Valid @RequestBody AnnouncementRequest request) {
        return ResponseEntity.ok(announcementService.update(request));
    }
}