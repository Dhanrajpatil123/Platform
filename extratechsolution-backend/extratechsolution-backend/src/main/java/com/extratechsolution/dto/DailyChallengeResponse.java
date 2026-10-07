package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DailyChallengeResponse {

    private Long problemId;
    private String title;
    private String difficulty;
}