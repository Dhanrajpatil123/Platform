package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class SearchResultResponse {

    private List<ProblemHit> problems;
    private List<CourseHit> courses;
    private List<ContestHit> contests;

    @Getter
    @AllArgsConstructor
    public static class ProblemHit {
        private Long id;
        private String title;
        private String difficulty;
    }

    @Getter
    @AllArgsConstructor
    public static class CourseHit {
        private Long id;
        private String title;
    }

    @Getter
    @AllArgsConstructor
    public static class ContestHit {
        private Long id;
        private String title;
        private String status;
    }
}