// import { useState, useEffect } from "react";
// import { useParams, Link } from "react-router-dom";
// import { getCourseById } from "../api/courseApi";
// import {
//   enrollInCourse,
//   checkEnrollment,
//   getMyEnrollments,
// } from "../api/enrollmentApi";
// import { getCourseLeaderboard } from "../api/leaderboardApi";
// import "./CourseDetails.css";

// export default function CourseDetails() {
//   const { courseId } = useParams();

//   const [course, setCourse] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [loadError, setLoadError] = useState("");

//   const [isEnrolled, setIsEnrolled] = useState(false);
//   const [progress, setProgress] = useState(null);
//   const [isEnrolling, setIsEnrolling] = useState(false);
//   const [enrollError, setEnrollError] = useState("");

//   const [leaderboard, setLeaderboard] = useState([]);
//   const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

//   const isLoggedIn = Boolean(localStorage.getItem("token"));
//   const currentUsername = localStorage.getItem("username");

//   useEffect(() => {
//     async function fetchCourse() {
//       setIsLoading(true);
//       setLoadError("");
//       try {
//         const response = await getCourseById(courseId);
//         setCourse(response.data);
//       } catch (err) {
//         setLoadError("Course not found.");
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     fetchCourse();
//   }, [courseId]);

//   useEffect(() => {
//     async function fetchLeaderboard() {
//       setIsLoadingLeaderboard(true);
//       try {
//         const response = await getCourseLeaderboard(courseId);
//         setLeaderboard(response.data);
//       } catch (err) {
//         setLeaderboard([]);
//       } finally {
//         setIsLoadingLeaderboard(false);
//       }
//     }
//     fetchLeaderboard();
//   }, [courseId]);

//   useEffect(() => {
//     if (!isLoggedIn) return;

//     async function fetchEnrollmentStatus() {
//       try {
//         const statusResponse = await checkEnrollment(courseId);
//         setIsEnrolled(statusResponse.data.enrolled);

//         if (statusResponse.data.enrolled) {
//           const enrollmentsResponse = await getMyEnrollments();
//           const match = enrollmentsResponse.data.find(
//             (e) => e.courseId === Number(courseId)
//           );
//           if (match) setProgress(match);
//         }
//       } catch (err) {
//         // Silently leave as not-enrolled — not critical enough to block the page
//       }
//     }
//     fetchEnrollmentStatus();
//   }, [courseId, isLoggedIn]);

//   const handleEnroll = async () => {
//     setEnrollError("");
//     setIsEnrolling(true);
//     try {
//       const response = await enrollInCourse(courseId);
//       setIsEnrolled(true);
//       setProgress(response.data);
//     } catch (err) {
//       setEnrollError(err.response?.data?.error || "Failed to enroll.");
//     } finally {
//       setIsEnrolling(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="course-details-status">
//         <p>Loading course...</p>
//       </div>
//     );
//   }

//   if (loadError || !course) {
//     return (
//       <div className="course-details-status">
//         <p>{loadError || "Course not found."}</p>
//         <Link to="/courses" className="btn btn-secondary">
//           Back to Course Catalog
//         </Link>
//       </div>
//     );
//   }

//   const solvedCount = course.syllabus.filter((item) => item.solved).length;

//   return (
//     <div className="course-details-page">
//       <div className="course-banner">
//         <div className="course-banner-top">
//           <span
//             className={`difficulty-badge difficulty-${course.difficulty.toLowerCase()}`}
//           >
//             {course.difficulty}
//           </span>
//           {course.premium ? (
//             <span className="premium-chip">★ Premium</span>
//           ) : (
//             <span className="free-chip">Free</span>
//           )}
//           <span className="course-banner-hours">
//             ~{course.estimatedHours} hrs
//           </span>
//           <span className="course-banner-enrolled">
//             👥 {course.enrolledCount} enrolled
//           </span>
//         </div>

//         <h1>{course.title}</h1>
//         <p className="course-banner-desc">{course.description}</p>

//         {isEnrolled && progress && (
//           <div className="course-banner-progress">
//             <div className="course-progress-header">
//               <span>
//                 Course Progress — {progress.solvedProblems} of{" "}
//                 {progress.totalProblems} problems completed
//               </span>
//               <span className="course-progress-percent">
//                 {progress.progressPercent}% Complete
//               </span>
//             </div>
//             <div className="progress-bar">
//               <div
//                 className="progress-bar-fill"
//                 style={{ width: `${progress.progressPercent}%` }}
//               />
//             </div>
//           </div>
//         )}

//         {enrollError && <p className="course-enroll-error">{enrollError}</p>}

//         <div className="course-banner-actions">
//           {isLoggedIn && !isEnrolled && (
//             <button
//               type="button"
//               className="btn btn-primary"
//               onClick={handleEnroll}
//               disabled={isEnrolling}
//             >
//               {isEnrolling ? "Enrolling..." : "Enroll in this Course"}
//             </button>
//           )}
//           {!isLoggedIn && (
//             <Link to="/auth" className="btn btn-primary">
//               Sign In to Enroll
//             </Link>
//           )}
//           <Link to="/courses" className="btn btn-secondary">
//             Back to Course Catalog
//           </Link>
//           <Link to="/dashboard" className="btn btn-secondary">
//             Return to Dashboard
//           </Link>
//         </div>
//       </div>

