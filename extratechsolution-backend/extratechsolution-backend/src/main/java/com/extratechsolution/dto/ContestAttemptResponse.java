package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ContestAttemptResponse {

    private String status; // NOT_STARTED, IN_PROGRESS, ENDED
    private LocalDateTime startedAt;
    private LocalDateTime deadline;
    private long remainingSeconds;
    private int warningCount;
    private int warningLimit;
}