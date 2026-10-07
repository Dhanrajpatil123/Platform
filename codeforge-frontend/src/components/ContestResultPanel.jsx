import { Link } from "react-router-dom";
import "./ContestResultPanel.css";

function tierEmoji(scorePercent) {
  if (scorePercent === 100) return "🏆";
  if (scorePercent >= 75) return "🎉";
  if (scorePercent >= 50) return "👏";
  if (scorePercent > 0) return "💪";
  return "🌱";
}

export default function ContestResultPanel({ result }) {
  return (
    <div className="contest-result-panel">
      <div className="contest-result-emoji">{tierEmoji(result.scorePercent)}</div>
      <h2>{result.message}</h2>

      <div className="contest-result-score">
        <span className="contest-result-score-number">{result.scorePercent}%</span>
        <span className="contest-result-score-label">
          {result.solvedCount} / {result.totalProblems} problems solved
        </span>
      </div>

      <p className="contest-result-time">
        Time taken: {result.timeTakenMinutes} minute{result.timeTakenMinutes === 1 ? "" : "s"}
      </p>

      <div className="contest-result-problems">
        {result.problems.map((p) => (
          <div key={p.id} className="contest-result-problem-row">
            <span>
              {p.solved ? "✅" : "⬜"} {p.title}
            </span>
            <span className={`difficulty-badge difficulty-${p.difficulty.toLowerCase()}`}>
              {p.difficulty}
            </span>
          </div>
        ))}
      </div>

      {result.suggestions.length > 0 && (
        <div className="contest-result-suggestions">
          <h3>Suggestions</h3>
          <ul>
            {result.suggestions.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <Link to="/contests" className="btn btn-primary contest-result-back">
        Back to Contests
      </Link>
    </div>
  );
}