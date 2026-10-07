package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PlanResponse {

    private String code;
    private String label;
    private int days;
    private int priceInr;
}
