//package com.extratechsolution.service;
//
//import com.extratechsolution.dto.BulkImportResultResponse;
//import com.extratechsolution.dto.ExampleDto;
//import com.extratechsolution.dto.ProblemRequest;
//import com.extratechsolution.dto.ProblemResponse;
//import com.extratechsolution.entity.CourseProblem;
//import com.extratechsolution.entity.DiscussionPost;
//import com.extratechsolution.entity.Example;
//import com.extratechsolution.entity.Problem;
//import com.extratechsolution.entity.Tag;
//import com.extratechsolution.entity.User;
//import com.extratechsolution.enums.Role;
//import com.extratechsolution.repository.CourseProblemRepository;
//import com.extratechsolution.repository.DiscussionCommentRepository;
//import com.extratechsolution.repository.DiscussionPostRepository;
//import com.extratechsolution.repository.PostUpvoteRepository;
//import com.extratechsolution.repository.ProblemRepository;
//import com.extratechsolution.repository.SubmissionRepository;
//import com.extratechsolution.repository.TagRepository;
//import com.extratechsolution.repository.TestCaseRepository;
//import com.extratechsolution.repository.UserRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//import org.springframework.web.multipart.MultipartFile;
//import tools.jackson.core.type.TypeReference;
//import tools.jackson.databind.ObjectMapper;
//
//import java.io.BufferedReader;
//import java.io.IOException;
//import java.io.InputStreamReader;
//import java.nio.charset.StandardCharsets;
//import java.util.ArrayList;
//import java.util.HashSet;
//import java.util.List;
//import java.util.Set;
//import java.util.stream.Collectors;
//import java.util.Arrays;
//
//@Service
//@RequiredArgsConstructor
//public class ProblemService {
//
//    private final ProblemRepository problemRepository;
//    private final TagRepository tagRepository;
//    private final TestCaseRepository testCaseRepository;
//    private final SubmissionRepository submissionRepository;
//    private final CourseProblemRepository courseProblemRepository;
//    private final DiscussionPostRepository discussionPostRepository;
//    private final DiscussionCommentRepository discussionCommentRepository;
//    private final PostUpvoteRepository postUpvoteRepository;
//    private final PremiumService premiumService;
//    private final UserRepository userRepository;
//    private final ContestAccessService contestAccessService;
//    private final ObjectMapper objectMapper;
//
//    private static final String PREMIUM_LOCK_MESSAGE =
//            "This is a Premium problem. Upgrade to Premium to read the full statement and submit your solution.";
//
//    @Transactional(readOnly = true)
//    public List<ProblemResponse> getAllProblems(String usernameOrNull) {
//        User viewer = resolveViewer(usernameOrNull);
//        boolean isAdmin = isAdmin(viewer);
//        boolean premiumAccess = premiumService.hasPremiumAccess(viewer);
//
//        return problemRepository.findAll()
//                .stream()
//                .filter(p -> contestAccessService.isVisibleInCatalog(p, isAdmin))
//                .map(problem -> toResponse(problem, premiumAccess, null))
//                .collect(Collectors.toList());
//    }
//
//    @Transactional(readOnly = true)
//    public ProblemResponse getProblemById(Long id, String usernameOrNull) {
//        Problem problem = problemRepository.findById(id)
//                .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + id));
//
//        User viewer = resolveViewer(usernameOrNull);
//        boolean isAdmin = isAdmin(viewer);
//        boolean premiumAccess = premiumService.hasPremiumAccess(viewer);
//
//        boolean hasContestAccess = problem.getContest() != null
//                && contestAccessService.canAccessProblem(viewer, isAdmin, problem);
//
//        // Being let in via an active contest attempt overrides premium entirely,
//        // for AS LONG AS the contest is still live — once it ends, the problem
//        // reverts to a normal problem and its own premium flag applies again.
//        boolean contestBypassesPremium = hasContestAccess
//                && contestAccessService.statusOf(problem.getContest())
//                != com.extratechsolution.enums.ContestStatus.ENDED;
//
//        String contestLockMessage = hasContestAccess
//                ? null
//                : contestAccessService.lockMessageFor(problem, viewer);
//
//        return toResponse(problem, premiumAccess || contestBypassesPremium, contestLockMessage);
//    }
//
//    @Transactional
//    public ProblemResponse createProblem(ProblemRequest request) {
//        Problem problem = new Problem();
//        applyRequestToEntity(request, problem);
//        Problem saved = problemRepository.save(problem);
//        return toResponse(saved, true, null);
//    }
//
//    @Transactional
//    public ProblemResponse updateProblem(Long id, ProblemRequest request) {
//        Problem problem = problemRepository.findById(id)
//                .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + id));
//        applyRequestToEntity(request, problem);
//        Problem saved = problemRepository.save(problem);
//        return toResponse(saved, true, null);
//    }
//
//    @Transactional
//    public void deleteProblem(Long id) {
//        if (!problemRepository.existsById(id)) {
//            throw new IllegalArgumentException("Problem not found with id: " + id);
//        }
//
//        List<CourseProblem> courseUsages = courseProblemRepository.findByProblemId(id);
//        if (!courseUsages.isEmpty()) {
//            String courseTitles = courseUsages.stream()
//                    .map(cp -> cp.getCourse().getTitle())
//                    .distinct()
//                    .collect(Collectors.joining(", "));
//            throw new IllegalStateException(
//                    "This problem is part of the syllabus of: " + courseTitles
//                            + ". Remove it from those courses first.");
//        }
//
//        List<DiscussionPost> posts =
//                discussionPostRepository.findByProblemIdOrderByCreatedAtDesc(id);
//        for (DiscussionPost post : posts) {
//            discussionCommentRepository.deleteByPostId(post.getId());
//            postUpvoteRepository.deleteByPostId(post.getId());
//        }
//        discussionPostRepository.deleteAll(posts);
//
//        submissionRepository.deleteByProblemId(id);
//        testCaseRepository.deleteByProblemId(id);
//
//        problemRepository.deleteById(id);
//    }
//
//    private Set<Tag> resolveTags(List<String> tagNames) {
//        if (tagNames == null) return new HashSet<>();
//
//        return tagNames.stream()
//                .filter(name -> name != null && !name.isBlank())
//                .map(name -> tagRepository.findByNameIgnoreCase(name.trim())
//                        .orElseGet(() -> {
//                            Tag newTag = new Tag();
//                            newTag.setName(name.trim());
//                            return tagRepository.save(newTag);
//                        }))
//                .collect(Collectors.toSet());
//    }
//
//    private void applyRequestToEntity(ProblemRequest request, Problem problem) {
//        problem.setTitle(request.getTitle());
//        problem.setDifficulty(request.getDifficulty());
//        problem.setCategory(request.getCategory());
//        problem.setDescription(request.getDescription());
//
//        List<Example> examples = request.getExamples().stream()
//                .map(dto -> new Example(dto.getInput(), dto.getOutput()))
//                .collect(Collectors.toList());
//        problem.setExamples(examples);
//
//        problem.setConstraints(request.getConstraints());
//        problem.setTags(resolveTags(request.getTags()));
//
//        if (request.getPremium() != null) {
//            problem.setPremium(request.getPremium());
//        }
//    }
//
//    private User resolveViewer(String usernameOrNull) {
//        if (usernameOrNull == null) return null;
//        return userRepository.findByUsername(usernameOrNull).orElse(null);
//    }
//
//    private boolean isAdmin(User viewer) {
//        return viewer != null && viewer.getRole() == Role.ADMIN;
//    }
//
//    private ProblemResponse toResponse(Problem problem, boolean viewerHasPremiumAccess, String forcedLockMessage) {
//        boolean premiumLocked = problem.isPremium() && !viewerHasPremiumAccess;
//        boolean locked = premiumLocked || forcedLockMessage != null;
//        String lockMessage = forcedLockMessage != null
//                ? forcedLockMessage
//                : (premiumLocked ? PREMIUM_LOCK_MESSAGE : null);
//
//        List<ExampleDto> exampleDtos = locked
//                ? List.of()
//                : problem.getExamples().stream()
//                .map(ex -> new ExampleDto(ex.getInput(), ex.getOutput()))
//                .collect(Collectors.toList());
//
//        List<String> tagNames = problem.getTags().stream()
//                .map(Tag::getName)
//                .sorted()
//                .collect(Collectors.toList());
//
//        return new ProblemResponse(
//                problem.getId(),
//                problem.getTitle(),
//                problem.getDifficulty(),
//                problem.getCategory(),
//                locked ? "" : problem.getDescription(),
//                exampleDtos,
//                locked ? List.of() : problem.getConstraints(),
//                tagNames,
//                problem.isPremium(),
//                locked,
//                lockMessage,
//                problem.getContest() != null ? problem.getContest().getId() : null,
//                problem.getCreatedAt()
//        );
//    }
//
//
//
//    @Transactional
//    public BulkImportResultResponse bulkImportProblems(MultipartFile file) {
//        String filename = file.getOriginalFilename() != null
//                ? file.getOriginalFilename().toLowerCase() : "";
//
//        List<ProblemRequest> parsedRequests;
//        List<BulkImportResultResponse.RowError> errors = new ArrayList<>();
//
//        try {
//            if (filename.endsWith(".json")) {
//                parsedRequests = objectMapper.readValue(
//                        file.getInputStream(), new TypeReference<List<ProblemRequest>>() {});
//            } else if (filename.endsWith(".csv")) {
//                parsedRequests = parseCsv(file, errors);
//            } else {
//                throw new IllegalArgumentException("Unsupported file type. Upload a .json or .csv file.");
//            }
//        } catch (IOException e) {
//            throw new IllegalArgumentException("Could not read the file: " + e.getMessage());
//        }
//
//        int successCount = 0;
//        List<Long> createdIds = new ArrayList<>();
//
//        for (int i = 0; i < parsedRequests.size(); i++) {
//            ProblemRequest req = parsedRequests.get(i);
//            int rowNumber = i + 1;
//            try {
//                validateMinimalFields(req);
//                Problem problem = new Problem();
//                applyRequestToEntity(req, problem);
//                Problem saved = problemRepository.save(problem);
//                createdIds.add(saved.getId());
//                successCount++;
//            } catch (Exception e) {
//                errors.add(new BulkImportResultResponse.RowError(rowNumber, e.getMessage()));
//            }
//        }
//
//        int totalRows = parsedRequests.size() + (errors.size() - (parsedRequests.size() - successCount));
//        // Simplify: total attempted rows is CSV parse failures (never became a
//        // ProblemRequest) plus every row that did become one.
//        totalRows = parsedRequests.size() + (errors.size() - (errors.size() - (int) errors.stream()
//                .filter(e -> e.getRowNumber() <= parsedRequests.size()).count()));
//        totalRows = parsedRequests.size() + Math.max(errors.size() - (parsedRequests.size() - successCount), 0);
//
//        return new BulkImportResultResponse(totalRows, successCount, errors.size(), errors, createdIds);
//    }
//
//    private void validateMinimalFields(ProblemRequest req) {
//        if (req.getTitle() == null || req.getTitle().isBlank()) {
//            throw new IllegalArgumentException("Title is required");
//        }
//        if (req.getDifficulty() == null) {
//            throw new IllegalArgumentException("Difficulty is required (EASY, MEDIUM, or HARD)");
//        }
//        if (req.getCategory() == null || req.getCategory().isBlank()) {
//            throw new IllegalArgumentException("Category is required");
//        }
//        if (req.getDescription() == null || req.getDescription().isBlank()) {
//            throw new IllegalArgumentException("Description is required");
//        }
//        if (req.getExamples() == null) req.setExamples(new ArrayList<>());
//        if (req.getConstraints() == null) req.setConstraints(new ArrayList<>());
//        if (req.getTags() == null) req.setTags(new ArrayList<>());
//    }
//
//    private List<ProblemRequest> parseCsv(MultipartFile file, List<BulkImportResultResponse.RowError> errors)
//            throws IOException {
//        List<ProblemRequest> result = new ArrayList<>();
//        try (BufferedReader reader = new BufferedReader(
//                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
//
//            String headerLine = reader.readLine();
//            if (headerLine == null) return result;
//            List<String> headers = parseCsvLine(headerLine);
//
//            int lineNumber = 1;
//            String line;
//            while ((line = reader.readLine()) != null) {
//                lineNumber++;
//                if (line.isBlank()) continue;
//
//                List<String> values = parseCsvLine(line);
//                try {
//                    ProblemRequest req = new ProblemRequest();
//                    for (int i = 0; i < headers.size() && i < values.size(); i++) {
//                        String header = headers.get(i).trim().toLowerCase();
//                        String value = values.get(i).trim();
//                        switch (header) {
//                            case "title" -> req.setTitle(value);
//                            case "difficulty" -> req.setDifficulty(
//                                    com.extratechsolution.enums.Difficulty.valueOf(value.toUpperCase()));
//                            case "category" -> req.setCategory(value);
//                            case "description" -> req.setDescription(value);
//                            case "tags" -> req.setTags(splitSemicolon(value));
//                            case "premium" -> req.setPremium(Boolean.parseBoolean(value));
//                            default -> { }
//                        }
//                    }
//                    req.setExamples(new ArrayList<>());
//                    req.setConstraints(new ArrayList<>());
//                    result.add(req);
//                } catch (Exception e) {
//                    errors.add(new BulkImportResultResponse.RowError(
//                            lineNumber, "Could not parse row: " + e.getMessage()));
//                }
//            }
//        }
//        return result;
//    }
//
//    private List<String> splitSemicolon(String value) {
//        if (value == null || value.isBlank()) return new ArrayList<>();
//        return Arrays.stream(value.split(";"))
//                .map(String::trim)
//                .filter(s -> !s.isEmpty())
//                .collect(Collectors.toList());
//    }
//
//    // Minimal RFC4180-style parser: handles quoted fields, embedded commas, and
//// escaped double-quotes ("") inside a quoted field.
//    private List<String> parseCsvLine(String line) {
//        List<String> result = new ArrayList<>();
//        StringBuilder current = new StringBuilder();
//        boolean inQuotes = false;
//
//        for (int i = 0; i < line.length(); i++) {
//            char c = line.charAt(i);
//            if (inQuotes) {
//                if (c == '"') {
//                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
//                        current.append('"');
//                        i++;
//                    } else {
//                        inQuotes = false;
//                    }
//                } else {
//                    current.append(c);
//                }
//            } else {
//                if (c == '"') {
//                    inQuotes = true;
//                } else if (c == ',') {
//                    result.add(current.toString());
//                    current.setLength(0);
//                } else {
//                    current.append(c);
//                }
//            }
//        }
//        result.add(current.toString());
//        return result;
//    }
//
//}


