package com.extratechsolution.repository;

import com.extratechsolution.entity.Certificate;
import com.extratechsolution.enums.CertificateType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    List<Certificate> findByUser_IdOrderByIssuedDateDescIdDesc(Long userId);

    Optional<Certificate> findByCertificateCode(String certificateCode);

    boolean existsByCertificateCode(String certificateCode);

    Optional<Certificate> findByUser_IdAndTypeAndReferenceId(Long userId, CertificateType type, Long referenceId);

    List<Certificate> findAllByOrderByIdDesc();
}