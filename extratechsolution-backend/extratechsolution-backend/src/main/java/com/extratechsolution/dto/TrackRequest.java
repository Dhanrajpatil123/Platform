// TrackRequest.java
package com.extratechsolution.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class TrackRequest {
    private String title;
    private String description;
    private Boolean published;
    private List<Long> courseIds;   // order matters: it is the learning order
}