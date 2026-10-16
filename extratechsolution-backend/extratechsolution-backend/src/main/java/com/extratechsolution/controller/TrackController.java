package com.extratechsolution.controller;

import com.extratechsolution.dto.TrackRequest;
import com.extratechsolution.service.TrackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/tracks")
@RequiredArgsConstructor
public class TrackController {

    private final TrackService trackService;

    private String name(Authentication authentication) {
        return authentication != null ? authentication.getName() : null;
    }

    @GetMapping
    public ResponseEntity<?> getAll(Authentication authentication) {
        return ResponseEntity.ok(trackService.getAll(name(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(trackService.getById(id, name(authentication)));
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<?> enroll(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(trackService.enroll(id, name(authentication)));
    }

    @PostMapping("/admin")
    public ResponseEntity<?> create(@RequestBody TrackRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(trackService.create(request, name(authentication)));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody TrackRequest request,
                                    Authentication authentication) {
        return ResponseEntity.ok(trackService.update(id, request, name(authentication)));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        trackService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<?> notFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> badRequest(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> conflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }
}