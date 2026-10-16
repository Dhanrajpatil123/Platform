package com.extratechsolution.service;

import com.extratechsolution.dto.BootcampDetailResponse;
import com.extratechsolution.dto.BootcampEnrollRequest;
import com.extratechsolution.dto.BootcampRequest;
import com.extratechsolution.dto.BootcampSummaryResponse;
import com.extratechsolution.entity.*;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BootcampService {

    private static final Set<String> MODES = Set.of("ONLINE", "OFFLINE", "HYBRID");
    private static final int MAX_FEE = 1_000_000;

    private final BootcampRepository bootcampRepository;
    private final BootcampEnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final BootcampPaymentService paymentService;
    private final BootcampSessionRepository sessionRepository;
    private final BootcampAttendanceRepository attendanceRepository;

    private final NotificationService notificationService;

    // ---------- Public / student ----------

    @Transactional(readOnly = true)
    public List<BootcampSummaryResponse> getAll(String username) {
        User viewer = resolve(username);
        boolean admin = isAdmin(viewer);
        return bootcampRepository.findAll().stream()
                .filter(b -> admin || b.isPublished())
                .sorted(Comparator.comparing(Bootcamp::getStartDate).reversed())
                .map(b -> toSummary(b, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public BootcampDetailResponse getById(Long id, String username) {
        User viewer = resolve(username);
        return toDetail(findVisible(id, viewer), viewer);
    }

    @Transactional(readOnly = true)
    public List<BootcampSummaryResponse> getMine(String username) {
        User user = requireUser(username);
        return enrollmentRepository.findByUser(user).stream()
                .map(BootcampEnrollment::getBootcamp)
                .sorted(Comparator.comparing(Bootcamp::getStartDate).reversed())
                .map(b -> toSummary(b, user))
                .toList();
    }

    @Transactional
    public BootcampDetailResponse enroll(Long id, BootcampEnrollRequest request, String username) {
        User user = requireUser(username);
        Bootcamp bootcamp = findVisible(id, user);

        if ("COMPLETED".equals(statusOf(bootcamp))) {
            throw new IllegalStateException("This bootcamp has already finished.");
        }
        if (enrollmentRepository.existsByUserAndBootcamp(user, bootcamp)) {
            throw new IllegalStateException("You are already enrolled in this bootcamp.");
        }
        if (enrollmentRepository.countByBootcampId(bootcamp.getId()) >= bootcamp.getSeats()) {
            throw new IllegalStateException("This bootcamp is full.");
        }

        int fee = bootcamp.getFee();
        String reference = null;
        if (fee > 0) {
            String method = request == null ? null : request.getPaymentMethod();
            reference = paymentService.charge(user, bootcamp, method);
        }

        BootcampEnrollment enrollment = new BootcampEnrollment();
        enrollment.setUser(user);
        enrollment.setBootcamp(bootcamp);
        enrollment.setAmountPaid(fee);
        enrollment.setPaymentReference(reference);
        enrollmentRepository.save(enrollment);

        notificationService.bootcampEnrolled(user, bootcamp.getId(), bootcamp.getTitle(), bootcamp.getStartDate(),
                bootcamp.getEndDate(), bootcamp.getMode(), fee, reference);

        return toDetail(bootcamp, user);
    }

    @Transactional
    public BootcampDetailResponse leave(Long id, String username) {
        User user = requireUser(username);
        Bootcamp bootcamp = findVisible(id, user);

        BootcampEnrollment enrollment = enrollmentRepository.findByUserAndBootcamp(user, bootcamp)
                .orElseThrow(() -> new IllegalStateException("You are not enrolled in this bootcamp."));
        enrollmentRepository.delete(enrollment);

        return toDetail(bootcamp, user);
    }

    // ---------- Admin ----------

    @Transactional
    public BootcampDetailResponse create(BootcampRequest request, String username) {
        Bootcamp bootcamp = new Bootcamp();
        apply(bootcamp, request);
        bootcampRepository.save(bootcamp);
        return toDetail(bootcamp, resolve(username));
    }

    @Transactional
    public BootcampDetailResponse update(Long id, BootcampRequest request, String username) {
        Bootcamp bootcamp = bootcampRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Bootcamp not found."));
        apply(bootcamp, request);
        if (request.getSeats() < enrollmentRepository.countByBootcampId(id)) {
            throw new IllegalArgumentException(
                    "Seats cannot be lower than the number of students already enrolled.");
        }
        bootcampRepository.save(bootcamp);
        return toDetail(bootcamp, resolve(username));
    }


    @Transactional
    public void delete(Long id) {
        Bootcamp bootcamp = bootcampRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Bootcamp not found."));
        for (BootcampSession s : sessionRepository.findByBootcamp_IdOrderBySessionDateAscStartTimeAsc(id)) {
            attendanceRepository.deleteBySession_Id(s.getId());
        }
        sessionRepository.deleteByBootcamp_Id(id);
        enrollmentRepository.deleteByBootcampId(id);
        bootcampRepository.delete(bootcamp);
    }


    // ---------- Helpers ----------

    private void apply(Bootcamp bootcamp, BootcampRequest r) {
        if (r.getTitle() == null || r.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }
        if (r.getDescription() == null || r.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required.");
        }
        if (r.getStartDate() == null || r.getEndDate() == null) {
            throw new IllegalArgumentException("Start and end dates are required.");
        }
        if (r.getEndDate().isBefore(r.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before the start date.");
        }
        String mode = r.getMode() == null ? "" : r.getMode().trim().toUpperCase();
        if (!MODES.contains(mode)) {
            throw new IllegalArgumentException("Mode must be ONLINE, OFFLINE or HYBRID.");
        }
        if (r.getSeats() == null || r.getSeats() < 1) {
            throw new IllegalArgumentException("Seats must be at least 1.");
        }
        int fee = r.getFee() == null ? 0 : r.getFee();
        if (fee < 0 || fee > MAX_FEE) {
            throw new IllegalArgumentException("Fee must be between 0 and " + MAX_FEE + " (0 = free).");
        }

        bootcamp.setTitle(r.getTitle().trim());
        bootcamp.setDescription(r.getDescription().trim());
        bootcamp.setStartDate(r.getStartDate());
        bootcamp.setEndDate(r.getEndDate());
        bootcamp.setMode(mode);
        bootcamp.setSeats(r.getSeats());
        bootcamp.setFee(fee);
        bootcamp.setPublished(r.getPublished() == null || r.getPublished());

        bootcamp.getCourses().clear();
        if (r.getCourseIds() != null) {
            for (Long courseId : new LinkedHashSet<>(r.getCourseIds())) {
                Course course = courseRepository.findById(courseId)
                        .orElseThrow(() -> new IllegalArgumentException("Course " + courseId + " not found."));
                bootcamp.getCourses().add(course);
            }
        }
    }

    private Bootcamp findVisible(Long id, User viewer) {
        Bootcamp bootcamp = bootcampRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Bootcamp not found."));
        if (!bootcamp.isPublished() && !isAdmin(viewer)) {
            throw new NoSuchElementException("Bootcamp not found.");
        }
        return bootcamp;
    }

    private User resolve(String username) {
        return username == null ? null : userRepository.findByUsername(username).orElse(null);
    }

    private User requireUser(String username) {
        User user = resolve(username);
        if (user == null) {
            throw new IllegalArgumentException("Please sign in first.");
        }
        return user;
    }

    private boolean isAdmin(User user) {
        return user != null && user.getRole() == Role.ADMIN;
    }

    private String statusOf(Bootcamp bootcamp) {
        LocalDate today = LocalDate.now();
        if (today.isBefore(bootcamp.getStartDate())) return "UPCOMING";
        if (today.isAfter(bootcamp.getEndDate())) return "COMPLETED";
        return "ONGOING";
    }

    private BootcampSummaryResponse toSummary(Bootcamp b, User viewer) {
        boolean enrolled = viewer != null && enrollmentRepository.existsByUserAndBootcamp(viewer, b);
        Long revenue = isAdmin(viewer) ? enrollmentRepository.sumAmountPaidByBootcampId(b.getId()) : null;
        return new BootcampSummaryResponse(
                b.getId(), b.getTitle(), b.getMode(), b.getStartDate(), b.getEndDate(),
                statusOf(b), b.getSeats(),
                (int) enrollmentRepository.countByBootcampId(b.getId()),
                b.getCourses().size(), b.isPublished(), enrolled, b.getFee(), revenue);
    }

    private BootcampDetailResponse toDetail(Bootcamp b, User viewer) {
        boolean enrolled = viewer != null && enrollmentRepository.existsByUserAndBootcamp(viewer, b);
        String reference = null;
        if (enrolled) {
            reference = enrollmentRepository.findByUserAndBootcamp(viewer, b)
                    .map(BootcampEnrollment::getPaymentReference)
                    .orElse(null);
        }
        List<BootcampDetailResponse.CourseItem> courses = b.getCourses().stream()
                .sorted(Comparator.comparing(Course::getId))
                .map(c -> new BootcampDetailResponse.CourseItem(
                        c.getId(), c.getTitle(), String.valueOf(c.getDifficulty()),
                        c.getSyllabus().size(), c.isPremium()))
                .toList();
        return new BootcampDetailResponse(
                b.getId(), b.getTitle(), b.getDescription(), b.getMode(),
                b.getStartDate(), b.getEndDate(), statusOf(b), b.getSeats(),
                (int) enrollmentRepository.countByBootcampId(b.getId()),
                b.isPublished(), enrolled, b.getFee(), reference, courses);
    }
}