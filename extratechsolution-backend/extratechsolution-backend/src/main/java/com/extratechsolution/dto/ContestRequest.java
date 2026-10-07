package com.extratechsolution.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class ContestRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotNull(message = "Duration is required")
    @Positive(message = "Duration must be a positive number of minutes")
    private Integer durationMinutes;

    @NotNull(message = "Warning limit is required")
    @Positive(message = "Warning limit must be a positive number")
    private Integer warningLimit;

    private List<Long> problemIds;
}