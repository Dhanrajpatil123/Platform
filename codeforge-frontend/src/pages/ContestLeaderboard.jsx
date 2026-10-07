import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getContestById, getContestLeaderboard } from "../api/contestApi";
import "./ContestLeaderboard.css";

export default function ContestLeaderboard() {
  const { contestId } = useParams();
  const [contestTitle, setContestTitle] = useState("");
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUsername = localStorage.getItem("username");

  useEffect(() => {
    async function load() {
      try {
        const [contestResponse, leaderboardResponse] = await Promise.all([
          getContestById(contestId),
          getContestLeaderboard(contestId),
        ]);
        setContestTitle(contestResponse.data.title);
        setEntries(leaderboardResponse.data);
      } catch (err) {
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [contestId]);

  return (
    <div className="contest-leaderboard-page">
      <div className="contest-leaderboard-header">
        <h1>{contestTitle ? `${contestTitle} — Leaderboard` : "Contest Leaderboard"}</h1>
        <Link to={`/contests/${contestId}`} className="btn btn-secondary">
          Back to Contest
        </Link>
      </div>

      {isLoading && <p className="placeholder-text">Loading leaderboard...</p>}
      {!isLoading && entries.length === 0 && (
        <p className="placeholder-text">No one has started this contest yet.</p>
      )}

      {!isLoading && entries.length > 0 && (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Solved</th>
              <th>Time Taken</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.username}
                className={entry.username === currentUsername ? "leaderboard-row-me" : ""}
              >
                <td className="leaderboard-rank">
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && `#${index + 1}`}
                </td>
                <td>
                  {entry.username}
                  {entry.username === currentUsername && (
                    <span className="leaderboard-you-tag">You</span>
                  )}
                </td>
                <td>
                  {entry.solvedCount}/{entry.totalProblems}
                </td>
                <td>{entry.timeTakenMinutes != null ? `${entry.timeTakenMinutes} min` : "—"}</td>
                <td>{entry.status === "IN_PROGRESS" ? "In Progress" : "Finished"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}