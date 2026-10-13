import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAllBootcamps } from "../api/bootcampApi";
import { formatDate } from "../utils/dateUtils";
import "./Bootcamps.css";

const TABS = [
  { key: "ALL", label: "All" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "ONGOING", label: "Ongoing" },
  { key: "COMPLETED", label: "Completed" },
];

const STATUS_LABEL = { UPCOMING: "Upcoming", ONGOING: "Ongoing", COMPLETED: "Completed" };
const MODE_LABEL = { ONLINE: "Online", OFFLINE: "Offline", HYBRID: "Hybrid" };

export default function BootcampCatalog() {
  const [bootcamps, setBootcamps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    async function load() {
      try {
        const response = await getAllBootcamps();
        setBootcamps(response.data);
      } catch (err) {
        setLoadError("Failed to load bootcamps.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const visible = useMemo(() => {
    return bootcamps.filter((b) => {
      const matchesTab = tab === "ALL" || b.status === tab;
      const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase());
      const matchesMine = !onlyMine || b.enrolled;
      return matchesTab && matchesSearch && matchesMine;
    });
  }, [bootcamps, tab, search, onlyMine]);

  return (
    <div className="bc-page">
      <div className="bc-header">
        <div>
          <h1>Bootcamps</h1>
          <p className="bc-subtitle">
            Cohort-based programs with fixed dates, limited seats and a curated set of courses.
          </p>
        </div>
      </div>

      <div className="bc-toolbar">
        <div className="bc-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={tab === t.key ? "bc-tab active" : "bc-tab"}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="bc-search"
          placeholder="Search bootcamps..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoggedIn && (
          <label className="bc-check">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
            />
            My bootcamps
          </label>
        )}
      </div>

      {isLoading && <p className="bc-muted">Loading bootcamps...</p>}
      {loadError && <p className="bc-error">{loadError}</p>}
      {!isLoading && !loadError && visible.length === 0 && (
        <p className="bc-muted">No bootcamps match your filters.</p>
      )}

      <div className="bc-grid">
        {visible.map((b) => {
          const seatsLeft = Math.max(b.seats - b.enrolledCount, 0);
          const fillPercent = b.seats > 0 ? Math.min((b.enrolledCount / b.seats) * 100, 100) : 0;

          return (
            <Link key={b.id} to={`/bootcamps/${b.id}`} className="bc-card">
              <div className="bc-card-top">
                <span className={`bc-status bc-status-${b.status.toLowerCase()}`}>
                  {STATUS_LABEL[b.status]}
                </span>
                <span className="bc-mode">{MODE_LABEL[b.mode] || b.mode}</span>
                <span className={b.fee > 0 ? "bc-fee" : "bc-fee bc-fee-free"}>
                  {b.fee > 0 ? `₹${b.fee.toLocaleString("en-IN")}` : "Free"}
                </span>
              </div>

              <h3>
                {b.title}
                {!b.published && <span className="bc-draft">Draft</span>}
              </h3>

              <p className="bc-dates">
                {formatDate(b.startDate)} → {formatDate(b.endDate)}
              </p>

              <div className="bc-meta-row">
                <span>📚 {b.courseCount} courses</span>
                <span>
                  👥 {b.enrolledCount}/{b.seats}
                </span>
              </div>

              <div className="bc-bar">
                <div className="bc-bar-fill" style={{ width: `${fillPercent}%` }} />
              </div>

              <div className="bc-card-foot">
                {b.enrolled ? (
                  <span className="bc-enrolled">✓ Enrolled</span>
                ) : seatsLeft === 0 ? (
                  <span className="bc-full">Full</span>
                ) : (
                  <span className="bc-muted">{seatsLeft} seats left</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}