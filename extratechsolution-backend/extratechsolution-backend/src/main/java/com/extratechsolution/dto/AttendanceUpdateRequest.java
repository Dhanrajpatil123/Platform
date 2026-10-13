// AttendanceUpdateRequest.java
package com.extratechsolution.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class AttendanceUpdateRequest {
    private List<Long> presentUserIds;
}