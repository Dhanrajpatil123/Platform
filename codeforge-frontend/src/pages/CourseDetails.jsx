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

//   return (
//     <div className="course-details-page">
//       <div className="course-banner">
//         <div className="course-banner-top">
//           <span
//             className={`difficulty-badge difficulty-${course.difficulty.toLowerCase()}`}
//           >
//             {course.premium && <span className="premium-chip">★ Premium</span>}
//             {course.difficulty}
//           </span>
//           <span className="course-banner-hours">
//             ~{course.estimatedHours} hrs
//           </span>
//         </div>

//         <h1>{course.title}</h1>
//         <p className="course-banner-desc">{course.description}</p>

//         {isEnrolled && progress && (
//           <div className="course-banner-progress">
//             <div className="progress-bar">
//               <div
//                 className="progress-bar-fill"
//                 style={{ width: `${progress.progressPercent}%` }}
//               />
//             </div>
//             <span className="progress-label">
//               {progress.progressPercent}% complete · {progress.solvedProblems}
//               /{progress.totalProblems} problems solved
//             </span>
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
//         <h2>Syllabus</h2>
//         <table className="syllabus-table">
//           <thead>
//             <tr>
//               <th>#</th>
//               <th>Title</th>
//               <th>Difficulty</th>
//               <th></th>
//             </tr>
//           </thead>
//           <tbody>
//             {course.syllabus.map((item) => (
//               <tr key={item.problemId}>
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
//                   <Link
//                     to={`/problems/${item.problemId}`}
//                     className="btn btn-primary syllabus-solve-btn"
//                   >
//                     Solve
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





import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getCourseById } from "../api/courseApi";
import {
  enrollInCourse,
  checkEnrollment,
  getMyEnrollments,
} from "../api/enrollmentApi";
import { getCourseLeaderboard } from "../api/leaderboardApi";
import "./CourseDetails.css";

export default function CourseDetails() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const currentUsername = localStorage.getItem("username");

  useEffect(() => {
    async function fetchCourse() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await getCourseById(courseId);
        setCourse(response.data);
      } catch (err) {
        setLoadError("Course not found.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoadingLeaderboard(true);
      try {
        const response = await getCourseLeaderboard(courseId);
        setLeaderboard(response.data);
      } catch (err) {
        setLeaderboard([]);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    }
    fetchLeaderboard();
  }, [courseId]);

  useEffect(() => {
    if (!isLoggedIn) return;

    async function fetchEnrollmentStatus() {
      try {
        const statusResponse = await checkEnrollment(courseId);
        setIsEnrolled(statusResponse.data.enrolled);

        if (statusResponse.data.enrolled) {
          const enrollmentsResponse = await getMyEnrollments();
          const match = enrollmentsResponse.data.find(
            (e) => e.courseId === Number(courseId)
          );
          if (match) setProgress(match);
        }
      } catch (err) {
        // Leave as not-enrolled — not critical enough to block the page
      }
    }
    fetchEnrollmentStatus();
  }, [courseId, isLoggedIn]);

  const handleEnroll = async () => {
    setEnrollError("");
    setIsEnrolling(true);
    try {
      const response = await enrollInCourse(courseId);
      setIsEnrolled(true);
      setProgress(response.data);
    } catch (err) {
      setEnrollError(err.response?.data?.error || "Failed to enroll.");
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="course-details-status">
        <p>Loading course...</p>
      </div>
    );
  }

  if (loadError || !course) {
    return (
      <div className="course-details-status">
        <p>{loadError || "Course not found."}</p>
        <Link to="/courses" className="btn btn-secondary">
          Back to Course Catalog
        </Link>
      </div>
    );
  }

  const solvedCount = course.syllabus.filter((item) => item.solved).length;

  return (
    <div className="course-details-page">
      <div className="course-banner">
        <div className="course-banner-top">
          <span
            className={`difficulty-badge difficulty-${course.difficulty.toLowerCase()}`}
          >
            {course.difficulty}
          </span>
          {course.premium ? (
            <span className="premium-chip">★ Premium</span>
          ) : (
            <span className="free-chip">Free</span>
          )}
          <span className="course-banner-hours">~{course.estimatedHours} hrs</span>
          <span className="course-banner-enrolled">👥 {course.enrolledCount} enrolled</span>
        </div>

        <h1>{course.title}</h1>
        <p className="course-banner-desc">{course.description}</p>

        {isEnrolled && progress && (
          <div className="course-banner-progress">
            <div className="course-progress-header">
              <span>
                Course Progress — {progress.solvedProblems} of {progress.totalProblems} problems
                completed
              </span>
              <span className="course-progress-percent">
                {progress.progressPercent}% Complete
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {enrollError && <p className="course-enroll-error">{enrollError}</p>}

        <div className="course-banner-actions">
          {isLoggedIn && !isEnrolled && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleEnroll}
              disabled={isEnrolling}
            >
              {isEnrolling ? "Enrolling..." : "Enroll in this Course"}
            </button>
          )}
          {!isLoggedIn && (
            <Link to="/auth" className="btn btn-primary">
              Sign In to Enroll
            </Link>
          )}
          <Link to="/courses" className="btn btn-secondary">
            Back to Course Catalog
          </Link>
          <Link to="/dashboard" className="btn btn-secondary">
            Return to Dashboard
          </Link>
        </div>
      </div>

      <div className="syllabus">
        <div className="syllabus-header">
          <h2>Syllabus</h2>
          {isLoggedIn && (
            <span className="syllabus-solved-count">
              {solvedCount} / {course.syllabus.length} solved
            </span>
          )}
        </div>

        <table className="syllabus-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {course.syllabus.map((item) => (
              <tr key={item.problemId} className={item.solved ? "syllabus-row-solved" : ""}>
                <td>{item.sequenceOrder}</td>
                <td>{item.problemTitle}</td>
                <td>
                  <span
                    className={`difficulty-badge difficulty-${item.problemDifficulty.toLowerCase()}`}
                  >
                    {item.problemDifficulty}
                  </span>
                </td>
                <td>
                  {item.solved ? (
                    <span className="syllabus-status-badge solved">✓ Solved</span>
                  ) : (
                    <span className="syllabus-status-badge">○ Not Started</span>
                  )}
                </td>
                <td>
                  <Link
                    to={`/problems/${item.problemId}?course=${courseId}`}
                    className="btn btn-primary syllabus-solve-btn"
                  >
                    {item.solved ? "Review" : "Solve"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="course-leaderboard">
        <h2>Course Leaderboard</h2>

        {isLoadingLeaderboard && <p className="placeholder-text">Loading leaderboard...</p>}

        {!isLoadingLeaderboard && leaderboard.length === 0 && (
          <p className="placeholder-text">No one has solved a problem in this course yet.</p>
        )}

        {!isLoadingLeaderboard && leaderboard.length > 0 && (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Problems Solved</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.username}
                  className={entry.username === currentUsername ? "leaderboard-row-me" : ""}
                >
                  <td className="leaderboard-rank">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && `#${index + 1}`}
                  </td>
                  <td>
                    {entry.username}
                    {entry.username === currentUsername && (
                      <span className="leaderboard-you-tag">You</span>
                    )}
                  </td>
                  <td>{entry.problemsSolved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}