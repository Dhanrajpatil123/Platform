package com.extratechsolution.controller;

import com.extratechsolution.dto.LeaderboardEntryResponse;
import com.extratechsolution.repository.CourseRepository;
import com.extratechsolution.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final CourseRepository courseRepository;

    @GetMapping
    public ResponseEntity<List<LeaderboardEntryResponse>> getGlobalLeaderboard() {
        return ResponseEntity.ok(leaderboardService.getGlobalLeaderboard());
    }

//    @GetMapping("/course/{courseId}")
//    public ResponseEntity<?> getCourseLeaderboard(@PathVariable Long courseId) {
//        return courseRepository.findById(courseId)
//                .map(course -> {
//                    List<Long> problemIds = course.getSyllabus().stream()
//                            .map(cp -> cp.getProblem().getId())
//                            .collect(Collectors.toList());
//                    return ResponseEntity.ok(
//                            leaderboardService.getCourseLeaderboard(courseId, problemIds));
//                })
//                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
//                        .body(Map.of("error", "Course not found")));
//    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getCourseLeaderboard(@PathVariable Long courseId) {

        var courseOptional = courseRepository.findById(courseId);

        if (courseOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Course not found"));
        }

        var course = courseOptional.get();

        List<Long> problemIds = course.getSyllabus().stream()
                .map(cp -> cp.getProblem().getId())
                .collect(Collectors.toList());

        return ResponseEntity.ok(
                leaderboardService.getCourseLeaderboard(courseId, problemIds)
        );
    }
}
