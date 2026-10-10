package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class BootcampDetailResponse {
    private Long id;
    private String title;
    private String description;
    private String mode;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private int seats;
    private int enrolledCount;
    private boolean published;
    private boolean enrolled;
    private List<CourseItem> courses;

    @Getter
    @AllArgsConstructor
    public static class CourseItem {
        private Long id;
        private String title;
        private String difficulty;
        private int problemCount;
        private boolean premium;
    }
}