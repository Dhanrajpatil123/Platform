package com.extratechsolution.service;

import com.extratechsolution.dto.BadgeResponse;
import com.extratechsolution.dto.DifficultyStat;
import com.extratechsolution.dto.HeatmapEntry;
import com.extratechsolution.dto.LanguageStat;
import com.extratechsolution.dto.ProfileStatsResponse;
import com.extratechsolution.dto.SubmissionResponse;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.Submission;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.Difficulty;
import com.extratechsolution.enums.SubmissionStatus;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.SubmissionRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileStatsService {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionService submissionService;

    @Transactional(readOnly = true)
    public ProfileStatsResponse getStats(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Submission> mySubmissions = submissionRepository.findByUserOrderBySubmittedAtDesc(user);

        Set<Long> acceptedProblemIds = mySubmissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .map(s -> s.getProblem().getId())
                .collect(Collectors.toSet());

        List<Problem> allProblems = problemRepository.findAll();

        Map<Difficulty, Long> totalsByDifficulty = allProblems.stream()
                .collect(Collectors.groupingBy(Problem::getDifficulty, Collectors.counting()));

        Map<Long, Difficulty> difficultyByProblemId = allProblems.stream()
                .collect(Collectors.toMap(Problem::getId, Problem::getDifficulty));

        Map<Difficulty, Long> solvedByDifficulty = acceptedProblemIds.stream()
                .map(difficultyByProblemId::get)
                .filter(d -> d != null)
                .collect(Collectors.groupingBy(d -> d, Collectors.counting()));

        List<DifficultyStat> difficultyBreakdown = Arrays.stream(Difficulty.values())
                .map(d -> new DifficultyStat(
                        d.name(),
                        solvedByDifficulty.getOrDefault(d, 0L).intValue(),
                        totalsByDifficulty.getOrDefault(d, 0L).intValue()
                ))
                .collect(Collectors.toList());

        LocalDate today = LocalDate.now();
        LocalDate oneYearAgo = today.minusDays(364);

        Map<LocalDate, Long> countsByDate = mySubmissions.stream()
                .map(s -> s.getSubmittedAt().toLocalDate())
                .filter(d -> !d.isBefore(oneYearAgo))
                .collect(Collectors.groupingBy(d -> d, Collectors.counting()));

        List<HeatmapEntry> heatmap = countsByDate.entrySet().stream()
                .map(e -> new HeatmapEntry(e.getKey().toString(), e.getValue().intValue()))
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .collect(Collectors.toList());

        int submissionsInPastYear = countsByDate.values().stream().mapToInt(Long::intValue).sum();
        int totalActiveDays = countsByDate.size();
        int maxStreak = calculateMaxStreak(countsByDate.keySet());

        Map<String, Set<Long>> solvedProblemIdsByUsername = submissionRepository.findAll().stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .collect(Collectors.groupingBy(
                        s -> s.getUser().getUsername(),
                        Collectors.mapping(s -> s.getProblem().getId(), Collectors.toSet())));

        List<Map.Entry<String, Integer>> ranked = solvedProblemIdsByUsername.entrySet().stream()
                .map(e -> Map.entry(e.getKey(), e.getValue().size()))
                .sorted((a, b) -> b.getValue() - a.getValue())
                .collect(Collectors.toList());

        Integer rank = null;
        for (int i = 0; i < ranked.size(); i++) {
            if (ranked.get(i).getKey().equals(username)) {
                rank = i + 1;
                break;
            }
        }

        Map<String, Set<Long>> solvedByLanguage = mySubmissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .collect(Collectors.groupingBy(
                        Submission::getLanguage,
                        Collectors.mapping(s -> s.getProblem().getId(), Collectors.toSet())));

        List<LanguageStat> languages = solvedByLanguage.entrySet().stream()
                .map(e -> new LanguageStat(e.getKey(), e.getValue().size()))
                .sorted((a, b) -> b.getProblemsSolved() - a.getProblemsSolved())
                .collect(Collectors.toList());

        List<SubmissionResponse> recentAccepted = submissionService.getMySubmissions(username).stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .limit(10)
                .collect(Collectors.toList());

        List<BadgeResponse> badges = buildBadges(acceptedProblemIds.size(), maxStreak, languages.size());

        return new ProfileStatsResponse(
                username,
                rank,
                ranked.size(),
                acceptedProblemIds.size(),
                allProblems.size(),
                difficultyBreakdown,
                totalActiveDays,
                maxStreak,
                submissionsInPastYear,
                heatmap,
                recentAccepted,
                languages,
                badges
        );
    }

    private List<BadgeResponse> buildBadges(int solved, int maxStreak, int languageCount) {
        List<BadgeResponse> badges = new ArrayList<>();
        badges.add(new BadgeResponse("First Blood", "Solve your first problem", "🩸", solved >= 1));
        badges.add(new BadgeResponse("Getting Started", "Solve 10 problems", "🌱", solved >= 10));
        badges.add(new BadgeResponse("Half Century", "Solve 50 problems", "🔥", solved >= 50));
        badges.add(new BadgeResponse("Century", "Solve 100 problems", "💯", solved >= 100));
        badges.add(new BadgeResponse("On Fire", "Reach a 7-day streak", "⚡", maxStreak >= 7));
        badges.add(new BadgeResponse("Unstoppable", "Reach a 30-day streak", "🚀", maxStreak >= 30));
        badges.add(new BadgeResponse("Polyglot", "Solve problems in 3+ languages", "🌐", languageCount >= 3));
        return badges;
    }

    private int calculateMaxStreak(Set<LocalDate> activeDays) {
        if (activeDays.isEmpty()) return 0;

        List<LocalDate> sorted = new ArrayList<>(activeDays);
        Collections.sort(sorted);

        int maxStreak = 1;
        int currentStreak = 1;
        for (int i = 1; i < sorted.size(); i++) {
            if (sorted.get(i).equals(sorted.get(i - 1).plusDays(1))) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }
        return maxStreak;
    }
}