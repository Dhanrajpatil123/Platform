package com.extratechsolution.service;

import com.extratechsolution.dto.DashboardStatsResponse;
import com.extratechsolution.entity.Submission;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.SubmissionStatus;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.SubmissionRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;

    public DashboardStatsResponse getStats(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Submission> submissions = submissionRepository.findByUserOrderBySubmittedAtDesc(user);

        long solvedCount = submissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .map(s -> s.getProblem().getId())
                .distinct()
                .count();

        long totalProblems = problemRepository.count();

        int streak = calculateStreak(submissions);

        return new DashboardStatsResponse(streak, solvedCount, totalProblems);
    }

    private int calculateStreak(List<Submission> submissions) {
        Set<LocalDate> activeDays = new TreeSet<>(
                submissions.stream()
                        .map(s -> s.getSubmittedAt().toLocalDate())
                        .collect(Collectors.toSet())
        );

        if (activeDays.isEmpty()) {
            return 0;
        }

        LocalDate today = LocalDate.now();
        LocalDate cursor = activeDays.contains(today) ? today : today.minusDays(1);

        if (!activeDays.contains(cursor)) {
            return 0; // no activity today or yesterday — streak is broken
        }

        int streak = 0;
        while (activeDays.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }

        return streak;
    }
}
