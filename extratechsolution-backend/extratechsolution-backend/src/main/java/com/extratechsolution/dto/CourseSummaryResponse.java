package com.extratechsolution.dto;

import com.extratechsolution.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CourseSummaryResponse {

    private Long id;
    private String title;
    private Difficulty difficulty;
    private String category;
    private Integer estimatedHours;
    private Integer problemCount;
    private boolean premium;
}
