import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestEmail,
} from "../api/notificationApi";
import "./Certificates.css";

export default function NotificationSettings() {
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }
    async function load() {
      try {
        const response = await getNotificationPreferences();
        setEnabled(response.data.emailEnabled);
      } catch (err) {
        setError("Could not load your settings.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [isLoggedIn]);

  const handleToggle = async (value) => {
    setError("");
    setMessage("");
    setEnabled(value);
    try {
      await updateNotificationPreferences(value);
      setMessage(value ? "Reminders turned on." : "Reminders turned off.");
    } catch (err) {
      setEnabled(!value);
      setError("Could not save your setting.");
    }
  };

  const handleTest = async () => {
    setError("");
    setMessage("");
    setIsSending(true);
    try {
      const response = await sendTestEmail();
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Could not send the test email.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="certp-page certp-center">
        <p>Please sign in to manage email settings.</p>
        <Link to="/auth" className="btn btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="certp-page" style={{ maxWidth: 640 }}>
      <h1 className="certp-h1">✉️ Email settings</h1>
      <p className="certp-muted">
        Choose which emails you receive from ExtraTech Solution.
      </p>

      {isLoading ? (
        <p className="certp-muted">Loading...</p>
      ) : (
        <div className="certp-card">
          <label className="certp-toggle">
            <input type="checkbox" checked={enabled} onChange={(e) => handleToggle(e.target.checked)} />
            <span>
              <strong>Reminders &amp; nudges</strong>
              <br />
              <span className="certp-muted">
                Bootcamp session reminders (24 hours before) and a weekly nudge to continue your courses.
              </span>
            </span>
          </label>

          <p className="certp-muted" style={{ marginTop: "1rem" }}>
            Important emails — certificates, enrollment confirmations, payment receipts and password resets — are
            always sent.
          </p>

          <div className="certp-actions certp-actions-left">
            <button type="button" className="btn btn-secondary" onClick={handleTest} disabled={isSending}>
              {isSending ? "Sending..." : "Send me a test email"}
            </button>
          </div>

          {message && <p className="certp-good">{message}</p>}
          {error && <p className="certp-error">{error}</p>}
        </div>
      )}
    </div>
  );
}