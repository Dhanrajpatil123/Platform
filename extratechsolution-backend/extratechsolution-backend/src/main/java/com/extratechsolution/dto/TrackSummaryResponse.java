// TrackSummaryResponse.java
package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TrackSummaryResponse {
    private Long id;
    private String title;
    private String description;
    private boolean published;
    private int courseCount;
    private int problemCount;
    private int enrolledCount;
    private boolean enrolled;
    private int progressPercent;
}