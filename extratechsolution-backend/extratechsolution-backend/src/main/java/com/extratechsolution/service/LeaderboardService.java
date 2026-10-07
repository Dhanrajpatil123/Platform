package com.extratechsolution.service;

import com.extratechsolution.dto.LeaderboardEntryResponse;
import com.extratechsolution.entity.Submission;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.SubmissionStatus;
import com.extratechsolution.repository.SubmissionRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private static final int TOP_N = 50;

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;

    public List<LeaderboardEntryResponse> getGlobalLeaderboard() {
        List<Submission> accepted = submissionRepository.findAll().stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .collect(Collectors.toList());

        Map<User, Long> solvedCountByUser = accepted.stream()
                .collect(Collectors.groupingBy(
                        Submission::getUser,
                        Collectors.mapping(s -> s.getProblem().getId(), Collectors.toSet())
                ))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> (long) e.getValue().size()));

        return solvedCountByUser.entrySet().stream()
                .sorted(Map.Entry.<User, Long>comparingByValue().reversed())
                .limit(TOP_N)
                .map(entry -> new LeaderboardEntryResponse(entry.getKey().getUsername(), entry.getValue()))
                .collect(Collectors.toList());
    }

    public List<LeaderboardEntryResponse> getCourseLeaderboard(Long courseId, List<Long> courseSyllabusProblemIds) {
        List<Submission> accepted = submissionRepository.findAll().stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .filter(s -> courseSyllabusProblemIds.contains(s.getProblem().getId()))
                .collect(Collectors.toList());

        Map<User, Long> solvedCountByUser = accepted.stream()
                .collect(Collectors.groupingBy(
                        Submission::getUser,
                        Collectors.mapping(s -> s.getProblem().getId(), Collectors.toSet())
                ))
                .entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> (long) e.getValue().size()));

        return solvedCountByUser.entrySet().stream()
                .sorted(Map.Entry.<User, Long>comparingByValue().reversed())
                .limit(TOP_N)
                .map(entry -> new LeaderboardEntryResponse(entry.getKey().getUsername(), entry.getValue()))
                .collect(Collectors.toList());
    }
}
