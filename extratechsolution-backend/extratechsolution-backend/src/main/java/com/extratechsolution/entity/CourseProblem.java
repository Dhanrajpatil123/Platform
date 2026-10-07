package com.extratechsolution.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "course_problems")
@Getter
@Setter
@NoArgsConstructor
public class CourseProblem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false)
    private Integer sequenceOrder;

    // Lombok's @Getter/@Setter needs jakarta.persistence.Column imported —
    // see note below if this doesn't compile
}