//       <div className="syllabus">
//         <div className="syllabus-header">
//           <h2>Syllabus</h2>
//           {isEnrolled && (
//             <span className="syllabus-solved-count">
//               {solvedCount} / {course.syllabus.length} solved
//             </span>
//           )}
//         </div>

//         <table className="syllabus-table">
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>Title</th>
//               <th>Difficulty</th>
//               <th>Status</th>
//               <th></th>
//             </tr>
//           </thead>
//           <tbody>
//             {course.syllabus.map((item) => (
//               <tr key={item.problemId} className={item.solved ? "syllabus-row-solved" : ""}>
//                 <td>{item.sequenceOrder}</td>
//                 <td>{item.problemTitle}</td>
//                 <td>
//                   <span
//                     className={`difficulty-badge difficulty-${item.problemDifficulty.toLowerCase()}`}
//                   >
//                     {item.problemDifficulty}
//                   </span>
//                 </td>
//                 <td>
//                   {item.solved ? (
//                     <span className="syllabus-status-badge solved">✓ Solved</span>
//                   ) : (
//                     <span className="syllabus-status-badge">○ Not Started</span>
//                   )}
//                 </td>
//                 <td>
//                   <Link
//                     to={`/problems/${item.problemId}?course=${courseId}`}
//                     className="btn btn-primary syllabus-solve-btn"
//                   >
//                     {item.solved ? "Review" : "Solve"}
//                   </Link>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="course-leaderboard">
//         <h2>Course Leaderboard</h2>

//         {isLoadingLeaderboard && (
//           <p className="placeholder-text">Loading leaderboard...</p>
//         )}

//         {!isLoadingLeaderboard && leaderboard.length === 0 && (
//           <p className="placeholder-text">
//             No one has solved a problem in this course yet.
//           </p>
//         )}

//         {!isLoadingLeaderboard && leaderboard.length > 0 && (
//           <table className="leaderboard-table">
//             <thead>
//               <tr>
//                 <th>Rank</th>
//                 <th>Username</th>
//                 <th>Problems Solved</th>
//               </tr>
//             </thead>
//             <tbody>
//               {leaderboard.map((entry, index) => (
//                 <tr
//                   key={entry.username}
//                   className={
//                     entry.username === currentUsername ? "leaderboard-row-me" : ""
//                   }
//                 >
//                   <td className="leaderboard-rank">
//                     {index === 0 && "🥇"}
//                     {index === 1 && "🥈"}
//                     {index === 2 && "🥉"}
//                     {index > 2 && `#${index + 1}`}
//                   </td>
//                   <td>
//                     {entry.username}
//                     {entry.username === currentUsername && (
//                       <span className="leaderboard-you-tag">You</span>
//                     )}
//                   </td>
//                   <td>{entry.problemsSolved}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }






import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getContestById,
  registerForContest,
  startContestAttempt,
  getContestAttempt,
  endContestAttempt,
} from "../api/contestApi";
import ContestTimerBar from "../components/ContestTimerBar";
import ContestResultPanel from "../components/ContestResultPanel";
import ContestWarningModal from "../components/ContestWarningModal";
import useContestLockdown from "../hooks/useContestLockdown";
import "./ContestDetails.css";

const STATUS_LABELS = { UPCOMING: "Upcoming", LIVE: "Live", ENDED: "Ended" };

