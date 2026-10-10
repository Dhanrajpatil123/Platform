package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ProblemNeighborsResponse {

    private Long previousId;
    private Long nextId;
    private Integer position;
    private int total;
    private String scopeType;   // COURSE, CONTEST, CATALOG or NONE
    private String scopeLabel;  // course/contest title, or null
}