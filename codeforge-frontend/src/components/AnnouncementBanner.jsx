import { useState, useEffect } from "react";
import { getActiveAnnouncement } from "../api/announcementApi";
import "./AnnouncementBanner.css";

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await getActiveAnnouncement();
        setAnnouncement(response.data);

        // Dismissal is keyed by the announcement's own id+updatedAt, so
        // editing the message (even re-activating the same text) makes it
        // reappear even if the previous version was dismissed.
        const dismissKey = `announcement-dismissed-${response.data.id}-${response.data.updatedAt}`;
        if (sessionStorage.getItem(dismissKey)) {
          setIsDismissed(true);
        }
      } catch (err) {
        setAnnouncement(null);
      }
    }
    load();
  }, []);

  const handleDismiss = () => {
    if (announcement) {
      const dismissKey = `announcement-dismissed-${announcement.id}-${announcement.updatedAt}`;
      sessionStorage.setItem(dismissKey, "true");
    }
    setIsDismissed(true);
  };

  if (!announcement || isDismissed) return null;

  return (
    <div className="announcement-banner">
      <span className="announcement-text">📢 {announcement.message}</span>
      <button
        type="button"
        className="announcement-dismiss-btn"
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
      >
        ✕
      </button>
    </div>
  );
}