export default function ContestDetails() {
  const { contestId } = useParams();

  const [contest, setContest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const [attempt, setAttempt] = useState(null);
  const [isLoadingAttempt, setIsLoadingAttempt] = useState(false);
  const [attemptError, setAttemptError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const [result, setResult] = useState(null);

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const loadContest = useCallback(async () => {
    try {
      const response = await getContestById(contestId);
      setContest(response.data);
    } catch (err) {
      setLoadError("Contest not found.");
    }
  }, [contestId]);

  const loadAttempt = useCallback(async () => {
    setIsLoadingAttempt(true);
    try {
      const response = await getContestAttempt(contestId);
      setAttempt(response.data);
    } catch (err) {
      setAttempt(null);
    } finally {
      setIsLoadingAttempt(false);
    }
  }, [contestId]);

  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      setLoadError("");
      await loadContest();
      setIsLoading(false);
    }
    initialLoad();
  }, [loadContest]);

  useEffect(() => {
    if (isLoggedIn && contest && contest.registered) {
      loadAttempt();
    }
  }, [isLoggedIn, contest, loadAttempt]);

  const fetchResult = useCallback(async () => {
    try {
      const response = await endContestAttempt(contestId);
      setResult(response.data);
    } catch (err) {
      setAttemptError(err.response?.data?.error || "Failed to load your result.");
    }
  }, [contestId]);

  useEffect(() => {
    if (attempt && attempt.status === "ENDED" && !result) {
      fetchResult();
    }
  }, [attempt, result, fetchResult]);

  const handleRegister = async () => {
    setRegisterError("");
    setIsRegistering(true);
    try {
      const response = await registerForContest(contestId);
      setContest(response.data);
    } catch (err) {
      setRegisterError(err.response?.data?.error || "Failed to register.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStart = async () => {
    setAttemptError("");
    setIsStarting(true);
    try {
      const response = await startContestAttempt(contestId);
      setAttempt(response.data);
      await loadContest();
    } catch (err) {
      setAttemptError(err.response?.data?.error || "Failed to start the contest.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleEnd = useCallback(async () => {
    setIsEnding(true);
    try {
      const response = await endContestAttempt(contestId);
      setResult(response.data);
      setAttempt((prev) => (prev ? { ...prev, status: "ENDED" } : prev));
      loadContest();
    } catch (err) {
      setAttemptError(err.response?.data?.error || "Failed to end the contest.");
    } finally {
      setIsEnding(false);
    }
  }, [contestId, loadContest]);

  const isAttemptActive = Boolean(attempt && attempt.status === "IN_PROGRESS");
  const { warningState, showResumeModal, resumeFullscreen } = useContestLockdown({
    contestId,
    isActive: isAttemptActive,
    onEnded: handleEnd,
  });

  if (isLoading) {
    return (
      <div className="contest-status-page">
        <p>Loading contest...</p>
      </div>
    );
  }

  if (loadError || !contest) {
    return (
      <div className="contest-status-page">
        <p>{loadError || "Contest not found."}</p>
        <Link to="/contests" className="btn btn-secondary">
          Back to Contests
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="contest-details-page">
        <ContestResultPanel result={result} contestId={contestId} />
      </div>
    );
  }

  const showStartPanel =
    isLoggedIn &&
    contest.registered &&
    contest.status === "LIVE" &&
    attempt &&
    attempt.status === "NOT_STARTED";

  return (
    <div className="contest-details-page">
      {showResumeModal && (
        <ContestWarningModal warningState={warningState} onResume={resumeFullscreen} />
      )}

      <div className="contest-banner">
        <div className="contest-banner-top">
          <span className={`contest-status contest-status-${contest.status.toLowerCase()}`}>
            {STATUS_LABELS[contest.status]}
          </span>
          {contest.registered && <span className="premium-chip">Registered</span>}
        </div>

        <h1>{contest.title}</h1>
        <p className="contest-banner-desc">{contest.description}</p>
        <p className="contest-banner-times">
          Starts {new Date(contest.startTime).toLocaleString()} · Ends{" "}
          {new Date(contest.endTime).toLocaleString()} · Duration once started:{" "}
          {contest.durationMinutes} min · Warning limit: {contest.warningLimit}
        </p>

        {registerError && <p className="contest-error">{registerError}</p>}
        {attemptError && <p className="contest-error">{attemptError}</p>}

        <div className="contest-banner-actions">
          {isLoggedIn && !contest.registered && contest.status !== "ENDED" && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering ? "Registering..." : "Register"}
            </button>
          )}
          {!isLoggedIn && (
            <Link to="/auth" className="btn btn-primary">
              Sign in to register
            </Link>
          )}

          {showStartPanel && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStart}
              disabled={isStarting}
            >
              {isStarting ? "Starting..." : `Start Contest (${contest.durationMinutes} min)`}
            </button>
          )}

          {isAttemptActive && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleEnd}
              disabled={isEnding}
            >
              {isEnding ? "Submitting..." : "End Contest"}
            </button>
          )}

          {contest.status !== "UPCOMING" && (
            <Link to={`/contests/${contestId}/leaderboard`} className="btn btn-secondary">
              View Leaderboard
            </Link>
          )}

          {!isAttemptActive && (
            <Link to="/contests" className="btn btn-secondary">
              Back to Contests
            </Link>
          )}
        </div>
      </div>

      {isAttemptActive && <ContestTimerBar deadline={attempt.deadline} onExpire={handleEnd} />}

      {isLoadingAttempt && <p className="placeholder-text">Checking your attempt...</p>}

      <div className="contest-problems">
        <h2>Problems</h2>

        {contest.problems.length === 0 && (
          <p className="placeholder-text">No problems added to this contest yet.</p>
        )}

        <table className="contest-problems-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Difficulty</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contest.problems.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.locked ? (
                    <span className="contest-locked-title" title={p.lockMessage}>
                      🔒 {p.title}
                    </span>
                  ) : (
                    <Link to={`/problems/${p.id}`} className="problem-link">
                      {p.title}
                    </Link>
                  )}
                </td>
                <td>
                  <span className={`difficulty-badge difficulty-${p.difficulty.toLowerCase()}`}>
                    {p.difficulty}
                  </span>
                </td>
                <td>
                  {!p.locked && (
                    <Link to={`/problems/${p.id}`} className="btn btn-primary contest-solve-btn">
                      Solve
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}