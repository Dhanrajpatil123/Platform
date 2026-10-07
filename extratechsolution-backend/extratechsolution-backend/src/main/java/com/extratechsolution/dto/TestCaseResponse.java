package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TestCaseResponse {

    private Long id;
    private String input;
    private String expectedOutput;
}
