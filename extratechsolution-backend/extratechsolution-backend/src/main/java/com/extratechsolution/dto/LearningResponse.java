package com.extratechsolution.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class LearningResponse {
    private int activeCount;
    private int completedCount;
    private int certificatesEarned;
    private int certificatesReady;
    private NextAction nextAction;
    private List<CourseCard> courses;
    private List<TrackCard> tracks;
    private List<BootcampCard> bootcamps;

    @Getter
    @AllArgsConstructor
    public static class NextAction {
        private String type;        // SESSION, CERTIFICATE, CONTINUE, START, EXPLORE
        private String title;
        private String subtitle;
        private String link;
        private String buttonText;
        private boolean external;
    }

    @Getter
    @AllArgsConstructor
    public static class CourseCard {
        private Long id;
        private String title;
        private String difficulty;
        private int solved;
        private int total;
        private int percent;
        private boolean completed;
        private Long nextProblemId;
        private String nextProblemTitle;
        private String certificateStatus;   // NONE, READY, ISSUED, REVOKED
        private String certificateCode;
    }

    @Getter
    @AllArgsConstructor
    public static class TrackCard {
        private Long id;
        private String title;
        private int solved;
        private int total;
        private int percent;
        private boolean completed;
        private int coursesDone;
        private int coursesTotal;
        private Long nextCourseId;
        private String nextCourseTitle;
        private Long nextProblemId;
        private String nextProblemTitle;
        private String certificateStatus;
        private String certificateCode;
    }

    @Getter
    @AllArgsConstructor
    public static class SessionInfo {
        private Long id;
        private String title;
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private String location;
        private String meetingLink;
        private String status;      // UPCOMING, LIVE
    }

    @Getter
    @AllArgsConstructor
    public static class BootcampCard {
        private Long id;
        private String title;
        private String status;      // UPCOMING, ONGOING, COMPLETED
        private LocalDate startDate;
        private LocalDate endDate;
        private int attendancePercent;
        private int attended;
        private int completedSessions;
        private SessionInfo nextSession;
        private String certificateStatus;
        private String certificateCode;
    }
}