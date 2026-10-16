import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getTrackById, enrollInTrack } from "../api/trackApi";
import "./Bootcamps.css";
import "./Tracks.css";

const ICON = { COMPLETED: "✓", IN_PROGRESS: "●", NOT_STARTED: "○" };

export default function TrackDetails() {
  const { trackId } = useParams();
  const [track, setTrack] = useState(null);
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
        const response = await getTrackById(trackId);
        setTrack(response.data);
      } catch (err) {
        setLoadError("Track not found.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [trackId]);

  const handleEnroll = async () => {
    setActionError("");
    setIsBusy(true);
    try {
      const response = await enrollInTrack(trackId);
      setTrack(response.data);
    } catch (err) {
      setActionError(err.response?.data?.error || "Could not enroll. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bc-page">
        <p className="bc-muted">Loading track...</p>
      </div>
    );
  }

  if (loadError || !track) {
    return (
      <div className="bc-page bc-center">
        <p>{loadError || "Track not found."}</p>
        <Link to="/tracks" className="btn btn-secondary">
          Back to Tracks
        </Link>
      </div>
    );
  }

  return (
    <div className="bc-page">
      <div className="bc-banner">
        <div className="bc-card-top">
          <span className="trk-chip">🧭 Learning Track</span>
          {!track.published && <span className="bc-draft">Draft (only admins see this)</span>}
        </div>

        <h1>{track.title}</h1>
        <p className="bc-description">{track.description}</p>

        <div className="bc-meta-row trk-meta">
          <span>📚 {track.courses.length} courses</span>
          <span>🧩 {track.totalProblems} problems</span>
          <span>👥 {track.enrolledCount} learners</span>
        </div>

        {track.enrolled && (
          <div className="trk-progress">
            <div className="bc-meta-row">
              <span>
                {track.solvedProblems} of {track.totalProblems} problems solved
              </span>
              <strong>{track.progressPercent}%</strong>
            </div>
            <div className="bc-bar">
              <div className="bc-bar-fill" style={{ width: `${track.progressPercent}%` }} />
            </div>
          </div>
        )}

        {actionError && <p className="bc-error">{actionError}</p>}

        <div className="bc-actions">
          {!isLoggedIn && (
            <Link to="/auth" className="btn btn-primary">
              Sign in to enroll
            </Link>
          )}
          {isLoggedIn && !track.enrolled && (
            <button type="button" className="btn btn-primary" onClick={handleEnroll} disabled={isBusy}>
              {isBusy ? "Enrolling..." : "Enroll in this track"}
            </button>
          )}
          {track.enrolled && track.certificateCode && (
            <Link to={`/verify/${track.certificateCode}`} className="btn btn-primary">
              🎓 View my certificate
            </Link>
          )}
          {track.enrolled && track.complete && !track.certificateCode && (
            <Link to="/certificates" className="btn btn-primary">
              🎓 Claim your certificate
            </Link>
          )}
          <Link to="/tracks" className="btn btn-secondary">
            All Tracks
          </Link>
        </div>

        <p className="bc-muted trk-note">
          Only problems you solve <strong>after</strong> enrolling count towards your progress.
        </p>
      </div>

      <section className="bc-section">
        <h2>Your roadmap</h2>
        <div className="trk-roadmap">
          {track.courses.map((c, index) => (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className={`trk-step trk-step-${c.status.toLowerCase().replace("_", "-")}`}
            >
              <div className="trk-step-marker">{track.enrolled ? ICON[c.status] : index + 1}</div>
              <div className="trk-step-body">
                <div className="trk-step-title">
                  {index + 1}. {c.title}
                  {c.premium && <span className="premium-chip"> ★ Premium</span>}
                </div>
                <div className="bc-muted">
                  {c.difficulty} · {track.enrolled ? `${c.solvedProblems}/${c.totalProblems}` : c.totalProblems}{" "}
                  problems
                </div>
              </div>
              {track.enrolled && (
                <div className="trk-step-bar">
                  <div className="bc-bar">
                    <div
                      className="bc-bar-fill"
                      style={{
                        width: `${c.totalProblems ? (c.solvedProblems * 100) / c.totalProblems : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}