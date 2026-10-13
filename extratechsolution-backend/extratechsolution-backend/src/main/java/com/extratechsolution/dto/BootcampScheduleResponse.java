// BootcampScheduleResponse.java
package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class BootcampScheduleResponse {
    private List<BootcampSessionResponse> sessions;
    private boolean enrolled;
    private boolean linksVisible;
    private int attendedCount;
    private int completedSessions;
    private int attendancePercent;
}