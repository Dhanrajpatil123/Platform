package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class TestCaseImportResponse {
    private int pairsFound;
    private int imported;
    private int skippedDuplicates;
    private int skippedInvalid;
    private int deletedExisting;
    private int totalTestCasesNow;
    private List<String> warnings;
}