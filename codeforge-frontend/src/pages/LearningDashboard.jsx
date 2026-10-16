import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyLearning } from "../api/learningApi";
import "./Learning.css";

const fmtDate = (value) => {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};
const fmtTime = (t) => (t ? String(t).slice(0, 5) : "");

function CertButton({ status, code }) {
  if (status === "READY") {
    return (
      <Link to="/certificates" className="btn btn-primary">
        🎓 Claim certificate
      </Link>
    );
  }
  if (status === "ISSUED" && code) {
    return (
      <Link to={`/verify/${code}`} className="btn btn-secondary">
        🎓 View certificate
      </Link>
    );
  }
  return null;
}

function Progress({ percent }) {
  return (
    <div className="ln-bar">
      <div className="ln-bar-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function LearningDashboard() {
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }
    async function load() {
      try {
        const response = await getMyLearning();
        setData(response.data);
      } catch (err) {
        setError("Could not load your learning dashboard.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="ln-page ln-center">
        <p>Please sign in to see your learning.</p>
        <Link to="/auth" className="btn btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="ln-page">
        <p className="ln-muted">Loading your learning...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="ln-page">
        <p className="ln-error">{error || "Something went wrong."}</p>
      </div>
    );
  }

  const action = data.nextAction;

  return (
    <div className="ln-page">
      <h1 className="ln-h1">📚 My Learning</h1>

      <div className={`ln-hero ln-hero-${action.type.toLowerCase()}`}>
        <div className="ln-hero-text">
          <div className="ln-hero-title">{action.title}</div>
          <div className="ln-hero-sub">{action.subtitle}</div>
        </div>
        {action.external ? (
          <a href={action.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {action.buttonText}
          </a>
        ) : (
          <Link to={action.link} className="btn btn-primary">
            {action.buttonText}
          </Link>
        )}
      </div>

      <div className="ln-stats">
        <div className="ln-stat">
          <div className="ln-stat-num">{data.activeCount}</div>
          <div className="ln-stat-label">In progress</div>
        </div>
        <div className="ln-stat">
          <div className="ln-stat-num">{data.completedCount}</div>
          <div className="ln-stat-label">Completed</div>
        </div>
        <div className="ln-stat">
          <div className="ln-stat-num">{data.certificatesEarned}</div>
          <div className="ln-stat-label">Certificates earned</div>
        </div>
        <div className="ln-stat">
          <div className="ln-stat-num ln-gold">{data.certificatesReady}</div>
          <div className="ln-stat-label">Ready to claim</div>
        </div>
      </div>

      {/* Tracks */}
      <h2 className="ln-h2">🧭 Learning tracks</h2>
      {data.tracks.length === 0 ? (
        <p className="ln-muted">
          You haven't joined a track yet. <Link to="/tracks" className="ln-link">Browse tracks</Link>
        </p>
      ) : (
        <div className="ln-grid">
          {data.tracks.map((t) => (
            <div key={t.id} className="ln-card">
              <Link to={`/tracks/${t.id}`} className="ln-card-title">
                {t.title}
              </Link>
              <div className="ln-muted">
                {t.coursesDone}/{t.coursesTotal} courses · {t.solved}/{t.total} problems
              </div>
              <Progress percent={t.percent} />
              {!t.completed && t.nextProblemId && (
                <div className="ln-next">
                  Next: <strong>{t.nextProblemTitle}</strong>
                  <span className="ln-muted"> · {t.nextCourseTitle}</span>
                </div>
              )}
              <div className="ln-actions">
                {!t.completed && t.nextProblemId && (
                  <Link to={`/problems/${t.nextProblemId}?course=${t.nextCourseId}`} className="btn btn-primary">
                    Continue
                  </Link>
                )}
                <CertButton status={t.certificateStatus} code={t.certificateCode} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Courses */}
      <h2 className="ln-h2">📘 Courses</h2>
      {data.courses.length === 0 ? (
        <p className="ln-muted">
          You haven't enrolled in a course yet. <Link to="/courses" className="ln-link">Browse courses</Link>
        </p>
      ) : (
        <div className="ln-grid">
          {data.courses.map((c) => (
            <div key={c.id} className="ln-card">
              <Link to={`/courses/${c.id}`} className="ln-card-title">
                {c.title}
              </Link>
              <div className="ln-muted">
                {c.difficulty} · {c.solved}/{c.total} problems
              </div>
              <Progress percent={c.percent} />
              {!c.completed && c.nextProblemId && (
                <div className="ln-next">
                  Next: <strong>{c.nextProblemTitle}</strong>
                </div>
              )}
              <div className="ln-actions">
                {!c.completed && c.nextProblemId && (
                  <Link to={`/problems/${c.nextProblemId}?course=${c.id}`} className="btn btn-primary">
                    Continue
                  </Link>
                )}
                <CertButton status={c.certificateStatus} code={c.certificateCode} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bootcamps */}
      <h2 className="ln-h2">🏕 Bootcamps</h2>
      {data.bootcamps.length === 0 ? (
        <p className="ln-muted">
          You haven't joined a bootcamp yet. <Link to="/bootcamps" className="ln-link">Browse bootcamps</Link>
        </p>
      ) : (
        <div className="ln-grid">
          {data.bootcamps.map((b) => (
            <div key={b.id} className="ln-card">
              <Link to={`/bootcamps/${b.id}`} className="ln-card-title">
                {b.title}
              </Link>
              <div className="ln-muted">
                {fmtDate(b.startDate)} → {fmtDate(b.endDate)} · {b.status.toLowerCase()}
              </div>
              {b.completedSessions > 0 && (
                <>
                  <div className="ln-muted">
                    Attendance {b.attendancePercent}% ({b.attended}/{b.completedSessions} sessions)
                  </div>
                  <Progress percent={b.attendancePercent} />
                </>
              )}
              {b.nextSession && (
                <div className="ln-next">
                  {b.nextSession.status === "LIVE" ? "🔴 Live: " : "Next session: "}
                  <strong>{b.nextSession.title}</strong>
                  <span className="ln-muted">
                    {" "}
                    · {fmtDate(b.nextSession.date)}, {fmtTime(b.nextSession.startTime)}
                  </span>
                </div>
              )}
              <div className="ln-actions">
                {b.nextSession?.meetingLink && (
                  <a href={b.nextSession.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    Join session
                  </a>
                )}
                <CertButton status={b.certificateStatus} code={b.certificateCode} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}