package com.extratechsolution.controller;

import com.extratechsolution.dto.PlatformStatsResponse;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.ContestRepository;
import com.extratechsolution.repository.CourseRepository;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/stats")
@RequiredArgsConstructor
public class PlatformStatsController {

    private final ProblemRepository problemRepository;
    private final CourseRepository courseRepository;
    private final ContestRepository contestRepository;
    private final UserRepository userRepository;

    @GetMapping
    public PlatformStatsResponse getStats() {
        long totalStudents = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.STUDENT)
                .count();

        return new PlatformStatsResponse(
                problemRepository.count(),
                courseRepository.count(),
                contestRepository.count(),
                totalStudents
        );
    }
}