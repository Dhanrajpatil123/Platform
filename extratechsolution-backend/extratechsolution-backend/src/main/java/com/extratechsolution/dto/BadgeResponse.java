package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BadgeResponse {

    private String name;
    private String description;
    private String icon;
    private boolean earned;
}