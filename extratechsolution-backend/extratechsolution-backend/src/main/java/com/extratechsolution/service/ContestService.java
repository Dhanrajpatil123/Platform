package com.extratechsolution.service;

import com.extratechsolution.dto.*;
import com.extratechsolution.entity.Contest;
import com.extratechsolution.entity.ContestRegistration;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.ContestStatus;
import com.extratechsolution.enums.Role;
import com.extratechsolution.enums.SubmissionStatus;
import com.extratechsolution.repository.ContestRegistrationRepository;
import com.extratechsolution.repository.ContestRepository;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.SubmissionRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContestService {

    private final ContestRepository contestRepository;
    private final ProblemRepository problemRepository;
    private final ContestRegistrationRepository contestRegistrationRepository;
    private final UserRepository userRepository;
    private final ContestAccessService contestAccessService;
    private final SubmissionRepository submissionRepository;

    @Transactional(readOnly = true)
    public List<ContestSummaryResponse> getAllContests(String usernameOrNull) {
        User viewer = resolveViewer(usernameOrNull);

        return contestRepository.findAll().stream()
                .sorted(Comparator.comparing(Contest::getStartTime))
                .map(c -> new ContestSummaryResponse(
                        c.getId(),
                        c.getTitle(),
                        c.getDescription(),
                        c.getStartTime(),
                        c.getEndTime(),
                        c.getDurationMinutes(),
                        contestAccessService.statusOf(c).name(),
                        problemRepository.findByContestId(c.getId()).size(),
                        contestAccessService.isRegistered(viewer, c)
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContestDetailResponse getContestById(Long id, String usernameOrNull) {
        Contest contest = contestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found"));
        User viewer = resolveViewer(usernameOrNull);
        return toDetailResponse(contest, viewer);
    }

    @Transactional
    public ContestDetailResponse createContest(ContestRequest request) {
        validateTimes(request);

        Contest contest = new Contest();
        contest.setTitle(request.getTitle());
        contest.setDescription(request.getDescription());
        contest.setStartTime(request.getStartTime());
        contest.setEndTime(request.getEndTime());
        contest.setDurationMinutes(request.getDurationMinutes());
        contest.setWarningLimit(request.getWarningLimit());
        Contest saved = contestRepository.save(contest);

        attachProblems(saved, request.getProblemIds());
        return toDetailResponse(saved, null);
    }

    @Transactional
    public ContestDetailResponse updateContest(Long id, ContestRequest request) {
        validateTimes(request);

        Contest contest = contestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found"));

        contest.setTitle(request.getTitle());
        contest.setDescription(request.getDescription());
        contest.setStartTime(request.getStartTime());
        contest.setEndTime(request.getEndTime());
        contest.setDurationMinutes(request.getDurationMinutes());
        contest.setWarningLimit(request.getWarningLimit());
        Contest saved = contestRepository.save(contest);

        List<Long> newIds = request.getProblemIds() == null ? List.of() : request.getProblemIds();
        List<Problem> currentlyAttached = problemRepository.findByContestId(id);
        for (Problem p : currentlyAttached) {
            if (!newIds.contains(p.getId())) {
                p.setContest(null);
                problemRepository.save(p);
            }
        }
        attachProblems(saved, newIds);

        return toDetailResponse(saved, null);
    }

    @Transactional
    public void deleteContest(Long id) {
        if (!contestRepository.existsById(id)) {
            throw new IllegalArgumentException("Contest not found");
        }
        List<Problem> attached = problemRepository.findByContestId(id);
        for (Problem p : attached) {
            p.setContest(null);
            problemRepository.save(p);
        }
        contestRegistrationRepository.deleteByContestId(id);
        contestRepository.deleteById(id);
    }

    @Transactional
    public ContestDetailResponse register(String username, Long contestId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found"));

        if (contestAccessService.statusOf(contest) == ContestStatus.ENDED) {
            throw new IllegalArgumentException("This contest has already ended.");
        }
        if (contestAccessService.isRegistered(user, contest)) {
            throw new IllegalArgumentException("You are already registered for this contest.");
        }

        ContestRegistration registration = new ContestRegistration();
        registration.setUser(user);
        registration.setContest(contest);
        contestRegistrationRepository.save(registration);

        return toDetailResponse(contest, user);
    }

    @Transactional
    public ContestAttemptResponse startAttempt(String username, Long contestId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found"));

        if (contestAccessService.statusOf(contest) != ContestStatus.LIVE) {
            throw new IllegalArgumentException("You can only start the contest while it is live.");
        }

        ContestRegistration registration = contestRegistrationRepository.findByUserAndContest(user, contest)
                .orElseThrow(() -> new IllegalArgumentException("You must register before starting."));

        if (registration.getAttemptStartedAt() == null) {
            registration.setAttemptStartedAt(LocalDateTime.now());
            contestRegistrationRepository.save(registration);
        }

        contestAccessService.ensureAttemptFinalized(registration, contest);
        return toAttemptResponse(registration, contest);
    }

    @Transactional
    public ContestAttemptResponse getAttemptStatus(String username, Long contestId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found"));
        ContestRegistration registration = contestRegistrationRepository.findByUserAndContest(user, contest)
                .orElseThrow(() -> new IllegalArgumentException("You are not registered for this contest"));

        contestAccessService.ensureAttemptFinalized(registration, contest);
        return toAttemptResponse(registration, contest);
    }

    @Transactional
    public ContestAttemptResponse recordWarning(String username, Long contestId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found"));
        ContestRegistration registration = contestRegistrationRepository.findByUserAndContest(user, contest)
                .orElseThrow(() -> new IllegalArgumentException("You are not registered for this contest"));

        contestAccessService.ensureAttemptFinalized(registration, contest);

        if (registration.getAttemptStartedAt() != null && registration.getAttemptEndedAt() == null) {
            registration.setWarningCount(registration.getWarningCount() + 1);
            if (registration.getWarningCount() >= contest.getWarningLimit()) {
                registration.setAttemptEndedAt(LocalDateTime.now());
            }
            contestRegistrationRepository.save(registration);
        }

        return toAttemptResponse(registration, contest);
    }

    @Transactional
    public ContestResultResponse endAttempt(String username, Long contestId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found"));
        ContestRegistration registration = contestRegistrationRepository.findByUserAndContest(user, contest)
                .orElseThrow(() -> new IllegalArgumentException("You are not registered for this contest"));

        if (registration.getAttemptStartedAt() == null) {
            throw new IllegalArgumentException("You haven't started this contest yet.");
        }

        if (registration.getAttemptEndedAt() == null) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime deadline = contestAccessService.effectiveDeadline(registration, contest);
            registration.setAttemptEndedAt(now.isAfter(deadline) ? deadline : now);
            contestRegistrationRepository.save(registration);
        }

        return buildResult(user, contest, registration);
    }

    @Transactional(readOnly = true)
    public List<ContestLeaderboardEntryResponse> getLeaderboard(Long contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found"));
        List<Problem> contestProblems = problemRepository.findByContestId(contestId);
        List<ContestRegistration> registrations = contestRegistrationRepository.findByContestId(contestId);

        List<ContestLeaderboardEntryResponse> entries = new ArrayList<>();
        for (ContestRegistration reg : registrations) {
            if (reg.getAttemptStartedAt() == null) continue; // never started — not ranked

            contestAccessService.ensureAttemptFinalized(reg, contest);

            LocalDateTime start = reg.getAttemptStartedAt();
            LocalDateTime end = reg.getAttemptEndedAt() != null ? reg.getAttemptEndedAt() : LocalDateTime.now();
            int solved = countSolved(reg.getUser(), contestProblems, start, end);
            Long timeTaken = reg.getAttemptEndedAt() != null
                    ? Duration.between(start, reg.getAttemptEndedAt()).toMinutes()
                    : null;
            String status = reg.getAttemptEndedAt() != null ? "ENDED" : "IN_PROGRESS";

            entries.add(new ContestLeaderboardEntryResponse(
                    reg.getUser().getUsername(), solved, contestProblems.size(), timeTaken, status));
        }

        entries.sort(Comparator
                .comparingInt(ContestLeaderboardEntryResponse::getSolvedCount).reversed()
                .thenComparing(e -> e.getTimeTakenMinutes() == null ? Long.MAX_VALUE : e.getTimeTakenMinutes()));

        return entries;
    }

    private int countSolved(User user, List<Problem> contestProblems, LocalDateTime start, LocalDateTime end) {
        int count = 0;
        for (Problem p : contestProblems) {
            boolean solved = submissionRepository
                    .findByUserAndProblemIdOrderBySubmittedAtDesc(user, p.getId())
                    .stream()
                    .anyMatch(s -> s.getStatus() == SubmissionStatus.ACCEPTED
                            && !s.getSubmittedAt().isBefore(start)
                            && !s.getSubmittedAt().isAfter(end));
            if (solved) count++;
        }
        return count;
    }

    private void attachProblems(Contest contest, List<Long> problemIds) {
        if (problemIds == null) return;
        for (Long problemId : problemIds) {
            Problem problem = problemRepository.findById(problemId)
                    .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + problemId));
            problem.setContest(contest);
            problemRepository.save(problem);
        }
    }

    private void validateTimes(ContestRequest request) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time.");
        }
    }

    private User resolveViewer(String usernameOrNull) {
        if (usernameOrNull == null) return null;
        return userRepository.findByUsername(usernameOrNull).orElse(null);
    }

    private ContestDetailResponse toDetailResponse(Contest contest, User viewer) {
        boolean isAdmin = viewer != null && viewer.getRole() == Role.ADMIN;

        List<ContestDetailResponse.ContestProblemItem> items = problemRepository
                .findByContestId(contest.getId())
                .stream()
                .sorted(Comparator.comparing(Problem::getId))
                .map(p -> {
                    boolean locked = !contestAccessService.canAccessProblem(viewer, isAdmin, p);
                    return new ContestDetailResponse.ContestProblemItem(
                            p.getId(),
                            p.getTitle(),
                            p.getDifficulty(),
                            locked,
                            locked ? contestAccessService.lockMessageFor(p, viewer) : null
                    );
                })
                .collect(Collectors.toList());

        return new ContestDetailResponse(
                contest.getId(),
                contest.getTitle(),
                contest.getDescription(),
                contest.getStartTime(),
                contest.getEndTime(),
                contest.getDurationMinutes(),
                contest.getWarningLimit(),
                contestAccessService.statusOf(contest).name(),
                contestAccessService.isRegistered(viewer, contest),
                items
        );
    }

    private ContestAttemptResponse toAttemptResponse(ContestRegistration registration, Contest contest) {
        String status;
        LocalDateTime deadline = null;
        long remainingSeconds = 0;

        if (registration.getAttemptStartedAt() == null) {
            status = "NOT_STARTED";
        } else if (registration.getAttemptEndedAt() != null) {
            status = "ENDED";
        } else {
            status = "IN_PROGRESS";
            deadline = contestAccessService.effectiveDeadline(registration, contest);
            remainingSeconds = Math.max(Duration.between(LocalDateTime.now(), deadline).getSeconds(), 0);
        }

        return new ContestAttemptResponse(
                status,
                registration.getAttemptStartedAt(),
                deadline,
                remainingSeconds,
                registration.getWarningCount(),
                contest.getWarningLimit()
        );
    }

    private ContestResultResponse buildResult(User user, Contest contest, ContestRegistration registration) {
        List<Problem> contestProblems = problemRepository.findByContestId(contest.getId());
        LocalDateTime windowStart = registration.getAttemptStartedAt();
        LocalDateTime windowEnd = registration.getAttemptEndedAt();

        List<ContestResultResponse.ProblemResult> problemResults = new ArrayList<>();
        int solvedCount = 0;

        for (Problem p : contestProblems) {
            boolean solved = submissionRepository
                    .findByUserAndProblemIdOrderBySubmittedAtDesc(user, p.getId())
                    .stream()
                    .anyMatch(s -> s.getStatus() == SubmissionStatus.ACCEPTED
                            && !s.getSubmittedAt().isBefore(windowStart)
                            && !s.getSubmittedAt().isAfter(windowEnd));
            if (solved) solvedCount++;
            problemResults.add(new ContestResultResponse.ProblemResult(
                    p.getId(), p.getTitle(), p.getDifficulty().name(), solved));
        }

        int total = contestProblems.size();
        int scorePercent = total == 0 ? 0 : (int) Math.round((solvedCount * 100.0) / total);
        long minutesTaken = Duration.between(windowStart, windowEnd).toMinutes();

        String message;
        if (scorePercent == 100) {
            message = "Perfect score! You solved every problem — outstanding work!";
        } else if (scorePercent >= 75) {
            message = "Excellent performance! You're clearly getting the hang of this.";
        } else if (scorePercent >= 50) {
            message = "Solid effort! You're more than halfway there.";
        } else if (scorePercent > 0) {
            message = "Good start! Every contest is practice for the next one.";
        } else {
            message = "You gave it a shot — that's how everyone starts. Keep going!";
        }

        List<String> suggestions = new ArrayList<>();
        if (scorePercent == 100) {
            suggestions.add("Try a Medium or Hard-focused contest next to keep leveling up.");
        } else {
            problemResults.stream()
                    .filter(pr -> !pr.isSolved())
                    .forEach(pr -> suggestions.add(
                            "Revisit \"" + pr.getTitle() + "\" (" + pr.getDifficulty() + ") in the Problem Catalog."));
        }

        return new ContestResultResponse(
                contest.getTitle(),
                total,
                solvedCount,
                scorePercent,
                windowStart,
                windowEnd,
                minutesTaken,
                message,
                suggestions,
                problemResults
        );
    }


    @Transactional(readOnly = true)
    public ContestReportResponse getContestReport(Long contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Contest not found"));

        List<Problem> contestProblems = problemRepository.findByContestId(contestId);
        List<ContestRegistration> registrations = contestRegistrationRepository.findByContestId(contestId);

        Map<String, List<ContestRegistration>> byYear = registrations.stream()
                .collect(Collectors.groupingBy(r ->
                        r.getUser().getYear() != null ? r.getUser().getYear().name() : "UNSPECIFIED"));

        List<ContestReportResponse.YearStat> yearStats = new ArrayList<>();
        for (Map.Entry<String, List<ContestRegistration>> entry : byYear.entrySet()) {
            List<ContestRegistration> regs = entry.getValue();
            int registered = regs.size();
            int started = (int) regs.stream().filter(r -> r.getAttemptStartedAt() != null).count();
            int ended = (int) regs.stream().filter(r -> r.getAttemptEndedAt() != null).count();

            List<Integer> solvedCounts = new ArrayList<>();
            List<Long> timesTaken = new ArrayList<>();
            for (ContestRegistration r : regs) {
                if (r.getAttemptStartedAt() == null) continue;
                LocalDateTime end = r.getAttemptEndedAt() != null ? r.getAttemptEndedAt() : LocalDateTime.now();
                solvedCounts.add(countSolved(r.getUser(), contestProblems, r.getAttemptStartedAt(), end));
                if (r.getAttemptEndedAt() != null) {
                    timesTaken.add(Duration.between(r.getAttemptStartedAt(), r.getAttemptEndedAt()).toMinutes());
                }
            }

            double avgSolved = solvedCounts.isEmpty() ? 0 :
                    solvedCounts.stream().mapToInt(Integer::intValue).average().orElse(0);
            int avgSolvedPercent = contestProblems.isEmpty() ? 0 :
                    (int) Math.round((avgSolved / contestProblems.size()) * 100);
            Long avgTimeTaken = timesTaken.isEmpty() ? null :
                    (long) timesTaken.stream().mapToLong(Long::longValue).average().orElse(0);

            yearStats.add(new ContestReportResponse.YearStat(
                    entry.getKey(), registered, started, ended,
                    Math.round(avgSolved * 10) / 10.0, avgSolvedPercent, avgTimeTaken));
        }

        yearStats.sort(Comparator.comparing(ContestReportResponse.YearStat::getYear));

        int totalRegistered = registrations.size();
        int totalStarted = (int) registrations.stream().filter(r -> r.getAttemptStartedAt() != null).count();
        int totalEnded = (int) registrations.stream().filter(r -> r.getAttemptEndedAt() != null).count();

        return new ContestReportResponse(
                contest.getTitle(), contestProblems.size(), totalRegistered, totalStarted, totalEnded, yearStats);
    }
}