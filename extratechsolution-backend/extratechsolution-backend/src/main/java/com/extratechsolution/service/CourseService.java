package com.extratechsolution.service;

import com.extratechsolution.dto.CourseDetailResponse;
import com.extratechsolution.dto.CourseRequest;
import com.extratechsolution.dto.CourseSummaryResponse;
import com.extratechsolution.entity.Course;
import com.extratechsolution.entity.CourseProblem;
import com.extratechsolution.entity.Problem;
import com.extratechsolution.enums.SubmissionStatus;
import com.extratechsolution.repository.CourseEnrollmentRepository;
import com.extratechsolution.repository.CourseRepository;
import com.extratechsolution.repository.ProblemRepository;
import com.extratechsolution.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final ProblemRepository problemRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;

    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> getAllCourses() {
        return courseRepository.findAll()
                .stream()
                .map(course -> new CourseSummaryResponse(
                        course.getId(),
                        course.getTitle(),
                        course.getDifficulty(),
                        course.getCategory(),
                        course.getEstimatedHours(),
                        course.getSyllabus().size(),
                        course.isPremium(),
                        enrollmentRepository.countByCourseId(course.getId())
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CourseDetailResponse getCourseById(Long id, String usernameOrNull) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found with id: " + id));
        return toDetailResponse(course, usernameOrNull);
    }

    @Transactional
    public CourseDetailResponse createCourse(CourseRequest request) {
        Course course = new Course();
        applyRequestToEntity(request, course);
        Course saved = courseRepository.save(course);
        return toDetailResponse(saved, null);
    }

    @Transactional
    public CourseDetailResponse updateCourse(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found with id: " + id));

        applyRequestToEntity(request, course);
        Course saved = courseRepository.save(course);
        return toDetailResponse(saved, null);
    }

    @Transactional
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new IllegalArgumentException("Course not found with id: " + id);
        }
        enrollmentRepository.deleteByCourseId(id);
        courseRepository.deleteById(id);
    }

    private void applyRequestToEntity(CourseRequest request, Course course) {
        course.setTitle(request.getTitle());
        course.setDifficulty(request.getDifficulty());
        course.setCategory(request.getCategory());
        course.setDescription(request.getDescription());
        course.setEstimatedHours(request.getEstimatedHours());

        if (request.getPremium() != null) {
            course.setPremium(request.getPremium());
        }

        // Change the EXISTING collection in place. Never call setSyllabus(newList)
        // on a managed entity: with orphanRemoval = true, Hibernate rejects a
        // replaced collection instance.
        course.getSyllabus().clear();

        List<Long> problemIds = request.getProblemIds();
        for (int i = 0; i < problemIds.size(); i++) {
            Long problemId = problemIds.get(i);
            Problem problem = problemRepository.findById(problemId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Problem not found with id: " + problemId));

            CourseProblem courseProblem = new CourseProblem();
            courseProblem.setCourse(course);
            courseProblem.setProblem(problem);
            courseProblem.setSequenceOrder(i + 1);
            course.getSyllabus().add(courseProblem);
        }
    }

    private CourseDetailResponse toDetailResponse(Course course, String usernameOrNull) {
        List<CourseDetailResponse.SyllabusItemResponse> syllabusItems = course.getSyllabus()
                .stream()
                .map(cp -> {
                    boolean solved = usernameOrNull != null
                            && submissionRepository.existsByUser_UsernameAndProblem_IdAndStatus(
                            usernameOrNull, cp.getProblem().getId(), SubmissionStatus.ACCEPTED);

                    return new CourseDetailResponse.SyllabusItemResponse(
                            cp.getProblem().getId(),
                            cp.getProblem().getTitle(),
                            cp.getProblem().getDifficulty(),
                            cp.getSequenceOrder(),
                            solved
                    );
                })
                .collect(Collectors.toList());

        return new CourseDetailResponse(
                course.getId(),
                course.getTitle(),
                course.getDifficulty(),
                course.getCategory(),
                course.getDescription(),
                course.getEstimatedHours(),
                course.isPremium(),
                enrollmentRepository.countByCourseId(course.getId()),
                syllabusItems
        );
    }
}