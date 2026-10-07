package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DashboardStatsResponse {

    private int streak;
    private long problemsSolved;
    private long totalProblems;
}
