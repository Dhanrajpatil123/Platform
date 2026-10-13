package com.extratechsolution.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BootcampEnrollRequest {
    private String paymentMethod;   // UPI, CARD or NETBANKING (ignored for free bootcamps)
}