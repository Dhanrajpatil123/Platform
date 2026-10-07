import { Link } from "react-router-dom";
import "./PremiumLock.css";

export default function PremiumLock({ problem }) {
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const isContestLock = Boolean(problem.contestId);

  return (
    <div className="premium-lock">
      <div className="premium-lock-card">
        <div className="premium-lock-icon">🔒</div>
        <h1>{problem.title}</h1>

        <div className="premium-lock-meta">
          <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
            {problem.difficulty}
          </span>
          {(problem.tags || []).map((tag) => (
            <span key={tag} className="tag-chip">
              {tag}
            </span>
          ))}
        </div>

        <p className="premium-lock-text">
          {/* {problem.lockMessage ||
            "This problem is currently locked."} */}
            {problem.lockMessage ||
                "This problem is currently locked."}
        </p>

        <div className="premium-lock-actions">
          {isContestLock ? (
            <Link to={`/contests/${problem.contestId}`} className="btn btn-primary">
              View Contest
            </Link>
          ) : isLoggedIn ? (
            <Link to="/premium" className="btn btn-primary">
              Upgrade to Premium
            </Link>
          ) : (
            <>
              <Link to="/auth" className="btn btn-primary">
                Sign in
              </Link>
              <Link to="/premium" className="btn btn-secondary">
                See plans
              </Link>
            </>
          )}
          <Link to="/problems" className="btn btn-secondary">
            Back to Problem Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}