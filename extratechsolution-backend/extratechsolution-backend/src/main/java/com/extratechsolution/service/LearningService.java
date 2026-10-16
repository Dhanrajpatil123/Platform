package com.extratechsolution.service;

import com.extratechsolution.dto.LearningResponse;
import com.extratechsolution.dto.LearningResponse.*;
import com.extratechsolution.entity.*;
import com.extratechsolution.enums.CertificateType;
import com.extratechsolution.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningService {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("EEE d MMM", Locale.ENGLISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    @Value("${certificate.min-attendance-percent:75}")
    private int minAttendancePercent;

    private final UserRepository userRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final TrackEnrollmentRepository trackEnrollmentRepository;
    private final BootcampEnrollmentRepository bootcampEnrollmentRepository;
    private final BootcampSessionRepository sessionRepository;
    private final BootcampAttendanceRepository attendanceRepository;
    private final CertificateRepository certificateRepository;
    private final CourseProgressService progressService;

    private record CertInfo(String status, String code) {}

    @Transactional(readOnly = true)
    public LearningResponse getMine(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Please sign in first."));
        LocalDateTime now = LocalDateTime.now();

        Map<String, Certificate> certs = new HashMap<>();
        for (Certificate c : certificateRepository.findByUser_IdOrderByIssuedDateDescIdDesc(user.getId())) {
            certs.putIfAbsent(c.getType().name() + ":" + c.getReferenceId(), c);
        }

        List<CourseCard> courseCards = new ArrayList<>();
        List<TrackCard> trackCards = new ArrayList<>();
        List<BootcampCard> bootcampCards = new ArrayList<>();

        NextAction sessionAction = null;
        LocalDateTime sessionActionStart = null;
        NextAction continueAction = null;
        int continuePercent = -1;
        NextAction readyAction = null;

        int active = 0;
        int completedItems = 0;

        // ---------- Courses ----------
        for (CourseEnrollment enrollment : courseEnrollmentRepository.findByUser(user)) {
            Course course = enrollment.getCourse();
            Set<Long> solved = progressService.solvedProblemIdsSince(user, enrollment.getEnrolledAt());
            List<CourseProblem> syllabus = course.getSyllabus().stream()
                    .sorted(Comparator.comparing(CourseProblem::getSequenceOrder))
                    .toList();

            int total = syllabus.size();
            int done = (int) syllabus.stream().filter(cp -> solved.contains(cp.getProblem().getId())).count();
            int percent = total == 0 ? 0 : done * 100 / total;
            boolean complete = total > 0 && done >= total;
            Problem next = syllabus.stream().map(CourseProblem::getProblem)
                    .filter(p -> !solved.contains(p.getId())).findFirst().orElse(null);

            CertInfo cert = certInfo(certs, CertificateType.COURSE, course.getId(), complete);
            courseCards.add(new CourseCard(course.getId(), course.getTitle(), String.valueOf(course.getDifficulty()),
                    done, total, percent, complete, next == null ? null : next.getId(),
                    next == null ? null : next.getTitle(), cert.status(), cert.code()));

            if (complete) completedItems++;
            else active++;

            if (!complete && next != null && percent > continuePercent) {
                continuePercent = percent;
                continueAction = new NextAction("CONTINUE", "Continue: " + next.getTitle(),
                        course.getTitle() + " · " + done + "/" + total + " solved",
                        "/problems/" + next.getId() + "?course=" + course.getId(), "Continue learning", false);
            }
            if ("READY".equals(cert.status()) && readyAction == null) {
                readyAction = readyAction(course.getTitle());
            }
        }

        // ---------- Tracks ----------
        for (TrackEnrollment enrollment : trackEnrollmentRepository.findByUser(user)) {
            Track track = enrollment.getTrack();
            Set<Long> solved = progressService.solvedProblemIdsSince(user, enrollment.getEnrolledAt());
            CourseProgressService.Stats stats =
                    progressService.stats(user, track.getCourses(), enrollment.getEnrolledAt());

            Course nextCourse = null;
            Problem nextProblem = null;
            for (Course course : track.getCourses()) {
                List<CourseProblem> syllabus = course.getSyllabus().stream()
                        .sorted(Comparator.comparing(CourseProblem::getSequenceOrder)).toList();
                Problem candidate = syllabus.stream().map(CourseProblem::getProblem)
                        .filter(p -> !solved.contains(p.getId())).findFirst().orElse(null);
                if (candidate != null) {
                    nextCourse = course;
                    nextProblem = candidate;
                    break;
                }
            }

            int coursesDone = (int) stats.courses().stream().filter(CourseProgressService.CourseStat::completed).count();
            boolean complete = stats.complete();
            CertInfo cert = certInfo(certs, CertificateType.TRACK, track.getId(), complete);

            trackCards.add(new TrackCard(track.getId(), track.getTitle(), stats.solvedProblems(),
                    stats.totalProblems(), stats.percent(), complete, coursesDone, track.getCourses().size(),
                    nextCourse == null ? null : nextCourse.getId(), nextCourse == null ? null : nextCourse.getTitle(),
                    nextProblem == null ? null : nextProblem.getId(),
                    nextProblem == null ? null : nextProblem.getTitle(), cert.status(), cert.code()));

            if (complete) completedItems++;
            else active++;

            if (!complete && nextProblem != null && stats.percent() > continuePercent) {
                continuePercent = stats.percent();
                continueAction = new NextAction("CONTINUE", "Continue: " + nextProblem.getTitle(),
                        track.getTitle() + " track · " + nextCourse.getTitle(),
                        "/problems/" + nextProblem.getId() + "?course=" + nextCourse.getId(),
                        "Continue learning", false);
            }
            if ("READY".equals(cert.status()) && readyAction == null) {
                readyAction = readyAction(track.getTitle());
            }
        }

        // ---------- Bootcamps ----------
        for (BootcampEnrollment enrollment : bootcampEnrollmentRepository.findByUser(user)) {
            Bootcamp bootcamp = enrollment.getBootcamp();
            List<BootcampSession> sessions = sessionRepository
                    .findByBootcamp_IdOrderBySessionDateAscStartTimeAsc(bootcamp.getId());
            Set<Long> attendedIds = attendanceRepository
                    .findByUser_IdAndSession_Bootcamp_Id(user.getId(), bootcamp.getId()).stream()
                    .map(a -> a.getSession().getId()).collect(Collectors.toSet());

            int completedSessions = 0;
            int attended = 0;
            BootcampSession next = null;
            for (BootcampSession s : sessions) {
                if ("COMPLETED".equals(sessionStatus(s, now))) {
                    completedSessions++;
                    if (attendedIds.contains(s.getId())) attended++;
                } else if (next == null) {
                    next = s;
                }
            }
            int percent = completedSessions == 0 ? 0 : attended * 100 / completedSessions;

            LocalDate today = now.toLocalDate();
            String status = today.isBefore(bootcamp.getStartDate()) ? "UPCOMING"
                    : today.isAfter(bootcamp.getEndDate()) ? "COMPLETED" : "ONGOING";
            boolean ended = "COMPLETED".equals(status);
            boolean eligible = ended && (sessions.isEmpty() || percent >= minAttendancePercent);
            CertInfo cert = certInfo(certs, CertificateType.BOOTCAMP, bootcamp.getId(), eligible);

            SessionInfo nextInfo = null;
            if (next != null) {
                nextInfo = new SessionInfo(next.getId(), next.getTitle(), next.getSessionDate(),
                        next.getStartTime(), next.getEndTime(), next.getLocation(), next.getMeetingLink(),
                        sessionStatus(next, now));

                LocalDateTime start = LocalDateTime.of(next.getSessionDate(), next.getStartTime());
                boolean live = "LIVE".equals(nextInfo.getStatus());
                boolean soon = !start.isBefore(now) && start.isBefore(now.plusHours(24));
                if ((live || soon) && (sessionActionStart == null || start.isBefore(sessionActionStart))) {
                    boolean hasLink = next.getMeetingLink() != null && !next.getMeetingLink().isBlank();
                    sessionActionStart = start;
                    sessionAction = new NextAction("SESSION",
                            (live ? "🔴 Live now: " : "⏰ Up next: ") + next.getTitle(),
                            bootcamp.getTitle() + " · " + next.getSessionDate().format(DAY) + ", "
                                    + next.getStartTime().format(TIME),
                            hasLink ? next.getMeetingLink() : "/bootcamps/" + bootcamp.getId(),
                            live || hasLink ? "Join session" : "View session", hasLink);
                }
            }

            bootcampCards.add(new BootcampCard(bootcamp.getId(), bootcamp.getTitle(), status,
                    bootcamp.getStartDate(), bootcamp.getEndDate(), percent, attended, completedSessions,
                    nextInfo, cert.status(), cert.code()));

            if (ended) completedItems++;
            else active++;

            if ("READY".equals(cert.status()) && readyAction == null) {
                readyAction = readyAction(bootcamp.getTitle());
            }
        }

        int earned = 0;
        int ready = 0;
        for (String s : certStatuses(courseCards, trackCards, bootcampCards)) {
            if ("ISSUED".equals(s)) earned++;
            if ("READY".equals(s)) ready++;
        }

        NextAction next = sessionAction != null ? sessionAction
                : readyAction != null ? readyAction
                : continueAction != null ? continueAction
                : (courseCards.isEmpty() && trackCards.isEmpty() && bootcampCards.isEmpty())
                ? new NextAction("START", "Start your learning journey",
                "Pick a learning track or course and begin solving problems.", "/tracks", "Browse tracks", false)
                : new NextAction("EXPLORE", "You're all caught up 🎉",
                "Nice work! Pick your next challenge.", "/courses", "Explore courses", false);

        return new LearningResponse(active, completedItems, earned, ready, next,
                courseCards, trackCards, bootcampCards);
    }

    // ---------- Helpers ----------

    private List<String> certStatuses(List<CourseCard> c, List<TrackCard> t, List<BootcampCard> b) {
        List<String> all = new ArrayList<>();
        c.forEach(x -> all.add(x.getCertificateStatus()));
        t.forEach(x -> all.add(x.getCertificateStatus()));
        b.forEach(x -> all.add(x.getCertificateStatus()));
        return all;
    }

    private CertInfo certInfo(Map<String, Certificate> certs, CertificateType type, Long id, boolean complete) {
        Certificate c = certs.get(type.name() + ":" + id);
        if (c == null) return new CertInfo(complete ? "READY" : "NONE", null);
        return c.isRevoked() ? new CertInfo("REVOKED", null) : new CertInfo("ISSUED", c.getCertificateCode());
    }

    private NextAction readyAction(String title) {
        return new NextAction("CERTIFICATE", "🎓 Your certificate is ready",
                title + " — claim it now!", "/certificates", "Claim certificate", false);
    }

    private String sessionStatus(BootcampSession s, LocalDateTime now) {
        LocalDate today = now.toLocalDate();
        LocalTime time = now.toLocalTime();
        if (s.getSessionDate().isBefore(today)) return "COMPLETED";
        if (s.getSessionDate().isAfter(today)) return "UPCOMING";
        if (time.isBefore(s.getStartTime())) return "UPCOMING";
        if (time.isAfter(s.getEndTime())) return "COMPLETED";
        return "LIVE";
    }
}