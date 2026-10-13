// CertificateResponse.java
package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class CertificateResponse {
    private Long id;
    private String certificateCode;
    private String type;
    private String title;
    private String recipientName;
    private String detail;
    private LocalDate issuedDate;
    private LocalDate completionDate;
    private boolean revoked;
}