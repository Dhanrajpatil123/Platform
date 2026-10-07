package com.extratechsolution.service;

import com.extratechsolution.dto.SearchResultResponse;
import com.extratechsolution.entity.Contest;
import com.extratechsolution.entity.Course;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.ContestRepository;
import com.extratechsolution.repository.CourseRepository;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final int MAX_RESULTS_PER_TYPE = 6;

    private final ProblemRepository problemRepository;
    private final CourseRepository courseRepository;
    private final ContestRepository contestRepository;
    private final UserRepository userRepository;
    private final ContestAccessService contestAccessService;

    @Transactional(readOnly = true)
    public SearchResultResponse search(String query, String usernameOrNull) {
        if (query == null || query.isBlank()) {
            return new SearchResultResponse(List.of(), List.of(), List.of());
        }
        String q = query.trim().toLowerCase();

        User viewer = usernameOrNull == null
                ? null
                : userRepository.findByUsername(usernameOrNull).orElse(null);
        boolean isAdmin = viewer != null && viewer.getRole() == Role.ADMIN;

        List<SearchResultResponse.ProblemHit> problems = problemRepository.findAll().stream()
                .filter(p -> p.getTitle().toLowerCase().contains(q))
                .filter(p -> contestAccessService.isVisibleInCatalog(p, isAdmin))
                .limit(MAX_RESULTS_PER_TYPE)
                .map(p -> new SearchResultResponse.ProblemHit(p.getId(), p.getTitle(), p.getDifficulty().name()))
                .collect(Collectors.toList());

        List<SearchResultResponse.CourseHit> courses = courseRepository.findAll().stream()
                .filter(c -> c.getTitle().toLowerCase().contains(q))
                .limit(MAX_RESULTS_PER_TYPE)
                .map(c -> new SearchResultResponse.CourseHit(c.getId(), c.getTitle()))
                .collect(Collectors.toList());

        List<SearchResultResponse.ContestHit> contests = contestRepository.findAll().stream()
                .filter(c -> c.getTitle().toLowerCase().contains(q))
                .limit(MAX_RESULTS_PER_TYPE)
                .map(c -> new SearchResultResponse.ContestHit(
                        c.getId(), c.getTitle(), contestAccessService.statusOf(c).name()))
                .collect(Collectors.toList());

        return new SearchResultResponse(problems, courses, contests);
    }
}