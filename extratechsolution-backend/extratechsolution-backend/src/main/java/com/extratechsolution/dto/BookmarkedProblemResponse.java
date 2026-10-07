package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BookmarkedProblemResponse {

    private Long id;
    private String title;
    private String difficulty;
    private String category;
}