// EligibilityItemResponse.java
package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EligibilityItemResponse {
    private String type;
    private Long referenceId;
    private String title;
    private String status;          // ELIGIBLE, IN_PROGRESS, NOT_ELIGIBLE, ISSUED, REVOKED
    private String progressLabel;
    private int progressPercent;
    private String message;
    private String certificateCode; // set when issued
}