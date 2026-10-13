// AdminCertificateResponse.java
package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class AdminCertificateResponse {
    private Long id;
    private String certificateCode;
    private String type;
    private String title;
    private String recipientName;
    private String username;
    private LocalDate issuedDate;
    private boolean revoked;
    private String revokedReason;
}