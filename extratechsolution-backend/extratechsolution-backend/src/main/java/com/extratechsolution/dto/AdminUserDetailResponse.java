package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class AdminUserDetailResponse {

    private Long id;
    private String username;
    private String email;
    private String role;
    private String year;
    private boolean premiumActive;
    private LocalDateTime premiumUntil;
    private int totalProblemsSolved;
    private List<CourseEnrollmentSummary> courses;
    private List<ContestParticipationSummary> contests;

    @Getter
    @AllArgsConstructor
    public static class CourseEnrollmentSummary {
        private Long courseId;
        private String courseTitle;
        private int progressPercent;
    }

    @Getter
    @AllArgsConstructor
    public static class ContestParticipationSummary {
        private Long contestId;
        private String contestTitle;
        private String status;
        private int solvedCount;
        private int totalProblems;
    }
}