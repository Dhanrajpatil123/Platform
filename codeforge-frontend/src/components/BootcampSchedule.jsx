import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBootcampSessions } from "../api/bootcampApi";
import { formatDate, parseLocalDate } from "../utils/dateUtils";

const timeText = (t) => (t ? String(t).slice(0, 5) : "");
const isToday = (dateStr) => parseLocalDate(dateStr).toDateString() === new Date().toDateString();

export default function BootcampSchedule({ bootcampId, enrolled }) {
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const response = await getBootcampSessions(bootcampId);
        if (!cancelled) setSchedule(response.data);
      } catch (err) {
        if (!cancelled) setError("Could not load the schedule.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [bootcampId, enrolled, isLoggedIn]);

  

  return (
    <section className="bc-section">
      <h2>Schedule</h2>

      {!isLoggedIn && (
        <p className="bc-muted">
          <Link to="/auth" className="bc-link">
            Sign in
          </Link>{" "}
          to see the session schedule.
        </p>
      )}

      {isLoggedIn && isLoading && <p className="bc-muted">Loading schedule...</p>}
      {error && <p className="bc-error">{error}</p>}

      {schedule && (
        <>
          {schedule.enrolled && (
            <div className="bc-attendance-summary">
              <div className="bc-meta-row">
                <span>
                  Your attendance:{" "}
                  <strong>
                    {schedule.attendedCount} of {schedule.completedSessions}
                  </strong>{" "}
                  completed sessions
                </span>
                <strong>{schedule.attendancePercent}%</strong>
              </div>
              <div className="bc-bar">
                <div className="bc-bar-fill" style={{ width: `${schedule.attendancePercent}%` }} />
              </div>
            </div>
          )}

          {schedule.sessions.length === 0 && (
            <p className="bc-muted">No sessions have been scheduled yet.</p>
          )}

          <div className="bc-session-list">
            {schedule.sessions.map((s) => (
              <div key={s.id} className={`bc-session bc-session-${s.status.toLowerCase()}`}>
                <div className="bc-session-date">
                  <div className="bc-session-day">{parseLocalDate(s.sessionDate).getDate()}</div>
                  <div className="bc-session-month">
                    {parseLocalDate(s.sessionDate).toLocaleDateString(undefined, { month: "short" })}
                  </div>
                </div>

                <div className="bc-session-body">
                  <div className="bc-session-title">
                    {s.title}
                    {s.status === "LIVE" && <span className="bc-live">● LIVE</span>}
                    {s.status === "UPCOMING" && isToday(s.sessionDate) && (
                      <span className="bc-today">Today</span>
                    )}
                  </div>
                  <div className="bc-muted">
                    {formatDate(s.sessionDate)} · {timeText(s.startTime)} – {timeText(s.endTime)}
                    {s.location && <> · 📍 {s.location}</>}
                  </div>
                  {s.description && <div className="bc-session-desc">{s.description}</div>}
                </div>

                <div className="bc-session-side">
                  {schedule.enrolled && s.status === "COMPLETED" && (
                    <span className={s.attended ? "bc-present" : "bc-absent"}>
                      {s.attended ? "✓ Present" : "✗ Absent"}
                    </span>
                  )}
                  {s.meetingLink && s.status !== "COMPLETED" && (
                    <a
                      href={s.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      Join
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!schedule.linksVisible && schedule.sessions.length > 0 && (
            <p className="bc-muted">Enroll to see meeting links and track your attendance.</p>
          )}
        </>
      )}
    </section>
  );
}