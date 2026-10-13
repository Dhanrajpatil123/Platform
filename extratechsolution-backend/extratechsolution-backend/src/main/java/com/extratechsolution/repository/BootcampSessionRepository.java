package com.extratechsolution.repository;

import com.extratechsolution.entity.BootcampSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BootcampSessionRepository extends JpaRepository<BootcampSession, Long> {

    List<BootcampSession> findByBootcamp_IdOrderBySessionDateAscStartTimeAsc(Long bootcampId);

    void deleteByBootcamp_Id(Long bootcampId);
}