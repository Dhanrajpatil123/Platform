package com.extratechsolution.dto;

import com.extratechsolution.enums.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class ProblemResponse {

    private Long id;
    private String title;
    private Difficulty difficulty;
    private String category;
    private String description;
    private List<ExampleDto> examples;
    private List<String> constraints;
    private List<String> tags;
    private boolean premium;
    private boolean locked;
    private String lockMessage;
    private Long contestId;
    private boolean bookmarked;
    private LocalDateTime createdAt;

}
