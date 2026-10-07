package com.extratechsolution.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExampleDto {

    @NotBlank(message = "Example input is required")
    private String input;

    @NotBlank(message = "Example output is required")
    private String output;
}
