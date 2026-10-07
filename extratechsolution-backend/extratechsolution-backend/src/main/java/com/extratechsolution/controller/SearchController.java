package com.extratechsolution.controller;

import com.extratechsolution.dto.SearchResultResponse;
import com.extratechsolution.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/api/search")
    public SearchResultResponse search(
            @RequestParam(defaultValue = "") String q,
            Authentication authentication
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return searchService.search(q, username);
    }
}