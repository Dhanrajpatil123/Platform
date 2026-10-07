package com.extratechsolution.service;

import com.extratechsolution.dto.SubmissionRequest;
import com.extratechsolution.dto.SubmissionResponse;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.Submission;
import com.extratechsolution.entity.TestCase;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.SubmissionStatus;
import com.extratechsolution.exception.PremiumRequiredException;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.SubmissionRepository;
import com.extratechsolution.repository.TestCaseRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.extratechsolution.exception.ContestAccessException;
import com.extratechsolution.enums.Role;


import java.util.List;
import java.util.stream.Collectors;



@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final CodeExecutionService codeExecutionService;
    private final PremiumService premiumService;
    private final ContestAccessService contestAccessService;


    public SubmissionResponse createSubmission(String username, SubmissionRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!contestAccessService.canAccessProblem(user, isAdmin, problem)) {
            throw new ContestAccessException(contestAccessService.lockMessageFor(problem, user));
        }

        if (problem.isPremium() && !premiumService.hasPremiumAccess(user)) {
            throw new PremiumRequiredException(
                    "This is a Premium problem. Upgrade to Premium to submit solutions.");
        }

        List<TestCase> testCases = testCaseRepository.findByProblemId(problem.getId());

//        System.out.println("DEBUG: Submitting to problem id=" + problem.getId()
//                + " ('" + problem.getTitle() + "') — found " + testCases.size() + " test case(s).");

        if (testCases.isEmpty()) {
            throw new IllegalArgumentException(
                    "This problem has no test cases yet — an admin needs to add some before it can be judged.");
        }

        List<CodeExecutionService.TestCasePair> pairs = testCases.stream()
                .map(tc -> new CodeExecutionService.TestCasePair(tc.getInput(), tc.getExpectedOutput()))
                .collect(Collectors.toList());

        CodeExecutionService.ExecutionOutcome outcome =
                codeExecutionService.runAgainstTestCases(request.getCode(), request.getLanguage(), pairs);

        Submission submission = new Submission();
        submission.setUser(user);
        submission.setProblem(problem);
        submission.setCode(request.getCode());
        submission.setLanguage(request.getLanguage());
        submission.setStatus(outcome.status);
        submission.setTotalTestCases(outcome.totalTestCases);
        submission.setPassedTestCases(outcome.passedTestCases);

        Submission saved = submissionRepository.save(submission);
        return toResponse(saved);
    }

    public List<SubmissionResponse> getMySubmissions(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return submissionRepository.findByUserOrderBySubmittedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SubmissionResponse> getMySubmissionsForProblem(String username, Long problemId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return submissionRepository.findByUserAndProblemIdOrderBySubmittedAtDesc(user, problemId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }


    public java.util.Set<Long> getSolvedProblemIds(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return submissionRepository.findByUserOrderBySubmittedAtDesc(user)
                .stream()
                .filter(s -> s.getStatus() == SubmissionStatus.ACCEPTED)
                .map(s -> s.getProblem().getId())
                .collect(Collectors.toSet());
    }



    private SubmissionResponse toResponse(Submission submission) {
        Integer beatsPercentage = null;

        if (submission.getStatus() == SubmissionStatus.ACCEPTED) {
            List<Submission> peers = submissionRepository.findByProblemIdAndLanguageAndStatus(
                    submission.getProblem().getId(), submission.getLanguage(), SubmissionStatus.ACCEPTED);

            long slowerOrEqualCount = peers.stream()
                    .filter(p -> p.getExecutionTimeMs() >= submission.getExecutionTimeMs())
                    .count();

            beatsPercentage = (int) Math.round((slowerOrEqualCount * 100.0) / peers.size());
        }

        return new SubmissionResponse(
                submission.getId(),
                submission.getProblem().getId(),
                submission.getProblem().getTitle(),
                submission.getLanguage(),
                submission.getStatus(),
                submission.getTotalTestCases(),
                submission.getPassedTestCases(),
                submission.getExecutionTimeMs(),
                beatsPercentage,
                submission.getCode(),
                submission.getSubmittedAt()
        );
    }
}
