import { useState, useEffect, useRef, useCallback } from "react";
import { recordContestWarning } from "../api/contestApi";

// Best-effort browser proctoring, not a true lockdown — see the note given
// alongside this feature. Requests fullscreen, watches for fullscreen exits
// and tab switches while isActive is true, and reports each as a warning.
export default function useContestLockdown({ contestId, isActive, onEnded }) {
  const [warningState, setWarningState] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const lastTriggerRef = useRef(0);

  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  const triggerViolation = useCallback(async () => {
    const now = Date.now();
    if (now - lastTriggerRef.current < 2000) return; // avoid double-counting
    lastTriggerRef.current = now;

    try {
      const response = await recordContestWarning(contestId);
      const attempt = response.data;
      setWarningState({ count: attempt.warningCount, limit: attempt.warningLimit });

      if (attempt.status === "ENDED") {
        setShowResumeModal(false);
        onEnded();
      } else {
        setShowResumeModal(true);
      }
    } catch (err) {
      // don't block the student if recording the warning itself fails
    }
  }, [contestId, onEnded]);

  useEffect(() => {
    if (!isActive) return undefined;

    window.dispatchEvent(new CustomEvent("contest-lockdown", { detail: { active: true } }));
    requestFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation();
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.dispatchEvent(new CustomEvent("contest-lockdown", { detail: { active: false } }));
    };
  }, [isActive, requestFullscreen, triggerViolation]);

  const resumeFullscreen = useCallback(() => {
    requestFullscreen();
    setShowResumeModal(false);
  }, [requestFullscreen]);

  return { warningState, showResumeModal, resumeFullscreen };
}