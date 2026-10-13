package com.extratechsolution.controller;

import com.extratechsolution.dto.AttendanceUpdateRequest;
import com.extratechsolution.dto.BootcampSessionRequest;
import com.extratechsolution.service.BootcampSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/bootcamps")
@RequiredArgsConstructor
public class BootcampSessionController {

    private final BootcampSessionService sessionService;

    @GetMapping("/{id}/sessions")
    public ResponseEntity<?> getSchedule(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(sessionService.getSchedule(
                id, authentication != null ? authentication.getName() : null));
    }

    @PostMapping("/admin/{id}/sessions")
    public ResponseEntity<?> create(@PathVariable Long id, @RequestBody BootcampSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.create(id, request));
    }

    @PutMapping("/admin/sessions/{sessionId}")
    public ResponseEntity<?> update(@PathVariable Long sessionId, @RequestBody BootcampSessionRequest request) {
        return ResponseEntity.ok(sessionService.update(sessionId, request));
    }

    @DeleteMapping("/admin/sessions/{sessionId}")
    public ResponseEntity<?> delete(@PathVariable Long sessionId) {
        sessionService.delete(sessionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/sessions/{sessionId}/attendance")
    public ResponseEntity<?> getAttendance(@PathVariable Long sessionId) {
        return ResponseEntity.ok(sessionService.getAttendance(sessionId));
    }

    @PutMapping("/admin/sessions/{sessionId}/attendance")
    public ResponseEntity<?> saveAttendance(@PathVariable Long sessionId,
                                            @RequestBody AttendanceUpdateRequest request) {
        return ResponseEntity.ok(sessionService.saveAttendance(sessionId, request));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<?> handleNotFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }
}