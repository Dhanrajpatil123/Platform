package com.extratechsolution.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "bootcamps")
@Getter
@Setter
@NoArgsConstructor
public class Bootcamp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    // ONLINE, OFFLINE or HYBRID
    @Column(nullable = false)
    private String mode;

    @Column(nullable = false)
    private Integer seats;

    @Column(nullable = false)
    private boolean published = true;

    @ManyToMany
    @JoinTable(
            name = "bootcamp_courses",
            joinColumns = @JoinColumn(name = "bootcamp_id"),
            inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private Set<Course> courses = new LinkedHashSet<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false, columnDefinition = "INT NOT NULL DEFAULT 0")
    private int fee = 0;   // rupees; 0 = free
}