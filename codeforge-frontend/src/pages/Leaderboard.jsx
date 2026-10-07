import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getGlobalLeaderboard } from "../api/leaderboardApi";
import "./Leaderboard.css";

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUsername = localStorage.getItem("username");

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await getGlobalLeaderboard();
        setEntries(response.data);
      } catch (err) {
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {isLoading && <p className="placeholder-text">Loading leaderboard...</p>}

      {!isLoading && entries.length === 0 && (
        <p className="placeholder-text">
          No one has solved a problem yet — be the first!
        </p>
      )}

      {!isLoading && entries.length > 0 && (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Problems Solved</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.username}
                className={
                  entry.username === currentUsername ? "leaderboard-row-me" : ""
                }
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
                <td>{entry.problemsSolved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}