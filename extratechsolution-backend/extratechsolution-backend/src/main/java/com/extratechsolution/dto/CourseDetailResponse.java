package com.extratechsolution.dto;

import com.extratechsolution.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class CourseDetailResponse {

    private Long id;
    private String title;    private Difficulty difficulty;

    private String category;
    private String description;
    private Integer estimatedHours;
    private boolean premium;
    private long enrolledCount;
    private List<SyllabusItemResponse> syllabus;

    @Getter
    @AllArgsConstructor
    public static class SyllabusItemResponse {
        private Long problemId;
        private String problemTitle;
        private Difficulty problemDifficulty;
        private Integer sequenceOrder;
        private boolean solved;
    }
}