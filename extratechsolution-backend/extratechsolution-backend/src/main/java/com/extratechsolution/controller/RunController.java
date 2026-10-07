package com.extratechsolution.controller;

import com.extratechsolution.dto.RunRequest;
import com.extratechsolution.dto.RunResponse;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.UserRepository;
import com.extratechsolution.service.CodeExecutionService;
import com.extratechsolution.service.ContestAccessService;
import com.extratechsolution.service.PremiumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/run")
@RequiredArgsConstructor
public class RunController {

    private final CodeExecutionService codeExecutionService;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final PremiumService premiumService;
    private final ContestAccessService contestAccessService;

    @PostMapping
    public ResponseEntity<?> run(@Valid @RequestBody RunRequest request, Authentication authentication) {
        if (request.getProblemId() != null) {
            String accessError = checkAccess(request.getProblemId(), authentication.getName());
            if (accessError != null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", accessError));
            }
        }

        CodeExecutionService.RunResult result =
                codeExecutionService.runOnce(request.getCode(), request.getLanguage(), request.getStdin());

        if (result.timedOut) {
            return ResponseEntity.ok(new RunResponse(false, null, "Time limit exceeded (5 seconds)."));
        }
        if (result.exitCode != 0) {
            String errorMessage = result.stderr != null && !result.stderr.isBlank()
                    ? result.stderr
                    : "Program exited with an error.";
            return ResponseEntity.ok(new RunResponse(false, null, errorMessage));
        }
        return ResponseEntity.ok(new RunResponse(true, result.stdout, null));
    }

    // Returns null if access is fine, or an error message if it should be blocked.
    private String checkAccess(Long problemId, String username) {
        Problem problem = problemRepository.findById(problemId).orElse(null);
        if (problem == null) return null; // let the real submit/problem endpoints report "not found"

        User user = userRepository.findByUsername(username).orElse(null);
        boolean isAdmin = user != null && user.getRole() == Role.ADMIN;

        if (!contestAccessService.canAccessProblem(user, isAdmin, problem)) {
            return contestAccessService.lockMessageFor(problem, user);
        }

        boolean contestBypassesPremium = problem.getContest() != null
                && contestAccessService.canAccessProblem(user, isAdmin, problem);

        if (problem.isPremium() && !premiumService.hasPremiumAccess(user) && !contestBypassesPremium) {
            return "This is a Premium problem. Upgrade to Premium to run code against it.";
        }

        return null;
    }
}