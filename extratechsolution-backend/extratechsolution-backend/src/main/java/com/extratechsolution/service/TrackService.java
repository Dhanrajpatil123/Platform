package com.extratechsolution.service;

import com.extratechsolution.dto.TrackDetailResponse;
import com.extratechsolution.dto.TrackRequest;
import com.extratechsolution.dto.TrackSummaryResponse;
import com.extratechsolution.entity.*;
import com.extratechsolution.enums.CertificateType;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TrackService {

    private final TrackRepository trackRepository;
    private final TrackEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CertificateRepository certificateRepository;
    private final CourseProgressService progressService;
    private final NotificationService notificationService;

    // ---------- Student ----------

    @Transactional(readOnly = true)
    public List<TrackSummaryResponse> getAll(String username) {
        User viewer = resolve(username);
        boolean admin = isAdmin(viewer);
        return trackRepository.findAll().stream()
                .filter(t -> admin || t.isPublished())
                .sorted(Comparator.comparing(Track::getId).reversed())
                .map(t -> toSummary(t, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public TrackDetailResponse getById(Long id, String username) {
        User viewer = resolve(username);
        return toDetail(findVisible(id, viewer), viewer);
    }

    @Transactional
    public TrackDetailResponse enroll(Long id, String username) {
        User user = requireUser(username);
        Track track = findVisible(id, user);

        if (track.getCourses().isEmpty()) {
            throw new IllegalStateException("This track has no courses yet.");
        }
        if (enrollmentRepository.existsByUserAndTrack(user, track)) {
            throw new IllegalStateException("You are already enrolled in this track.");
        }

        TrackEnrollment enrollment = new TrackEnrollment();
        enrollment.setUser(user);
        enrollment.setTrack(track);
        enrollmentRepository.save(enrollment);

        CourseProgressService.Stats stats = progressService.stats(user, track.getCourses(), null);
        notificationService.trackEnrolled(user, track.getId(), track.getTitle(),
                track.getCourses().size(), stats.totalProblems());

        return toDetail(track, user);
    }

    // ---------- Admin ----------

    @Transactional
    public TrackDetailResponse create(TrackRequest request, String username) {
        Track track = new Track();
        apply(track, request);
        trackRepository.save(track);
        return toDetail(track, resolve(username));
    }

    @Transactional
    public TrackDetailResponse update(Long id, TrackRequest request, String username) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Track not found."));
        apply(track, request);
        trackRepository.save(track);
        return toDetail(track, resolve(username));
    }

    @Transactional
    public void delete(Long id) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Track not found."));
        enrollmentRepository.deleteByTrackId(id);
        trackRepository.delete(track);
    }

    // ---------- Helpers ----------

    private void apply(Track track, TrackRequest r) {
        if (r.getTitle() == null || r.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }
        if (r.getDescription() == null || r.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required.");
        }
        if (r.getCourseIds() == null || r.getCourseIds().isEmpty()) {
            throw new IllegalArgumentException("Add at least one course to the track.");
        }

        track.setTitle(r.getTitle().trim());
        track.setDescription(r.getDescription().trim());
        track.setPublished(r.getPublished() == null || r.getPublished());

        track.getCourses().clear();
        for (Long courseId : new LinkedHashSet<>(r.getCourseIds())) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new IllegalArgumentException("Course " + courseId + " not found."));
            track.getCourses().add(course);
        }
    }

    private Track findVisible(Long id, User viewer) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Track not found."));
        if (!track.isPublished() && !isAdmin(viewer)) {
            throw new NoSuchElementException("Track not found.");
        }
        return track;
    }

    private User resolve(String username) {
        return username == null ? null : userRepository.findByUsername(username).orElse(null);
    }

    private User requireUser(String username) {
        User user = resolve(username);
        if (user == null) throw new IllegalArgumentException("Please sign in first.");
        return user;
    }

    private boolean isAdmin(User user) {
        return user != null && user.getRole() == Role.ADMIN;
    }

    private LocalDateTime enrolledAt(User viewer, Track track) {
        if (viewer == null) return null;
        return enrollmentRepository.findByUserAndTrack(viewer, track)
                .map(TrackEnrollment::getEnrolledAt)
                .orElse(null);
    }

    private TrackSummaryResponse toSummary(Track t, User viewer) {
        LocalDateTime since = enrolledAt(viewer, t);
        CourseProgressService.Stats stats = progressService.stats(viewer, t.getCourses(), since);
        return new TrackSummaryResponse(t.getId(), t.getTitle(), t.getDescription(), t.isPublished(),
                t.getCourses().size(), stats.totalProblems(), (int) enrollmentRepository.countByTrackId(t.getId()),
                since != null, since != null ? stats.percent() : 0);
    }

    private TrackDetailResponse toDetail(Track t, User viewer) {
        LocalDateTime since = enrolledAt(viewer, t);
        boolean enrolled = since != null;
        CourseProgressService.Stats stats = progressService.stats(viewer, t.getCourses(), since);

        String certificateCode = null;
        if (viewer != null) {
            certificateCode = certificateRepository
                    .findByUser_IdAndTypeAndReferenceId(viewer.getId(), CertificateType.TRACK, t.getId())
                    .filter(c -> !c.isRevoked())
                    .map(Certificate::getCertificateCode)
                    .orElse(null);
        }

        List<TrackDetailResponse.CourseItem> items = stats.courses().stream()
                .map(c -> new TrackDetailResponse.CourseItem(c.id(), c.title(), c.difficulty(), c.premium(),
                        c.total(), c.solved(),
                        c.completed() ? "COMPLETED" : c.solved() > 0 ? "IN_PROGRESS" : "NOT_STARTED"))
                .toList();

        return new TrackDetailResponse(t.getId(), t.getTitle(), t.getDescription(), t.isPublished(), enrolled,
                (int) enrollmentRepository.countByTrackId(t.getId()), stats.totalProblems(),
                enrolled ? stats.solvedProblems() : 0, enrolled ? stats.percent() : 0,
                enrolled && stats.complete(), certificateCode, items);
    }
}