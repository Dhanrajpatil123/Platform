// PublicCertificateResponse.java
package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class PublicCertificateResponse {
    private boolean valid;
    private String certificateCode;
    private String type;
    private String title;
    private String recipientName;
    private String detail;
    private LocalDate issuedDate;
    private LocalDate completionDate;
    private String issuer;
    private String message;
}