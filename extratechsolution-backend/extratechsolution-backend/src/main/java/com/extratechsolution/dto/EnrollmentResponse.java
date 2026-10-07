package com.extratechsolution.dto;

import com.extratechsolution.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EnrollmentResponse {

    private Long courseId;
    private String courseTitle;
    private Difficulty courseDifficulty;
    private int totalProblems;
    private int solvedProblems;
    private int progressPercent;
}
