package com.extratechsolution.entity;

import com.extratechsolution.enums.CertificateType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "certificates",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "type", "reference_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String certificateCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CertificateType type;

    // id of the course or bootcamp (kept as a plain id so certificates survive deletion of the source)
    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    // snapshots taken at issue time
    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String recipientName;

    @Column(length = 255)
    private String detail;

    @Column(nullable = false)
    private LocalDate issuedDate;

    @Column(nullable = false)
    private LocalDate completionDate;

    @Column(nullable = false)
    private boolean revoked = false;

    private String revokedReason;

    private LocalDateTime revokedAt;
}