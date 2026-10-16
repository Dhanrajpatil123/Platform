package com.extratechsolution.service;

import com.extratechsolution.dto.*;
import com.extratechsolution.entity.*;
import com.extratechsolution.enums.CertificateType;
import com.extratechsolution.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final Pattern NAME = Pattern.compile("^\\p{L}[\\p{L} .'\\-]{2,59}$");
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    @Value("${certificate.min-attendance-percent:75}")
    private int minAttendancePercent;

    private final CertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final BootcampRepository bootcampRepository;
    private final BootcampEnrollmentRepository bootcampEnrollmentRepository;
    private final BootcampSessionRepository sessionRepository;
    private final BootcampAttendanceRepository attendanceRepository;
    private final TrackRepository trackRepository;
    private final TrackEnrollmentRepository trackEnrollmentRepository;
    private final CourseProgressService progressService;
    private final NotificationService notificationService;

    private record Eval(boolean eligible, String status, String label, int percent,
                        String message, LocalDate completionDate, String detail) {}

    // ---------- Student ----------

    @Transactional(readOnly = true)
    public List<CertificateResponse> getMine(String username) {
        User user = requireUser(username);
        return certificateRepository.findByUser_IdOrderByIssuedDateDescIdDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EligibilityItemResponse> getEligibility(String username) {
        User user = requireUser(username);

        Map<String, Certificate> issued = new HashMap<>();
        for (Certificate c : certificateRepository.findByUser_IdOrderByIssuedDateDescIdDesc(user.getId())) {
            issued.putIfAbsent(key(c.getType(), c.getReferenceId()), c);
        }

        List<EligibilityItemResponse> items = new ArrayList<>();

        for (CourseEnrollment e : courseEnrollmentRepository.findByUser(user)) {
            Course course = e.getCourse();
            items.add(item(CertificateType.COURSE, course.getId(), course.getTitle(),
                    evaluateCourse(user, course, e.getEnrolledAt()),
                    issued.get(key(CertificateType.COURSE, course.getId()))));
        }
        for (BootcampEnrollment e : bootcampEnrollmentRepository.findByUser(user)) {
            Bootcamp bootcamp = e.getBootcamp();
            items.add(item(CertificateType.BOOTCAMP, bootcamp.getId(), bootcamp.getTitle(),
                    evaluateBootcamp(user, bootcamp),
                    issued.get(key(CertificateType.BOOTCAMP, bootcamp.getId()))));
        }
        for (TrackEnrollment e : trackEnrollmentRepository.findByUser(user)) {
            Track track = e.getTrack();
            items.add(item(CertificateType.TRACK, track.getId(), track.getTitle(),
                    evaluateTrack(user, track, e.getEnrolledAt()),
                    issued.get(key(CertificateType.TRACK, track.getId()))));
        }

        items.sort(Comparator.comparingInt(i -> rank(i.getStatus())));
        return items;
    }

    @Transactional
    public CertificateResponse claim(String username, ClaimRequest request) {
        User user = requireUser(username);
        if (request.getType() == null || request.getReferenceId() == null) {
            throw new IllegalArgumentException("Choose what you want a certificate for.");
        }
        String name = cleanName(request.getRecipientName());

        Optional<Certificate> existing = certificateRepository
                .findByUser_IdAndTypeAndReferenceId(user.getId(), request.getType(), request.getReferenceId());
        if (existing.isPresent()) {
            if (existing.get().isRevoked()) {
                throw new IllegalStateException("This certificate was revoked. Please contact the administrator.");
            }
            return toResponse(existing.get());
        }

        Eval eval;
        String title;
        switch (request.getType()) {
            case COURSE -> {
                Course course = courseRepository.findById(request.getReferenceId())
                        .orElseThrow(() -> new NoSuchElementException("Course not found."));
                CourseEnrollment enrollment = courseEnrollmentRepository.findByUserAndCourse(user, course)
                        .orElseThrow(() -> new IllegalStateException("You must be enrolled in this course."));
                eval = evaluateCourse(user, course, enrollment.getEnrolledAt());
                title = course.getTitle();
            }
            case BOOTCAMP -> {
                Bootcamp bootcamp = bootcampRepository.findById(request.getReferenceId())
                        .orElseThrow(() -> new NoSuchElementException("Bootcamp not found."));
                if (!bootcampEnrollmentRepository.existsByUserAndBootcamp(user, bootcamp)) {
                    throw new IllegalStateException("You must be enrolled in this bootcamp.");
                }
                eval = evaluateBootcamp(user, bootcamp);
                title = bootcamp.getTitle();
            }
            default -> {
                Track track = trackRepository.findById(request.getReferenceId())
                        .orElseThrow(() -> new NoSuchElementException("Track not found."));
                TrackEnrollment enrollment = trackEnrollmentRepository.findByUserAndTrack(user, track)
                        .orElseThrow(() -> new IllegalStateException("You must be enrolled in this track."));
                eval = evaluateTrack(user, track, enrollment.getEnrolledAt());
                title = track.getTitle();
            }
        }

        if (!eval.eligible()) {
            throw new IllegalStateException(eval.message());
        }

        Certificate certificate = new Certificate();
        certificate.setCertificateCode(generateCode(request.getType()));
        certificate.setUser(user);
        certificate.setType(request.getType());
        certificate.setReferenceId(request.getReferenceId());
        certificate.setTitle(title);
        certificate.setRecipientName(name);
        certificate.setDetail(eval.detail());
        certificate.setIssuedDate(LocalDate.now());
        certificate.setCompletionDate(eval.completionDate());
        certificateRepository.save(certificate);

        notificationService.certificateIssued(user, name, title, certificate.getCertificateCode());

        return toResponse(certificate);
    }

    // ---------- Public verification ----------

    @Transactional(readOnly = true)
    public PublicCertificateResponse verify(String code) {
        Certificate c = certificateRepository.findByCertificateCode(code.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new NoSuchElementException("No certificate found with that ID."));

        if (c.isRevoked()) {
            return new PublicCertificateResponse(false, c.getCertificateCode(), null, null, null, null,
                    null, null, "ExtraTech Solution", "This certificate has been revoked and is no longer valid.");
        }
        return new PublicCertificateResponse(true, c.getCertificateCode(), c.getType().name(), c.getTitle(),
                c.getRecipientName(), c.getDetail(), c.getIssuedDate(), c.getCompletionDate(),
                "ExtraTech Solution", "This certificate is authentic.");
    }

    // ---------- Admin ----------

    @Transactional(readOnly = true)
    public List<AdminCertificateResponse> adminList(String q) {
        String needle = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return certificateRepository.findAllByOrderByIdDesc().stream()
                .filter(c -> needle.isEmpty()
                        || c.getCertificateCode().toLowerCase(Locale.ROOT).contains(needle)
                        || c.getRecipientName().toLowerCase(Locale.ROOT).contains(needle)
                        || c.getTitle().toLowerCase(Locale.ROOT).contains(needle)
                        || c.getUser().getUsername().toLowerCase(Locale.ROOT).contains(needle))
                .map(this::toAdminResponse)
                .toList();
    }

    @Transactional
    public AdminCertificateResponse revoke(Long id, String reason) {
        Certificate c = certificateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Certificate not found."));
        String clean = reason == null || reason.isBlank() ? "Revoked by administrator" : reason.trim();
        c.setRevoked(true);
        c.setRevokedReason(clean.length() > 255 ? clean.substring(0, 255) : clean);
        c.setRevokedAt(LocalDateTime.now());
        certificateRepository.save(c);
        return toAdminResponse(c);
    }

    @Transactional
    public AdminCertificateResponse reinstate(Long id) {
        Certificate c = certificateRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Certificate not found."));
        c.setRevoked(false);
        c.setRevokedReason(null);
        c.setRevokedAt(null);
        certificateRepository.save(c);
        return toAdminResponse(c);
    }

    // ---------- Eligibility rules ----------

    private Eval evaluateCourse(User user, Course course, LocalDateTime enrolledAt) {
        Set<Long> solvedIds = progressService.solvedProblemIdsSince(user, enrolledAt);
        int total = course.getSyllabus().size();
        int solved = (int) course.getSyllabus().stream()
                .filter(cp -> solvedIds.contains(cp.getProblem().getId()))
                .count();
        int percent = total == 0 ? 0 : solved * 100 / total;
        String label = solved + " of " + total + " problems solved";

        if (total == 0) {
            return new Eval(false, "NOT_ELIGIBLE", label, 0, "This course has no problems yet.", null, null);
        }
        if (solved < total) {
            return new Eval(false, "IN_PROGRESS", label, percent,
                    "Solve all " + total + " problems after enrolling to unlock your certificate ("
                            + (total - solved) + " to go).", null, null);
        }
        String detail = "All " + total + " problems solved · "
                + capitalize(String.valueOf(course.getDifficulty())) + " level";
        return new Eval(true, "ELIGIBLE", label, 100,
                "You've solved every problem — claim your certificate!", LocalDate.now(), detail);
    }

    private Eval evaluateTrack(User user, Track track, LocalDateTime enrolledAt) {
        CourseProgressService.Stats stats = progressService.stats(user, track.getCourses(), enrolledAt);
        int courses = track.getCourses().size();
        String label = stats.solvedProblems() + " of " + stats.totalProblems()
                + " problems solved across " + courses + " courses";

        if (stats.totalProblems() == 0) {
            return new Eval(false, "NOT_ELIGIBLE", label, 0, "This track has no problems yet.", null, null);
        }
        if (!stats.complete()) {
            return new Eval(false, "IN_PROGRESS", label, stats.percent(),
                    "Solve all " + stats.totalProblems() + " problems in the track to unlock your certificate ("
                            + (stats.totalProblems() - stats.solvedProblems()) + " to go).", null, null);
        }
        String detail = courses + " courses · " + stats.totalProblems() + " problems solved";
        return new Eval(true, "ELIGIBLE", label, 100,
                "You completed the whole track — claim your certificate!", LocalDate.now(), detail);
    }

    private Eval evaluateBootcamp(User user, Bootcamp bootcamp) {
        LocalDate today = LocalDate.now();
        int total = sessionRepository.findByBootcamp_IdOrderBySessionDateAscStartTimeAsc(bootcamp.getId()).size();
        int attended = total == 0 ? 0
                : attendanceRepository.findByUser_IdAndSession_Bootcamp_Id(user.getId(), bootcamp.getId()).size();
        int percent = total == 0 ? 100 : Math.min(attended * 100 / total, 100);
        String label = total == 0
                ? "No sessions scheduled"
                : "Attendance " + percent + "% (" + attended + " of " + total + " sessions)";

        if (!today.isAfter(bootcamp.getEndDate())) {
            return new Eval(false, "IN_PROGRESS", label, total == 0 ? 0 : percent,
                    "Your certificate unlocks after the bootcamp ends on "
                            + bootcamp.getEndDate().format(DATE_FMT) + ".", null, null);
        }
        if (percent < minAttendancePercent) {
            return new Eval(false, "NOT_ELIGIBLE", label, percent,
                    "A minimum attendance of " + minAttendancePercent + "% is required — yours is "
                            + percent + "%.", null, null);
        }

        String detail = capitalize(bootcamp.getMode()) + " · "
                + bootcamp.getStartDate().format(DATE_FMT) + " – " + bootcamp.getEndDate().format(DATE_FMT)
                + (total > 0 ? " · " + percent + "% attendance" : "");
        return new Eval(true, "ELIGIBLE", label, percent,
                "You completed the bootcamp — claim your certificate!", bootcamp.getEndDate(), detail);
    }

    // ---------- Helpers ----------

    private EligibilityItemResponse item(CertificateType type, Long refId, String title, Eval eval, Certificate cert) {
        String status;
        String message;
        if (cert == null) {
            status = eval.status();
            message = eval.message();
        } else if (cert.isRevoked()) {
            status = "REVOKED";
            message = "This certificate was revoked. Please contact the administrator.";
        } else {
            status = "ISSUED";
            message = "Certificate issued on " + cert.getIssuedDate().format(DATE_FMT) + ".";
        }
        return new EligibilityItemResponse(type.name(), refId, title, status, eval.label(), eval.percent(),
                message, cert == null ? null : cert.getCertificateCode());
    }

    private int rank(String status) {
        return switch (status) {
            case "ELIGIBLE" -> 0;
            case "IN_PROGRESS" -> 1;
            case "NOT_ELIGIBLE" -> 2;
            case "ISSUED" -> 3;
            default -> 4;
        };
    }

    private String key(CertificateType type, Long referenceId) {
        return type.name() + ":" + referenceId;
    }

    private String cleanName(String raw) {
        String name = raw == null ? "" : raw.trim().replaceAll("\\s+", " ");
        if (!NAME.matcher(name).matches()) {
            throw new IllegalArgumentException("Please enter your full name (3–60 characters, letters only).");
        }
        return name;
    }

    private String generateCode(CertificateType type) {
        String kind = switch (type) {
            case COURSE -> "CR";
            case BOOTCAMP -> "BC";
            case TRACK -> "TR";
        };
        String prefix = "ETS-" + kind + "-" + Year.now().getValue() + "-";
        String code;
        do {
            StringBuilder sb = new StringBuilder(prefix);
            for (int i = 0; i < 8; i++) {
                sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
            }
            code = sb.toString();
        } while (certificateRepository.existsByCertificateCode(code));
        return code;
    }

    private String capitalize(String value) {
        if (value == null || value.isEmpty()) return "";
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1).toLowerCase(Locale.ROOT);
    }

    private User requireUser(String username) {
        if (username == null) throw new IllegalArgumentException("Please sign in first.");
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Please sign in first."));
    }

    private CertificateResponse toResponse(Certificate c) {
        return new CertificateResponse(c.getId(), c.getCertificateCode(), c.getType().name(), c.getTitle(),
                c.getRecipientName(), c.getDetail(), c.getIssuedDate(), c.getCompletionDate(), c.isRevoked());
    }

    private AdminCertificateResponse toAdminResponse(Certificate c) {
        return new AdminCertificateResponse(c.getId(), c.getCertificateCode(), c.getType().name(), c.getTitle(),
                c.getRecipientName(), c.getUser().getUsername(), c.getIssuedDate(), c.isRevoked(),
                c.getRevokedReason());
    }
}