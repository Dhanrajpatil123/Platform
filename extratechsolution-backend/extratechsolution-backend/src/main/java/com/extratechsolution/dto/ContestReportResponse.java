package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ContestReportResponse {

    private String contestTitle;
    private int totalProblems;
    private int totalRegistered;
    private int totalStarted;
    private int totalEnded;
    private List<YearStat> yearBreakdown;

    @Getter
    @AllArgsConstructor
    public static class YearStat {
        private String year;
        private int registered;
        private int started;
        private int ended;
        private double avgSolved;
        private int avgSolvedPercent;
        private Long avgTimeTakenMinutes; // null if no one has finished yet
    }
}