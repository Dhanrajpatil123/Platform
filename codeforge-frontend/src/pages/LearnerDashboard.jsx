import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMySubmissions } from "../api/submissionApi";
import { getMyEnrollments } from "../api/enrollmentApi";
import { getDashboardStats } from "../api/dashboardApi";
import { getAllProblems, getDailyChallenge } from "../api/problemApi";
import "./LearnerDashboard.css";

export default function LearnerDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "there";

  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [submissions, setSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);

  const [enrolledCourse, setEnrolledCourse] = useState(null);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(true);

  const [dailyChallenge, setDailyChallenge] = useState(null);

  const [isPickingRandom, setIsPickingRandom] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await getDashboardStats();
        setStats(response.data);
      } catch (err) {
        setStats(null);
      } finally {
        setIsLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const response = await getMySubmissions();
        setSubmissions(response.data.slice(0, 5));
      } catch (err) {
        setSubmissions([]);
      } finally {
        setIsLoadingSubmissions(false);
      }
    }
    fetchSubmissions();
  }, []);

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        const response = await getMyEnrollments();
        if (response.data.length > 0) {
          setEnrolledCourse(response.data[response.data.length - 1]);
        }
      } catch (err) {
        setEnrolledCourse(null);
      } finally {
        setIsLoadingEnrollments(false);
      }
    }
    fetchEnrollments();
  }, []);

  useEffect(() => {
    async function fetchDaily() {
      try {
        const response = await getDailyChallenge();
        setDailyChallenge(response.data);
      } catch (err) {
        setDailyChallenge(null);
      }
    }
    fetchDaily();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    navigate("/auth");
  };

  const handleRandomProblem = async () => {
    setIsPickingRandom(true);
    try {
      const response = await getAllProblems();
      const problems = response.data;
      if (problems.length === 0) {
        alert("No problems available yet.");
        return;
      }
      const randomProblem = problems[Math.floor(Math.random() * problems.length)];
      navigate(`/problems/${randomProblem.id}`);
    } catch (err) {
      alert("Failed to load a random problem. Please try again.");
    } finally {
      setIsPickingRandom(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {username}</h1>
        <button
          type="button"
          className="btn btn-secondary logout-btn"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-value">
            {isLoadingStats ? "—" : stats?.streak ?? 0}
          </span>
          <span className="stat-label">Day Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {isLoadingStats ? "—" : stats?.problemsSolved ?? 0}
          </span>
          <span className="stat-label">Problems Solved</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {isLoadingStats
              ? "—"
              : Math.max((stats?.totalProblems ?? 0) - (stats?.problemsSolved ?? 0), 0)}
          </span>
          <span className="stat-label">Remaining</span>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/courses" className="action-card">
          <h3>Explore Courses</h3>
          <p>Browse structured learning tracks</p>
        </Link>

        {!isLoadingEnrollments && enrolledCourse && (
          <Link
            to={`/courses/${enrolledCourse.courseId}`}
            className="action-card"
          >
            <h3>Continue Enrolled Track</h3>
            <p>{enrolledCourse.courseTitle}</p>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${enrolledCourse.progressPercent}%` }}
              />
            </div>
            <span className="progress-label">
              {enrolledCourse.progressPercent}% complete
            </span>
          </Link>
        )}

        {!isLoadingEnrollments && !enrolledCourse && (
          <Link to="/courses" className="action-card">
            <h3>Start a Learning Track</h3>
            <p>You haven't enrolled in a course yet</p>
          </Link>
        )}

        <Link to="/problems" className="action-card">
          <h3>Browse All Problems</h3>
          <p>Full catalog of coding challenges</p>
        </Link>

        {dailyChallenge ? (
          <Link to={`/problems/${dailyChallenge.problemId}`} className="action-card">
            <h3>🗓 Daily Challenge</h3>
            <p>{dailyChallenge.title}</p>
            <span
              className={`difficulty-badge difficulty-${dailyChallenge.difficulty.toLowerCase()}`}
            >
              {dailyChallenge.difficulty}
            </span>
          </Link>
        ) : (
          <Link to="/problems" className="action-card">
            <h3>🗓 Daily Challenge</h3>
            <p>Check back once problems are available</p>
          </Link>
        )}

        <button
          type="button"
          className="action-card action-card-button"
          onClick={handleRandomProblem}
          disabled={isPickingRandom}
        >
          <h3>{isPickingRandom ? "Picking..." : "🎲 Practice a Random Problem"}</h3>
          <p>Jump into a random challenge from the catalog</p>
        </button>

        <Link to="/profile" className="action-card">
          <h3>Manage Profile</h3>
          <p>Update your account settings</p>
        </Link>
      </div>

      <div className="dashboard-recent">
        <h2>Recent Submissions</h2>

        {isLoadingSubmissions && (
          <p className="placeholder-text">Loading...</p>
        )}

        {!isLoadingSubmissions && submissions.length === 0 && (
          <p className="placeholder-text">
            No submissions yet — solve a problem to see your activity here.
          </p>
        )}

        {!isLoadingSubmissions && submissions.length > 0 && (
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Problem</th>
                <th>Status</th>
                <th>Language</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <Link
                      to={`/problems/${sub.problemId}`}
                      className="problem-link"
                    >
                      {sub.problemTitle}
                    </Link>
                  </td>
                  <td>
                    <span
                      className={
                        sub.status === "ACCEPTED"
                          ? "status-badge status-accepted"
                          : "status-badge status-failed"
                      }
                    >
                      {sub.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>{sub.language}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}