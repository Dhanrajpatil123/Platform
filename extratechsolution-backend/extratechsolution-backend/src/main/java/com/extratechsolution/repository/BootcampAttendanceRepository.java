package com.extratechsolution.repository;

import com.extratechsolution.entity.BootcampAttendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BootcampAttendanceRepository extends JpaRepository<BootcampAttendance, Long> {

    List<BootcampAttendance> findBySession_Id(Long sessionId);

    List<BootcampAttendance> findByUser_IdAndSession_Bootcamp_Id(Long userId, Long bootcampId);

    void deleteBySession_Id(Long sessionId);
}