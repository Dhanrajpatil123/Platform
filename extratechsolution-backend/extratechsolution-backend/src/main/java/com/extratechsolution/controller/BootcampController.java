package com.extratechsolution.controller;

import com.extratechsolution.dto.BootcampRequest;
import com.extratechsolution.service.BootcampService;
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
public class BootcampController {

    private final BootcampService bootcampService;

    private String name(Authentication authentication) {
        return authentication != null ? authentication.getName() : null;
    }

    @GetMapping
    public ResponseEntity<?> getAll(Authentication authentication) {
        return ResponseEntity.ok(bootcampService.getAll(name(authentication)));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMine(Authentication authentication) {
        return ResponseEntity.ok(bootcampService.getMine(name(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(bootcampService.getById(id, name(authentication)));
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<?> enroll(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(bootcampService.enroll(id, name(authentication)));
    }

    @DeleteMapping("/{id}/enroll")
    public ResponseEntity<?> leave(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(bootcampService.leave(id, name(authentication)));
    }

    @PostMapping("/admin")
    public ResponseEntity<?> create(@RequestBody BootcampRequest request, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bootcampService.create(request, name(authentication)));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody BootcampRequest request,
                                    Authentication authentication) {
        return ResponseEntity.ok(bootcampService.update(id, request, name(authentication)));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        bootcampService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<?> handleNotFound(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> handleConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }
}