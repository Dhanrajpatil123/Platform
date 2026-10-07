package com.extratechsolution.service;

import com.extratechsolution.dto.ProblemRequest;
import com.extratechsolution.entity.Example;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.Tag;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// A SEPARATE bean from ProblemService on purpose — not just a separate
// method on it. Spring's @Transactional only applies through the bean's own
// proxy, so calling this from inside ProblemService (via "this.method()")
// would silently ignore REQUIRES_NEW and run inside the caller's existing
// transaction, which is exactly the bug this class exists to fix.
@Service
@RequiredArgsConstructor
public class BulkImportRowService {

    private final ProblemRepository problemRepository;
    private final TagRepository tagRepository;

    // REQUIRES_NEW: each row commits or rolls back in its OWN transaction.
    // Without this, one bad row (e.g. a duplicate title hitting the unique
    // constraint) poisons the shared Hibernate session for every row after
    // it in the same batch — catching the Java exception around save()
    // doesn't un-poison a transaction that Hibernate has already marked
    // rollback-only.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long importRow(ProblemRequest request) {
        Problem problem = new Problem();
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

        Problem saved = problemRepository.save(problem);
        return saved.getId();
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
}