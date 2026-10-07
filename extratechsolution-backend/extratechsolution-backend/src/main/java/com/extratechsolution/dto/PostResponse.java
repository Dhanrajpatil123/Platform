package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class PostResponse {

    private Long id;
    private Long problemId;
    private String title;
    private String body;
    private String code;
    private String authorUsername;
    private long upvoteCount;
    private boolean upvotedByMe;
    private boolean locked;
    private LocalDateTime createdAt;
}