package com.extratechsolution.service;

import com.extratechsolution.dto.BulkImportResultResponse;
import com.extratechsolution.dto.ExampleDto;
import com.extratechsolution.dto.ProblemRequest;
import com.extratechsolution.dto.ProblemResponse;
import com.extratechsolution.entity.CourseProblem;
import com.extratechsolution.entity.DiscussionPost;
import com.extratechsolution.entity.Example;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.Tag;
import com.extratechsolution.entity.User;
import com.extratechsolution.enums.Role;
import com.extratechsolution.repository.CourseProblemRepository;
import com.extratechsolution.repository.DiscussionCommentRepository;
import com.extratechsolution.repository.DiscussionPostRepository;
import com.extratechsolution.repository.PostUpvoteRepository;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.SubmissionRepository;
import com.extratechsolution.repository.TagRepository;
import com.extratechsolution.repository.TestCaseRepository;
import com.extratechsolution.repository.UserRepository;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final TagRepository tagRepository;
    private final TestCaseRepository testCaseRepository;
    private final SubmissionRepository submissionRepository;
    private final CourseProblemRepository courseProblemRepository;
    private final DiscussionPostRepository discussionPostRepository;
    private final DiscussionCommentRepository discussionCommentRepository;
    private final PostUpvoteRepository postUpvoteRepository;
    private final PremiumService premiumService;
    private final UserRepository userRepository;
    private final ContestAccessService contestAccessService;
    private final ObjectMapper objectMapper;
    private final BulkImportRowService bulkImportRowService;
    private final BookmarkService bookmarkService;



    private static final String PREMIUM_LOCK_MESSAGE =
            "This is a Premium problem. Upgrade to Premium to read the full statement and submit your solution.";

