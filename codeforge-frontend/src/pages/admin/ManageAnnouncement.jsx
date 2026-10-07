import { useState, useEffect } from "react";
import { getCurrentAnnouncementAdmin, updateAnnouncementAdmin } from "../../api/announcementApi";
import "./ManageProblems.css";

export default function ManageAnnouncement() {
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await getCurrentAnnouncementAdmin();
        if (response.status === 200) {
          setMessage(response.data.message);
          setActive(response.data.active);
        }
      } catch (err) {
        // no announcement set yet — leave the form blank
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await updateAnnouncementAdmin({ message, active });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save announcement.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="manage-page">
      <div className="manage-header">
        <h1>Site Announcement</h1>
      </div>

      <p className="testcase-modal-subtext">
        Shown as a dismissible banner at the top of every page, for every
        visitor. Only one announcement is active at a time — saving replaces
        whatever was there before.
      </p>

      {isLoading ? (
        <p className="placeholder-text">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="manage-form">
          {error && <p className="manage-form-error">{error}</p>}
          {saved && <p className="import-result-success">Saved!</p>}

          <label>Message</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setSaved(false);
            }}
            placeholder="e.g. Weekly Contest 12 starts in 1 hour — register now!"
            required
          />

          <label className="manage-checkbox-label">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => {
                setActive(e.target.checked);
                setSaved(false);
              }}
            />
            Show this announcement site-wide
          </label>

          <div className="manage-form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Announcement"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}