package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class BulkImportResultResponse {

    private int totalRows;
    private int successCount;
    private int failureCount;
    private List<RowError> errors;
    private List<Long> createdProblemIds;

    @Getter
    @AllArgsConstructor
    public static class RowError {
        private int rowNumber;
        private String reason;
    }
}