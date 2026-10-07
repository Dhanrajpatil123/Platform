import { useState, useEffect } from "react";
import "./ContestFloatingTimer.css";

function formatDuration(totalSeconds) {
  const s = Math.max(totalSeconds, 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export default function ContestFloatingTimer({ deadline, onExpire, onEndContest, isEnding }) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(Math.floor((new Date(deadline).getTime() - Date.now()) / 1000), 0)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(
        Math.floor((new Date(deadline).getTime() - Date.now()) / 1000),
        0
      );
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  const isUrgent = secondsLeft <= 60;

  return (
    <div className={isUrgent ? "contest-float-timer contest-float-urgent" : "contest-float-timer"}>
      <span className="contest-float-time">⏱ {formatDuration(secondsLeft)}</span>
      <button
        type="button"
        className="contest-float-end-btn"
        onClick={onEndContest}
        disabled={isEnding}
      >
        {isEnding ? "Ending..." : "End Contest"}
      </button>
    </div>
  );
}