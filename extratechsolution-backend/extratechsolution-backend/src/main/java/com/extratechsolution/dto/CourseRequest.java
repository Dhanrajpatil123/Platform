package com.extratechsolution.dto;

import com.extratechsolution.enums.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CourseRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Estimated hours is required")
    @Positive(message = "Estimated hours must be positive")
    private Integer estimatedHours;

    @NotEmpty(message = "A course needs at least one problem in its syllabus")
    private List<Long> problemIds;

    private Boolean premium;
}
