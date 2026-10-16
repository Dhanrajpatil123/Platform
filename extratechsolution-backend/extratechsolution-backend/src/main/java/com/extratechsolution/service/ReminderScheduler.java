package com.extratechsolution.service;

import com.extratechsolution.entity.*;
import com.extratechsolution.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReminderScheduler {

    private record Candidate(User user, Course course, int solved, int total) {
        double ratio() {
            return total == 0 ? 0 : (double) solved / total;
        }
    }

    private final BootcampSessionRepository sessionRepository;
    private final BootcampEnrollmentRepository bootcampEnrollmentRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final SubmissionRepository submissionRepository;
    private final CourseProgressService progressService;
    private final NotificationService notificationService;

    /** Every 15 minutes: remind enrolled students about sessions starting within 24 hours. */
    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void sendSessionReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime limit = now.plusHours(24);

        List<BootcampSession> candidates = sessionRepository
                .findByReminderSentFalseAndSessionDateBetween(now.toLocalDate(), limit.toLocalDate());

        for (BootcampSession session : candidates) {
            LocalDateTime start = LocalDateTime.of(session.getSessionDate(), session.getStartTime());
            if (start.isBefore(now) || start.isAfter(limit)) continue;

            Bootcamp bootcamp = session.getBootcamp();
            for (BootcampEnrollment enrollment : bootcampEnrollmentRepository.findByBootcampId(bootcamp.getId())) {
                notificationService.sessionReminder(enrollment.getUser(), bootcamp.getId(), bootcamp.getTitle(),
                        session.getTitle(), session.getSessionDate(), session.getStartTime(), session.getEndTime(),
                        session.getLocation(), session.getMeetingLink());
            }
            session.setReminderSent(true);
            log.info("Session reminders queued for '{}' ({})", session.getTitle(), bootcamp.getTitle());
        }
    }

    /** Mondays 10:00: nudge students who joined a course but have been inactive for a week. */
    @Scheduled(cron = "0 0 10 * * MON")
    @Transactional(readOnly = true)
    public void sendCourseNudges() {
        LocalDateTime now = LocalDateTime.now();
        Map<Long, LocalDateTime> lastActivity = new HashMap<>();
        Map<Long, Candidate> bestPerUser = new HashMap<>();

        for (CourseEnrollment enrollment : courseEnrollmentRepository.findAll()) {
            if (enrollment.getEnrolledAt().isAfter(now.minusDays(3))) continue;

            User user = enrollment.getUser();
            Course course = enrollment.getCourse();
            int total = course.getSyllabus().size();
            if (total == 0) continue;

            Set<Long> solvedIds = progressService.solvedProblemIdsSince(user, enrollment.getEnrolledAt());
            int solved = (int) course.getSyllabus().stream()
                    .filter(cp -> solvedIds.contains(cp.getProblem().getId()))
                    .count();
            if (solved >= total) continue;

//            LocalDateTime last = lastActivity.computeIfAbsent(user.getId(), id ->
//                    submissionRepository.findByUserOrderBySubmittedAtDesc(user).stream()
//                            .findFirst().map(Submission::getSubmittedAt).orElse(null));

            LocalDateTime last = lastActivity.computeIfAbsent(user.getId(), id ->
                    submissionRepository.findLastSubmittedAt(id));
            if (last != null && last.isAfter(now.minusDays(7))) continue;

            Candidate candidate = new Candidate(user, course, solved, total);
            Candidate existing = bestPerUser.get(user.getId());
            if (existing == null || candidate.ratio() > existing.ratio()) {
                bestPerUser.put(user.getId(), candidate);
            }
        }

        for (Candidate c : bestPerUser.values()) {
            notificationService.courseNudge(c.user(), c.course().getId(), c.course().getTitle(), c.solved(), c.total());
        }
        log.info("Course nudges queued for {} students", bestPerUser.size());
    }
}