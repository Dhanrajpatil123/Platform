package com.extratechsolution.service;

import com.extratechsolution.dto.BookmarkedProblemResponse;
import com.extratechsolution.entity.Bookmark;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.User;
import com.extratechsolution.repository.BookmarkRepository;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;

    @Transactional
    public boolean toggle(String username, Long problemId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found"));

        return bookmarkRepository.findByUserAndProblem(user, problem)
                .map(existing -> {
                    bookmarkRepository.delete(existing);
                    return false;
                })
                .orElseGet(() -> {
                    Bookmark bookmark = new Bookmark();
                    bookmark.setUser(user);
                    bookmark.setProblem(problem);
                    bookmarkRepository.save(bookmark);
                    return true;
                });
    }

    @Transactional(readOnly = true)
    public boolean isBookmarked(User user, Problem problem) {
        return user != null && bookmarkRepository.existsByUserAndProblem(user, problem);
    }

    @Transactional(readOnly = true)
    public List<BookmarkedProblemResponse> getMyBookmarks(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return bookmarkRepository.findByUser(user).stream()
                .map(b -> new BookmarkedProblemResponse(
                        b.getProblem().getId(),
                        b.getProblem().getTitle(),
                        b.getProblem().getDifficulty().name(),
                        b.getProblem().getCategory()
                ))
                .collect(Collectors.toList());
    }
}