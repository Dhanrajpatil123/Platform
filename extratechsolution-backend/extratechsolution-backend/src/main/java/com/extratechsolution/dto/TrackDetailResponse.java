// TrackDetailResponse.java
package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class TrackDetailResponse {
    private Long id;
    private String title;
    private String description;
    private boolean published;
    private boolean enrolled;
    private int enrolledCount;
    private int totalProblems;
    private int solvedProblems;
    private int progressPercent;
    private boolean complete;
    private String certificateCode;   // set once the student has claimed the certificate
    private List<CourseItem> courses;

    @Getter
    @AllArgsConstructor
    public static class CourseItem {
        private Long id;
        private String title;
        private String difficulty;
        private boolean premium;
        private int totalProblems;
        private int solvedProblems;
        private String status;   // NOT_STARTED, IN_PROGRESS, COMPLETED
    }
}