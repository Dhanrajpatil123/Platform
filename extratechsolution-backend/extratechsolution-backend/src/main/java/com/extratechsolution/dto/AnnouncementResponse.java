package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AnnouncementResponse {

    private Long id;
    private String message;
    private boolean active;
    private LocalDateTime updatedAt;
}