package com.extratechsolution.repository;

import com.extratechsolution.entity.Bookmark;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    Optional<Bookmark> findByUserAndProblem(User user, Problem problem);

    List<Bookmark> findByUser(User user);

    boolean existsByUserAndProblem(User user, Problem problem);
}