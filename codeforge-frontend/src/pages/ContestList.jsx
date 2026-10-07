import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllContests } from "../api/contestApi";
import "./ContestList.css";

const STATUS_LABELS = { UPCOMING: "Upcoming", LIVE: "Live", ENDED: "Ended" };

export default function ContestList() {
  const [contests, setContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await getAllContests();
        setContests(response.data);
      } catch (err) {
        setContests([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="contest-list-page">
      <h1>Contests</h1>
      <p className="contest-list-subtext">
        Compete on a set of problems within a fixed time window.
      </p>

      {isLoading && <p className="placeholder-text">Loading contests...</p>}
      {!isLoading && contests.length === 0 && (
        <p className="placeholder-text">No contests have been scheduled yet.</p>
      )}

      <div className="contest-grid">
        {contests.map((c) => (
          <Link key={c.id} to={`/contests/${c.id}`} className="contest-card">
            <div className="contest-card-top">
              <span className={`contest-status contest-status-${c.status.toLowerCase()}`}>
                {STATUS_LABELS[c.status]}
              </span>
              {c.registered && <span className="premium-chip">Registered</span>}
            </div>
            <h3>{c.title}</h3>
            <p className="contest-card-desc">{c.description}</p>
            <p className="contest-card-meta">
              {new Date(c.startTime).toLocaleString()} · {c.problemCount} problem
              {c.problemCount === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}