import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getBootcampById, enrollInBootcamp, leaveBootcamp } from "../api/bootcampApi";
import { formatDate, timelineText } from "../utils/dateUtils";
import "./Bootcamps.css";

const STATUS_LABEL = { UPCOMING: "Upcoming", ONGOING: "Ongoing", COMPLETED: "Completed" };
const MODE_LABEL = { ONLINE: "Online", OFFLINE: "Offline", HYBRID: "Hybrid" };

export default function BootcampDetails() {
  const { bootcampId } = useParams();

  const [bootcamp, setBootcamp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await getBootcampById(bootcampId);
        setBootcamp(response.data);
      } catch (err) {
        setLoadError("Bootcamp not found.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [bootcampId]);

  const runAction = async (action) => {
    setActionError("");
    setIsBusy(true);
    try {
      const response = await action(bootcampId);
      setBootcamp(response.data);
    } catch (err) {
      setActionError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleLeave = () => {
    if (!window.confirm("Leave this bootcamp? Your seat will be released.")) return;
    runAction(leaveBootcamp);
  };

  if (isLoading) {
    return (
      <div className="bc-page">
        <p className="bc-muted">Loading bootcamp...</p>
      </div>
    );
  }

  if (loadError || !bootcamp) {
    return (
      <div className="bc-page bc-center">
        <p>{loadError || "Bootcamp not found."}</p>
        <Link to="/bootcamps" className="btn btn-secondary">
          Back to Bootcamps
        </Link>
      </div>
    );
  }

  const seatsLeft = Math.max(bootcamp.seats - bootcamp.enrolledCount, 0);
  const fillPercent =
    bootcamp.seats > 0 ? Math.min((bootcamp.enrolledCount / bootcamp.seats) * 100, 100) : 0;
  const isFull = seatsLeft === 0;
  const isCompleted = bootcamp.status === "COMPLETED";

  return (
    <div className="bc-page">
      <div className="bc-banner">
        <div className="bc-card-top">
          <span className={`bc-status bc-status-${bootcamp.status.toLowerCase()}`}>
            {STATUS_LABEL[bootcamp.status]}
          </span>
          <span className="bc-mode">{MODE_LABEL[bootcamp.mode] || bootcamp.mode}</span>
          {!bootcamp.published && <span className="bc-draft">Draft (only admins see this)</span>}
        </div>

        <h1>{bootcamp.title}</h1>

        <p className="bc-dates">
          📅 {formatDate(bootcamp.startDate)} → {formatDate(bootcamp.endDate)} ·{" "}
          <strong>{timelineText(bootcamp.status, bootcamp.startDate, bootcamp.endDate)}</strong>
        </p>

        <div className="bc-seats">
          <div className="bc-meta-row">
            <span>
              👥 {bootcamp.enrolledCount} of {bootcamp.seats} seats filled
            </span>
            <span className={isFull ? "bc-full" : "bc-muted"}>
              {isFull ? "Full" : `${seatsLeft} left`}
            </span>
          </div>
          <div className="bc-bar">
            <div className="bc-bar-fill" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>

        {actionError && <p className="bc-error">{actionError}</p>}

        <div className="bc-actions">
          {!isLoggedIn && (
            <Link to="/auth" className="btn btn-primary">
              Sign in to enroll
            </Link>
          )}

          {isLoggedIn && !bootcamp.enrolled && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => runAction(enrollInBootcamp)}
              disabled={isBusy || isFull || isCompleted}
            >
              {isBusy
                ? "Enrolling..."
                : isCompleted
                ? "Bootcamp finished"
                : isFull
                ? "Bootcamp full"
                : "Enroll now"}
            </button>
          )}

          {isLoggedIn && bootcamp.enrolled && (
            <>
              <span className="bc-enrolled">✓ You're enrolled</span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLeave}
                disabled={isBusy}
              >
                {isBusy ? "Please wait..." : "Leave bootcamp"}
              </button>
            </>
          )}

          <Link to="/bootcamps" className="btn btn-secondary">
            All Bootcamps
          </Link>
        </div>
      </div>

      <section className="bc-section">
        <h2>About this bootcamp</h2>
        <p className="bc-description">{bootcamp.description}</p>
      </section>

      <section className="bc-section">
        <h2>Courses included</h2>
        {bootcamp.courses.length === 0 && (
          <p className="bc-muted">No courses have been linked to this bootcamp yet.</p>
        )}
        <div className="bc-course-list">
          {bootcamp.courses.map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="bc-course">
              <div>
                <strong>{c.title}</strong>
                <span className="bc-muted"> · {c.problemCount} problems</span>
              </div>
              <div className="bc-course-chips">
                <span className={`difficulty-badge difficulty-${c.difficulty.toLowerCase()}`}>
                  {c.difficulty}
                </span>
                {c.premium && <span className="premium-chip">★ Premium</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}