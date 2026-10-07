package com.extratechsolution.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class ContestResultResponse {

    private String contestTitle;
    private int totalProblems;
    private int solvedCount;
    private int scorePercent;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private long timeTakenMinutes;
    private String message;
    private List<String> suggestions;
    private List<ProblemResult> problems;

    @Getter
    @AllArgsConstructor
    public static class ProblemResult {
        private Long id;
        private String title;
        private String difficulty;
        private boolean solved;
    }
}