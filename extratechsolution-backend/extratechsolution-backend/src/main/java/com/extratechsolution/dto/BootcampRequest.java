package com.extratechsolution.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class BootcampRequest {
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String mode;
    private Integer seats;
    private Boolean published;
    private List<Long> courseIds;
}