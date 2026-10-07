package com.extratechsolution.dto;

import com.extratechsolution.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class ContestDetailResponse {

    private Long id;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private Integer warningLimit;
    private String status;
    private boolean registered;
    private List<ContestProblemItem> problems;

    @Getter
    @AllArgsConstructor
    public static class ContestProblemItem {
        private Long id;
        private String title;
        private Difficulty difficulty;
        private boolean locked;
        private String lockMessage;
    }
}