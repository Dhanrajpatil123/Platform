package com.extratechsolution.service;

import com.extratechsolution.dto.*;
import com.extratechsolution.entity.*;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BootcampSessionService {

    private static final Pattern URL = Pattern.compile("^https?://\\S+$", Pattern.CASE_INSENSITIVE);

    private final BootcampRepository bootcampRepository;
    private final BootcampSessionRepository sessionRepository;
    private final BootcampAttendanceRepository attendanceRepository;
    private final BootcampEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    // ---------- Student / admin read ----------

    @Transactional(readOnly = true)
    public BootcampScheduleResponse getSchedule(Long bootcampId, String username) {
        User viewer = requireUser(username);
        boolean admin = viewer.getRole() == Role.ADMIN;

        Bootcamp bootcamp = bootcampRepository.findById(bootcampId)
                .orElseThrow(() -> new NoSuchElementException("Bootcamp not found."));
        if (!bootcamp.isPublished() && !admin) {
            throw new NoSuchElementException("Bootcamp not found.");
        }

        boolean enrolled = enrollmentRepository.existsByUserAndBootcamp(viewer, bootcamp);
        boolean linksVisible = admin || enrolled;

        Set<Long> attendedSessionIds = enrolled
                ? attendanceRepository.findByUser_IdAndSession_Bootcamp_Id(viewer.getId(), bootcampId).stream()
                .map(a -> a.getSession().getId())
                .collect(Collectors.toSet())
                : Set.of();

        List<BootcampSessionResponse> responses = new ArrayList<>();
        int completed = 0;
        int attendedCompleted = 0;

        for (BootcampSession s : sessionRepository.findByBootcamp_IdOrderBySessionDateAscStartTimeAsc(bootcampId)) {
            String status = statusOf(s);
            Boolean attended = enrolled ? attendedSessionIds.contains(s.getId()) : null;
            if ("COMPLETED".equals(status)) {
                completed++;
                if (Boolean.TRUE.equals(attended)) attendedCompleted++;
            }
            responses.add(toResponse(s, linksVisible, attended, status));
        }

        int percent = completed == 0 ? 0 : Math.min(attendedCompleted * 100 / completed, 100);
        return new BootcampScheduleResponse(responses, enrolled, linksVisible, attendedCompleted, completed, percent);
    }

    // ---------- Admin ----------

    @Transactional
    public BootcampSessionResponse create(Long bootcampId, BootcampSessionRequest request) {
        Bootcamp bootcamp = bootcampRepository.findById(bootcampId)
                .orElseThrow(() -> new NoSuchElementException("Bootcamp not found."));
        BootcampSession session = new BootcampSession();
        session.setBootcamp(bootcamp);
        apply(session, request, bootcamp);
        sessionRepository.save(session);
        return toResponse(session, true, null, statusOf(session));
    }

    @Transactional
    public BootcampSessionResponse update(Long sessionId, BootcampSessionRequest request) {
        BootcampSession session = findSession(sessionId);
        apply(session, request, session.getBootcamp());
        sessionRepository.save(session);
        return toResponse(session, true, null, statusOf(session));
    }

    @Transactional
    public void delete(Long sessionId) {
        BootcampSession session = findSession(sessionId);
        attendanceRepository.deleteBySession_Id(sessionId);
        sessionRepository.delete(session);
    }

    @Transactional(readOnly = true)
    public List<AttendanceRowResponse> getAttendance(Long sessionId) {
        BootcampSession session = findSession(sessionId);
        Set<Long> present = attendanceRepository.findBySession_Id(sessionId).stream()
                .map(a -> a.getUser().getId())
                .collect(Collectors.toSet());

        return enrollmentRepository.findByBootcampId(session.getBootcamp().getId()).stream()
                .map(BootcampEnrollment::getUser)
                .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
                .map(u -> new AttendanceRowResponse(u.getId(), u.getUsername(), present.contains(u.getId())))
                .toList();
    }

    @Transactional
    public List<AttendanceRowResponse> saveAttendance(Long sessionId, AttendanceUpdateRequest request) {
        BootcampSession session = findSession(sessionId);

        Set<Long> enrolledIds = enrollmentRepository.findByBootcampId(session.getBootcamp().getId()).stream()
                .map(e -> e.getUser().getId())
                .collect(Collectors.toSet());

        Set<Long> requested = new HashSet<>(
                request.getPresentUserIds() == null ? List.of() : request.getPresentUserIds());
        if (!enrolledIds.containsAll(requested)) {
            throw new IllegalArgumentException("Some selected students are not enrolled in this bootcamp.");
        }

        // Diff instead of delete-all + re-insert (Hibernate runs inserts before deletes,
        // which would trip the unique constraint).
        Set<Long> alreadyPresent = new HashSet<>();
        for (BootcampAttendance existing : attendanceRepository.findBySession_Id(sessionId)) {
            Long userId = existing.getUser().getId();
            if (requested.contains(userId)) {
                alreadyPresent.add(userId);
            } else {
                attendanceRepository.delete(existing);
            }
        }
        for (Long userId : requested) {
            if (!alreadyPresent.contains(userId)) {
                BootcampAttendance record = new BootcampAttendance();
                record.setSession(session);
                record.setUser(userRepository.getReferenceById(userId));
                attendanceRepository.save(record);
            }
        }

        return getAttendance(sessionId);
    }

    // ---------- Helpers ----------

    private void apply(BootcampSession session, BootcampSessionRequest r, Bootcamp bootcamp) {
        if (r.getTitle() == null || r.getTitle().isBlank()) {
            throw new IllegalArgumentException("Session title is required.");
        }
        if (r.getSessionDate() == null || r.getStartTime() == null || r.getEndTime() == null) {
            throw new IllegalArgumentException("Date, start time and end time are required.");
        }
        if (!r.getEndTime().isAfter(r.getStartTime())) {
            throw new IllegalArgumentException("End time must be after the start time.");
        }
        if (r.getSessionDate().isBefore(bootcamp.getStartDate())
                || r.getSessionDate().isAfter(bootcamp.getEndDate())) {
            throw new IllegalArgumentException("Session date must fall within the bootcamp dates ("
                    + bootcamp.getStartDate() + " to " + bootcamp.getEndDate() + ").");
        }

        String link = r.getMeetingLink() == null ? "" : r.getMeetingLink().trim();
        if (!link.isEmpty() && !URL.matcher(link).matches()) {
            throw new IllegalArgumentException("Meeting link must start with http:// or https://");
        }

        session.setTitle(r.getTitle().trim());
        session.setDescription(r.getDescription() == null || r.getDescription().isBlank()
                ? null : r.getDescription().trim());
        session.setSessionDate(r.getSessionDate());
        session.setStartTime(r.getStartTime());
        session.setEndTime(r.getEndTime());
        session.setLocation(r.getLocation() == null || r.getLocation().isBlank() ? null : r.getLocation().trim());
        session.setMeetingLink(link.isEmpty() ? null : link);
    }

    private BootcampSession findSession(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Session not found."));
    }

    private User requireUser(String username) {
        if (username == null) throw new IllegalArgumentException("Please sign in first.");
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Please sign in first."));
    }

    private String statusOf(BootcampSession s) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        if (s.getSessionDate().isBefore(today)) return "COMPLETED";
        if (s.getSessionDate().isAfter(today)) return "UPCOMING";
        if (now.isBefore(s.getStartTime())) return "UPCOMING";
        if (now.isAfter(s.getEndTime())) return "COMPLETED";
        return "LIVE";
    }

    private BootcampSessionResponse toResponse(BootcampSession s, boolean showLink, Boolean attended, String status) {
        return new BootcampSessionResponse(
                s.getId(), s.getTitle(), s.getDescription(), s.getSessionDate(),
                s.getStartTime(), s.getEndTime(), s.getLocation(),
                showLink ? s.getMeetingLink() : null, status, attended);
    }
}