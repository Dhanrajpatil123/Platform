package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class HeatmapEntry {

    private String date; // ISO yyyy-MM-dd
    private int count;
}
