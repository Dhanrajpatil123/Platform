package com.extratechsolution.service;

import com.extratechsolution.entity.Contest;
import com.extratechsolution.entity.ContestRegistration;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.ContestStatus;
import com.extratechsolution.repository.ContestRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ContestAccessService {

    private final ContestRegistrationRepository contestRegistrationRepository;

    public ContestStatus statusOf(Contest contest) {
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(contest.getStartTime())) return ContestStatus.UPCOMING;
        if (now.isAfter(contest.getEndTime())) return ContestStatus.ENDED;
        return ContestStatus.LIVE;
    }

    public boolean isRegistered(User user, Contest contest) {
        return user != null && contestRegistrationRepository.existsByUserAndContest(user, contest);
    }

    public Optional<ContestRegistration> findRegistration(User user, Contest contest) {
        if (user == null) return Optional.empty();
        return contestRegistrationRepository.findByUserAndContest(user, contest);
    }

    // Whichever comes first: the student's own duration running out, or the
    // contest's own scheduled end time. Starting late means less time, not
    // extra time past the contest's official close.
    public LocalDateTime effectiveDeadline(ContestRegistration registration, Contest contest) {
        LocalDateTime personalDeadline = registration.getAttemptStartedAt()
                .plusMinutes(contest.getDurationMinutes());
        return personalDeadline.isBefore(contest.getEndTime()) ? personalDeadline : contest.getEndTime();
    }

    // If a personal attempt's time ran out but was never explicitly ended
    // (student closed the tab, browser crashed, etc.), close it out now
    // rather than leaving it open forever. Called on every access check.
    public void ensureAttemptFinalized(ContestRegistration registration, Contest contest) {
        if (registration.getAttemptStartedAt() != null && registration.getAttemptEndedAt() == null) {
            LocalDateTime deadline = effectiveDeadline(registration, contest);
            if (LocalDateTime.now().isAfter(deadline)) {
                registration.setAttemptEndedAt(deadline);
                contestRegistrationRepository.save(registration);
            }
        }
    }

    public boolean canAccessProblem(User viewer, boolean isAdmin, Problem problem) {
        if (problem.getContest() == null) return true;
        if (isAdmin) return true;

        Contest contest = problem.getContest();
        ContestStatus status = statusOf(contest);
        if (status == ContestStatus.ENDED) return true;
        if (status == ContestStatus.UPCOMING) return false;

        // LIVE: must be registered AND have a personal attempt currently in progress
        Optional<ContestRegistration> registrationOpt = findRegistration(viewer, contest);
        if (registrationOpt.isEmpty()) return false;

        ContestRegistration registration = registrationOpt.get();
        ensureAttemptFinalized(registration, contest);

        return registration.getAttemptStartedAt() != null && registration.getAttemptEndedAt() == null;
    }

    public String lockMessageFor(Problem problem, User viewer) {
        if (problem.getContest() == null) return null;

        Contest contest = problem.getContest();
        ContestStatus status = statusOf(contest);
        if (status == ContestStatus.ENDED) return null;

        String title = contest.getTitle();
        if (status == ContestStatus.UPCOMING) {
            return "This problem belongs to the upcoming contest \"" + title
                    + "\". It will be revealed when the contest starts.";
        }

        Optional<ContestRegistration> registrationOpt = findRegistration(viewer, contest);
        if (registrationOpt.isEmpty()) {
            return "This problem is part of the live contest \"" + title
                    + "\". Register for the contest to access it.";
        }

        ContestRegistration registration = registrationOpt.get();
        ensureAttemptFinalized(registration, contest);

        if (registration.getAttemptStartedAt() == null) {
            return "You're registered for \"" + title
                    + "\". Start the contest from its page to begin your timed attempt.";
        }
        return "Your attempt for \"" + title + "\" has ended.";
    }

    public boolean isVisibleInCatalog(Problem problem, boolean isAdmin) {
        if (problem.getContest() == null) return true;
        if (isAdmin) return true;
        return statusOf(problem.getContest()) == ContestStatus.ENDED;
    }
}