package com.extratechsolution.dto;

import com.extratechsolution.enums.AcademicYear;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateYearRequest {

    private AcademicYear year; // null is allowed, to clear it
}