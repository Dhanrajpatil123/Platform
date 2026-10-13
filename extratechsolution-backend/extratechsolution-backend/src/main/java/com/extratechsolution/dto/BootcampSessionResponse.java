
package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class BootcampSessionResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private String meetingLink;   // null unless the viewer is enrolled or an admin
    private String status;        // UPCOMING, LIVE, COMPLETED
    private Boolean attended;     // null unless the viewer is enrolled
}