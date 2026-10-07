package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RunResponse {

    private boolean success;
    private String output;
    private String error;
}
