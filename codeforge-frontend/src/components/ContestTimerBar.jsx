import { useState, useEffect } from "react";
import "./ContestTimerBar.css";

function formatDuration(totalSeconds) {
  const s = Math.max(totalSeconds, 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

// deadline: an ISO string from the server. onExpire fires exactly once, when
// the client-side countdown reaches zero — the server independently
// finalizes the attempt on its own next check regardless of this callback.
export default function ContestTimerBar({ deadline, onExpire }) {
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
    <div className={isUrgent ? "contest-timer-bar contest-timer-urgent" : "contest-timer-bar"}>
      ⏱ Time remaining: <strong>{formatDuration(secondsLeft)}</strong>
    </div>
  );
}