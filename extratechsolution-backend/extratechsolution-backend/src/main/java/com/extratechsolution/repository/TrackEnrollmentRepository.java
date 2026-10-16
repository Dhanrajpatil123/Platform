// repository/TrackEnrollmentRepository.java
package com.extratechsolution.repository;

import com.extratechsolution.entity.Track;
import com.extratechsolution.entity.TrackEnrollment;
import com.extratechsolution.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrackEnrollmentRepository extends JpaRepository<TrackEnrollment, Long> {
    boolean existsByUserAndTrack(User user, Track track);
    Optional<TrackEnrollment> findByUserAndTrack(User user, Track track);
    List<TrackEnrollment> findByUser(User user);
    long countByTrackId(Long trackId);
    void deleteByTrackId(Long trackId);
}