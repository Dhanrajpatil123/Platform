import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllTracks } from "../api/trackApi";
import "./Bootcamps.css";
import "./Tracks.css";

export default function TrackCatalog() {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await getAllTracks();
        setTracks(response.data);
      } catch (err) {
        setError("Failed to load learning tracks.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bc-page">
      <div className="bc-header">
        <div>
          <h1>Learning Tracks</h1>
          <p className="bc-subtitle">
            Structured paths that bundle several courses. Finish every problem to earn one combined
            certificate.
          </p>
        </div>
      </div>

      {isLoading && <p className="bc-muted">Loading tracks...</p>}
      {error && <p className="bc-error">{error}</p>}
      {!isLoading && !error && tracks.length === 0 && <p className="bc-muted">No tracks available yet.</p>}

      <div className="bc-grid">
        {tracks.map((t) => (
          <Link key={t.id} to={`/tracks/${t.id}`} className="bc-card">
            <div className="bc-card-top">
              <span className="trk-chip">🧭 Track</span>
              {t.enrolled && <span className="bc-enrolled">✓ Enrolled</span>}
              {!t.published && <span className="bc-draft">Draft</span>}
            </div>
            <h3>{t.title}</h3>
            <p className="trk-desc">{t.description}</p>
            <div className="bc-meta-row">
              <span>📚 {t.courseCount} courses</span>
              <span>🧩 {t.problemCount} problems</span>
              <span>👥 {t.enrolledCount}</span>
            </div>
            {t.enrolled && (
              <>
                <div className="bc-bar">
                  <div className="bc-bar-fill" style={{ width: `${t.progressPercent}%` }} />
                </div>
                <div className="bc-muted trk-progress-text">{t.progressPercent}% complete</div>
              </>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}