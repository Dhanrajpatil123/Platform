// ClaimRequest.java
package com.extratechsolution.dto;

import com.extratechsolution.enums.CertificateType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ClaimRequest {
    private CertificateType type;
    private Long referenceId;
    private String recipientName;
}