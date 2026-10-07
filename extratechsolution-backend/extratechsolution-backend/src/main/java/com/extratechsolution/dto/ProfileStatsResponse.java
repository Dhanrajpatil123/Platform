package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ProfileStatsResponse {

    private String username;
    private Integer rank;
    private int totalUsersRanked;
    private int totalSolved;
    private int totalProblems;
    private List<DifficultyStat> difficultyBreakdown;
    private int totalActiveDays;
    private int maxStreak;
    private int submissionsInPastYear;
    private List<HeatmapEntry> heatmap;
    private List<SubmissionResponse> recentAccepted;
    private List<LanguageStat> languages;
    private List<BadgeResponse> badges;
}