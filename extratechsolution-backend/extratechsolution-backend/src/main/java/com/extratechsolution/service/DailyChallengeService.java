package com.extratechsolution.service;

import com.extratechsolution.dto.DailyChallengeResponse;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyChallengeService {

    private final ProblemRepository problemRepository;

    // Deterministic, not random: every visitor sees the SAME problem on the
    // same calendar day, and it changes automatically at midnight with no
    // scheduler or stored "daily challenge" row needed — just today's epoch
    // day modulo the eligible problem count. Contest-linked problems are
    // excluded since they're hidden from the public catalog anyway.
    @Transactional(readOnly = true)
    public DailyChallengeResponse getToday() {
        List<Problem> eligible = problemRepository.findAll().stream()
                .filter(p -> p.getContest() == null)
                .sorted(Comparator.comparing(Problem::getId))
                .collect(Collectors.toList());

        if (eligible.isEmpty()) {
            throw new IllegalArgumentException("No problems available yet.");
        }

        long epochDay = LocalDate.now().toEpochDay();
        int index = (int) (epochDay % eligible.size());
        Problem chosen = eligible.get(index);

        return new DailyChallengeResponse(chosen.getId(), chosen.getTitle(), chosen.getDifficulty().name());
    }
}