//    @Transactional(readOnly = true)
//    public List<ProblemResponse> getAllProblems(String usernameOrNull) {
//        User viewer = resolveViewer(usernameOrNull);
//        boolean isAdmin = isAdmin(viewer);
//        boolean premiumAccess = premiumService.hasPremiumAccess(viewer);
//
//        return problemRepository.findAll()
//                .stream()
//                .filter(p -> contestAccessService.isVisibleInCatalog(p, isAdmin))
//                .map(problem -> toResponse(problem, premiumAccess, null))
//                .collect(Collectors.toList());
//    }
//
//    @Transactional(readOnly = true)
//    public ProblemResponse getProblemById(Long id, String usernameOrNull) {
//        Problem problem = problemRepository.findById(id)
//                .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + id));
//
//        User viewer = resolveViewer(usernameOrNull);
//        boolean isAdmin = isAdmin(viewer);
//        boolean premiumAccess = premiumService.hasPremiumAccess(viewer);
//
//        boolean hasContestAccess = problem.getContest() != null
//                && contestAccessService.canAccessProblem(viewer, isAdmin, problem);
//
//        boolean contestBypassesPremium = hasContestAccess
//                && contestAccessService.statusOf(problem.getContest())
//                != com.extratechsolution.enums.ContestStatus.ENDED;
//
//        String contestLockMessage = hasContestAccess
//                ? null
//                : contestAccessService.lockMessageFor(problem, viewer);
//
//        return toResponse(problem, premiumAccess || contestBypassesPremium, contestLockMessage);
//    }

    @Transactional(readOnly = true)
    public List<ProblemResponse> getAllProblems(String usernameOrNull) {
        User viewer = resolveViewer(usernameOrNull);
        boolean isAdmin = isAdmin(viewer);
        boolean premiumAccess = premiumService.hasPremiumAccess(viewer);

        return problemRepository.findAll()
                .stream()
                .filter(p -> contestAccessService.isVisibleInCatalog(p, isAdmin))
                .map(problem -> toResponse(problem, premiumAccess, null, bookmarkService.isBookmarked(viewer, problem)))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProblemResponse getProblemById(Long id, String usernameOrNull) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + id));

        User viewer = resolveViewer(usernameOrNull);
        boolean isAdmin = isAdmin(viewer);
        boolean premiumAccess = premiumService.hasPremiumAccess(viewer);

        boolean hasContestAccess = problem.getContest() != null
                && contestAccessService.canAccessProblem(viewer, isAdmin, problem);
        boolean contestBypassesPremium = hasContestAccess
                && contestAccessService.statusOf(problem.getContest())
                != com.extratechsolution.enums.ContestStatus.ENDED;
        String contestLockMessage = hasContestAccess
                ? null
                : contestAccessService.lockMessageFor(problem, viewer);

        return toResponse(problem, premiumAccess || contestBypassesPremium, contestLockMessage,
                bookmarkService.isBookmarked(viewer, problem));
    }

    @Transactional
    public ProblemResponse createProblem(ProblemRequest request) {
        Problem problem = new Problem();
        applyRequestToEntity(request, problem);
        Problem saved = problemRepository.save(problem);
        return toResponse(saved, true, null, false);
    }

    @Transactional
    public ProblemResponse updateProblem(Long id, ProblemRequest request) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found with id: " + id));
        applyRequestToEntity(request, problem);
        Problem saved = problemRepository.save(problem);
        return toResponse(saved, true, null, false);
    }

    @Transactional
    public void deleteProblem(Long id) {
        if (!problemRepository.existsById(id)) {
            throw new IllegalArgumentException("Problem not found with id: " + id);
        }

        List<CourseProblem> courseUsages = courseProblemRepository.findByProblemId(id);
        if (!courseUsages.isEmpty()) {
            String courseTitles = courseUsages.stream()
                    .map(cp -> cp.getCourse().getTitle())
                    .distinct()
                    .collect(Collectors.joining(", "));
            throw new IllegalStateException(
                    "This problem is part of the syllabus of: " + courseTitles
                            + ". Remove it from those courses first.");
        }

        List<DiscussionPost> posts =
                discussionPostRepository.findByProblemIdOrderByCreatedAtDesc(id);
        for (DiscussionPost post : posts) {
            discussionCommentRepository.deleteByPostId(post.getId());
            postUpvoteRepository.deleteByPostId(post.getId());
        }
        discussionPostRepository.deleteAll(posts);

        submissionRepository.deleteByProblemId(id);
        testCaseRepository.deleteByProblemId(id);

        problemRepository.deleteById(id);
    }

    // NOT @Transactional at this level — each row is saved through
    // bulkImportRowService.importRow(...), which opens its own fresh
    // transaction per row (see that class for why). Wrapping this whole
    // method in a transaction would defeat that isolation entirely.
    public BulkImportResultResponse bulkImportProblems(MultipartFile file) {
        String filename = file.getOriginalFilename() != null
                ? file.getOriginalFilename().toLowerCase() : "";

        List<ProblemRequest> parsedRequests;
        List<BulkImportResultResponse.RowError> errors = new ArrayList<>();

        try {
            if (filename.endsWith(".json")) {
                parsedRequests = objectMapper.readValue(
                        file.getInputStream(), new TypeReference<List<ProblemRequest>>() {});
            } else if (filename.endsWith(".csv")) {
                parsedRequests = parseCsv(file, errors);
            } else {
                throw new IllegalArgumentException("Unsupported file type. Upload a .json or .csv file.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read the file: " + e.getMessage());
        }

        int successCount = 0;
        List<Long> createdIds = new ArrayList<>();

        for (int i = 0; i < parsedRequests.size(); i++) {
            ProblemRequest req = parsedRequests.get(i);
            int rowNumber = i + 1;
            try {
                validateMinimalFields(req);
                Long createdId = bulkImportRowService.importRow(req);
                createdIds.add(createdId);
                successCount++;
            } catch (DataIntegrityViolationException e) {
                errors.add(new BulkImportResultResponse.RowError(
                        rowNumber, "A problem with the title \"" + req.getTitle() + "\" already exists."));
            } catch (Exception e) {
                errors.add(new BulkImportResultResponse.RowError(rowNumber, e.getMessage()));
            }
        }

        int totalRows = successCount + errors.size();

        return new BulkImportResultResponse(totalRows, successCount, errors.size(), errors, createdIds);
    }

    private void validateMinimalFields(ProblemRequest req) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (req.getDifficulty() == null) {
            throw new IllegalArgumentException("Difficulty is required (EASY, MEDIUM, or HARD)");
        }
        if (req.getCategory() == null || req.getCategory().isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }
        if (req.getDescription() == null || req.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }
        if (req.getExamples() == null) req.setExamples(new ArrayList<>());
        if (req.getConstraints() == null) req.setConstraints(new ArrayList<>());
        if (req.getTags() == null) req.setTags(new ArrayList<>());
    }

    private List<ProblemRequest> parseCsv(MultipartFile file, List<BulkImportResultResponse.RowError> errors)
            throws IOException {
        List<ProblemRequest> result = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) return result;
            List<String> headers = parseCsvLine(headerLine);

            int lineNumber = 1;
            String line;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.isBlank()) continue;

                List<String> values = parseCsvLine(line);
                try {
                    ProblemRequest req = new ProblemRequest();
                    for (int i = 0; i < headers.size() && i < values.size(); i++) {
                        String header = headers.get(i).trim().toLowerCase();
                        String value = values.get(i).trim();
                        switch (header) {
                            case "title" -> req.setTitle(value);
                            case "difficulty" -> req.setDifficulty(
                                    com.extratechsolution.enums.Difficulty.valueOf(value.toUpperCase()));
                            case "category" -> req.setCategory(value);
                            case "description" -> req.setDescription(value);
                            case "tags" -> req.setTags(splitSemicolon(value));
                            case "premium" -> req.setPremium(Boolean.parseBoolean(value));
                            default -> { }
                        }
                    }
                    req.setExamples(new ArrayList<>());
                    req.setConstraints(new ArrayList<>());
                    result.add(req);
                } catch (Exception e) {
                    errors.add(new BulkImportResultResponse.RowError(
                            lineNumber, "Could not parse row: " + e.getMessage()));
                }
            }
        }
        return result;
    }

    private List<String> splitSemicolon(String value) {
        if (value == null || value.isBlank()) return new ArrayList<>();
        return Arrays.stream(value.split(";"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        current.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current.append(c);
                }
            } else {
                if (c == '"') {
                    inQuotes = true;
                } else if (c == ',') {
                    result.add(current.toString());
                    current.setLength(0);
                } else {
                    current.append(c);
                }
            }
        }
        result.add(current.toString());
        return result;
    }

    private Set<Tag> resolveTags(List<String> tagNames) {
        if (tagNames == null) return new HashSet<>();

        return tagNames.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(name -> tagRepository.findByNameIgnoreCase(name.trim())
                        .orElseGet(() -> {
                            Tag newTag = new Tag();
                            newTag.setName(name.trim());
                            return tagRepository.save(newTag);
                        }))
                .collect(Collectors.toSet());
    }

    private void applyRequestToEntity(ProblemRequest request, Problem problem) {
        problem.setTitle(request.getTitle());
        problem.setDifficulty(request.getDifficulty());
        problem.setCategory(request.getCategory());
        problem.setDescription(request.getDescription());

        List<Example> examples = request.getExamples().stream()
                .map(dto -> new Example(dto.getInput(), dto.getOutput()))
                .collect(Collectors.toList());
        problem.setExamples(examples);

        problem.setConstraints(request.getConstraints());
        problem.setTags(resolveTags(request.getTags()));

        if (request.getPremium() != null) {
            problem.setPremium(request.getPremium());
        }
    }

    private User resolveViewer(String usernameOrNull) {
        if (usernameOrNull == null) return null;
        return userRepository.findByUsername(usernameOrNull).orElse(null);
    }

    private boolean isAdmin(User viewer) {
        return viewer != null && viewer.getRole() == Role.ADMIN;
    }

    private ProblemResponse toResponse(
            Problem problem, boolean viewerHasPremiumAccess, String forcedLockMessage, boolean bookmarked) {
        boolean premiumLocked = problem.isPremium() && !viewerHasPremiumAccess;
        boolean locked = premiumLocked || forcedLockMessage != null;
        String lockMessage = forcedLockMessage != null
                ? forcedLockMessage
                : (premiumLocked ? PREMIUM_LOCK_MESSAGE : null);

        List<ExampleDto> exampleDtos = locked
                ? List.of()
                : problem.getExamples().stream()
                .map(ex -> new ExampleDto(ex.getInput(), ex.getOutput()))
                .collect(Collectors.toList());

        List<String> tagNames = problem.getTags().stream()
                .map(Tag::getName)
                .sorted()
                .collect(Collectors.toList());

        return new ProblemResponse(
                problem.getId(),
                problem.getTitle(),
                problem.getDifficulty(),
                problem.getCategory(),
                locked ? "" : problem.getDescription(),
                exampleDtos,
                locked ? List.of() : problem.getConstraints(),
                tagNames,
                problem.isPremium(),
                locked,
                lockMessage,
                problem.getContest() != null ? problem.getContest().getId() : null,
                bookmarked,
                problem.getCreatedAt()
        );
    }
}