package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class BootcampSummaryResponse {
    private Long id;
    private String title;
    private String mode;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private int seats;
    private int enrolledCount;
    private int courseCount;
    private boolean published;
    private boolean enrolled;
    private int fee;
    private Long revenue;   // only filled in for admins, null for students
}