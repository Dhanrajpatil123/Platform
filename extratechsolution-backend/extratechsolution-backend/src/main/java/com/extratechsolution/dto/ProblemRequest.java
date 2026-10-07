package com.extratechsolution.dto;



import com.extratechsolution.enums.Difficulty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProblemRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Description is required")
    private String description;

    @NotEmpty(message = "At least one example is required")
    @Valid
    private List<ExampleDto> examples;

    private List<String> constraints;

    private List<String> tags;

    private Boolean premium;
}
