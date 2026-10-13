// AttendanceRowResponse.java
package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AttendanceRowResponse {
    private Long userId;
    private String username;
    private boolean present;
}