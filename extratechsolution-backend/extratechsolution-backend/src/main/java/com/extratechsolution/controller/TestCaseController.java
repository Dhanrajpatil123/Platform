package com.extratechsolution.controller;

import com.extratechsolution.dto.TestCaseRequest;
import com.extratechsolution.dto.TestCaseResponse;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.TestCase;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.TestCaseRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/problems/admin/{problemId}/testcases")
@RequiredArgsConstructor
public class TestCaseController {

    private final TestCaseRepository testCaseRepository;
    private final ProblemRepository problemRepository;

    @PostMapping
    public ResponseEntity<?> addTestCase(
            @PathVariable Long problemId,
            @Valid @RequestBody TestCaseRequest request
    ) {
        Problem problem = problemRepository.findById(problemId).orElse(null);
        if (problem == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Problem not found"));
        }

        TestCase testCase = new TestCase();
        testCase.setProblem(problem);
        testCase.setInput(request.getInput());
        testCase.setExpectedOutput(request.getExpectedOutput());
        testCaseRepository.save(testCase);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new TestCaseResponse(testCase.getId(), testCase.getInput(), testCase.getExpectedOutput()));
    }

    @GetMapping
    public ResponseEntity<List<TestCaseResponse>> getTestCases(@PathVariable Long problemId) {
        List<TestCaseResponse> responses = testCaseRepository.findByProblemId(problemId)
                .stream()
                .map(tc -> new TestCaseResponse(tc.getId(), tc.getInput(), tc.getExpectedOutput()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{testCaseId}")
    public ResponseEntity<?> deleteTestCase(
            @PathVariable Long problemId,
            @PathVariable Long testCaseId
    ) {
        if (!testCaseRepository.existsById(testCaseId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Test case not found"));
        }
        testCaseRepository.deleteById(testCaseId);
        return ResponseEntity.noContent().build();
    }
}
