import "./DifficultyRing.css";

const COLORS = { EASY: "#27c93f", MEDIUM: "#ffbd2e", HARD: "#ff5f56" };

// Builds one continuous ring: each difficulty gets an arc slice sized by its
// SHARE of the total problem count, and within that slice, the solved
// fraction is drawn in the difficulty's color while the rest stays dim.
// This is real data shaped into a ring, not a decorative gauge — the exact
// proportions change as problems are added or solved.
function buildGradient(difficultyBreakdown, totalProblems) {
  if (totalProblems === 0) return "#2a2a3d";

  let cursorDeg = 0;
  const stops = [];

  difficultyBreakdown.forEach((d) => {
    const bandDeg = (d.total / totalProblems) * 360;
    const solvedDeg = d.total > 0 ? bandDeg * (d.solved / d.total) : 0;
    const color = COLORS[d.difficulty] || "#2a2a3d";

    if (solvedDeg > 0) {
      stops.push(`${color} ${cursorDeg}deg ${cursorDeg + solvedDeg}deg`);
    }
    stops.push(`#20202f ${cursorDeg + solvedDeg}deg ${cursorDeg + bandDeg}deg`);
    cursorDeg += bandDeg;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

export default function DifficultyRing({ difficultyBreakdown, totalSolved, totalProblems }) {
  const gradient = buildGradient(difficultyBreakdown, totalProblems);

  return (
    <div className="difficulty-ring" style={{ background: gradient }}>
      <div className="difficulty-ring-inner">
        <span className="difficulty-ring-number">{totalSolved}</span>
        <span className="difficulty-ring-total">/ {totalProblems}</span>
        <span className="difficulty-ring-label">Solved</span>
      </div>
    </div>
  );
}