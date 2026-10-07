package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PlatformStatsResponse {

    private long totalProblems;
    private long totalCourses;
    private long totalContests;
    private long totalStudents;
}