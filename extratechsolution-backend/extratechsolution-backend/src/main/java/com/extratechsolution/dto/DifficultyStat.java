package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DifficultyStat {

    private String difficulty;
    private int solved;
    private int total;
}
