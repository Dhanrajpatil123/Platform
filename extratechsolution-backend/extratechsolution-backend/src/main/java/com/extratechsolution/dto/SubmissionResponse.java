package com.extratechsolution.dto;

import com.extratechsolution.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class SubmissionResponse {

    private Long id;
    private Long problemId;
    private String problemTitle;
    private String language;
    private SubmissionStatus status;
    private int totalTestCases;
    private int passedTestCases;
    private long executionTimeMs;
    private Integer beatsPercentage;
    private String code;
    private LocalDateTime submittedAt;
}
