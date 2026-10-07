package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ContestLeaderboardEntryResponse {

    private String username;
    private int solvedCount;
    private int totalProblems;
    private Long timeTakenMinutes; // null while still in progress
    private String status; // IN_PROGRESS or ENDED
}