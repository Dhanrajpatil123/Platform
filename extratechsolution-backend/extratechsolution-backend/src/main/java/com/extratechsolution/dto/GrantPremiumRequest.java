package com.extratechsolution.dto;

import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GrantPremiumRequest {

    @Positive(message = "Days must be a positive number")
    private int days;
}