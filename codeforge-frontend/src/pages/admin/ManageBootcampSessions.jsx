import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getBootcampById,
  getBootcampSessions,
  createBootcampSession,
  updateBootcampSession,
  deleteBootcampSession,
  getSessionAttendance,
  saveSessionAttendance,
} from "../../api/bootcampApi";
import { formatDate } from "../../utils/dateUtils";
import "../Bootcamps.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  sessionDate: "",
  startTime: "18:00",
  endTime: "19:00",
  location: "",
  meetingLink: "",
};

const timeText = (t) => (t ? String(t).slice(0, 5) : "");

export default function ManageBootcampSessions() {
  const { bootcampId } = useParams();

  const [bootcamp, setBootcamp] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [attendanceSession, setAttendanceSession] = useState(null);
  const [rows, setRows] = useState([]);
  const [present, setPresent] = useState(new Set());
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [bootcampRes, sessionRes] = await Promise.all([
        getBootcampById(bootcampId),
        getBootcampSessions(bootcampId),
      ]);
      setBootcamp(bootcampRes.data);
      setSessions(sessionRes.data.sessions);
    } catch (err) {
      setPageError("Failed to load this bootcamp's sessions.");
    } finally {
      setIsLoading(false);
    }
  }, [bootcampId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      description: s.description || "",
      sessionDate: s.sessionDate,
      startTime: timeText(s.startTime),
      endTime: timeText(s.endTime),
      location: s.location || "",
      meetingLink: s.meetingLink || "",
    });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleSave = async () => {
    setFormError("");
    setIsSaving(true);
    try {
      if (editingId) {
        await updateBootcampSession(editingId, form);
      } else {
        await createBootcampSession(bootcampId, form);
      }
      resetForm();
      await loadAll();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save the session.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete "${s.title}"? Its attendance records will be removed too.`)) return;
    try {
      await deleteBootcampSession(s.id);
      if (attendanceSession?.id === s.id) setAttendanceSession(null);
      await loadAll();
    } catch (err) {
      setPageError("Failed to delete the session.");
    }
  };

  const openAttendance = async (s) => {
    setAttendanceSession(s);
    setAttendanceMessage("");
    try {
      const response = await getSessionAttendance(s.id);
      setRows(response.data);
      setPresent(new Set(response.data.filter((r) => r.present).map((r) => r.userId)));
    } catch (err) {
      setRows([]);
      setAttendanceMessage("Could not load attendance.");
    }
  };

  const togglePresent = (userId) => {
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    setIsSavingAttendance(true);
    setAttendanceMessage("");
    try {
      const response = await saveSessionAttendance(attendanceSession.id, [...present]);
      setRows(response.data);
      setAttendanceMessage(`Saved — ${present.size} of ${response.data.length} present.`);
    } catch (err) {
      setAttendanceMessage(err.response?.data?.error || "Failed to save attendance.");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bc-page">
        <p className="bc-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bc-page">
      <div className="bc-header">
        <div>
          <h1>Sessions{bootcamp ? ` — ${bootcamp.title}` : ""}</h1>
          {bootcamp && (
            <p className="bc-subtitle">
              Runs {formatDate(bootcamp.startDate)} → {formatDate(bootcamp.endDate)} ·{" "}
              {bootcamp.enrolledCount} students enrolled
            </p>
          )}
        </div>
        <Link to="/admin/bootcamps" className="btn btn-secondary">
          Back to Bootcamps
        </Link>
      </div>

      {pageError && <p className="bc-error">{pageError}</p>}

      <div className="bc-form-panel">
        <h2>{editingId ? "Edit session" : "Add a session"}</h2>

        <label>Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="e.g. Day 1 — Design Thinking & Figma basics"
        />

        <div className="bc-form-row">
          <div>
            <label>Date</label>
            <input
              type="date"
              value={form.sessionDate}
              min={bootcamp?.startDate}
              max={bootcamp?.endDate}
              onChange={(e) => updateField("sessionDate", e.target.value)}
            />
          </div>
          <div>
            <label>Start time</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => updateField("startTime", e.target.value)}
            />
          </div>
          <div>
            <label>End time</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => updateField("endTime", e.target.value)}
            />
          </div>
        </div>

        <label>Location (optional — for offline / hybrid)</label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => updateField("location", e.target.value)}
          placeholder="e.g. Seminar Hall 2, Nagpur"
        />

        <label>Meeting link (optional — Zoom / Meet / Teams)</label>
        <input
          type="text"
          value={form.meetingLink}
          onChange={(e) => updateField("meetingLink", e.target.value)}
          placeholder="https://meet.google.com/..."
        />

        <label>Description (optional)</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Topics covered, things students should bring or prepare..."
        />

        {formError && <p className="bc-error">{formError}</p>}

        <div className="bc-actions">
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : editingId ? "Update session" : "Add session"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={isSaving}>
              Cancel edit
            </button>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="bc-muted">No sessions yet. Add the first one above.</p>
      ) : (
        <table className="bc-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Title</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{formatDate(s.sessionDate)}</td>
                <td>
                  {timeText(s.startTime)} – {timeText(s.endTime)}
                </td>
                <td>
                  {s.title}
                  {s.meetingLink && <span className="bc-muted"> · 🔗</span>}
                </td>
                <td>
                  <span
                    className={`bc-status bc-status-${
                      s.status === "UPCOMING" ? "upcoming" : s.status === "LIVE" ? "ongoing" : "completed"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="bc-row-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => openAttendance(s)}>
                    Attendance
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => startEdit(s)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => handleDelete(s)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {attendanceSession && (
        <div className="bc-form-panel bc-attendance-panel">
          <h2>
            Attendance — {attendanceSession.title}{" "}
            <span className="bc-muted">({formatDate(attendanceSession.sessionDate)})</span>
          </h2>

          {rows.length === 0 ? (
            <p className="bc-muted">No students are enrolled in this bootcamp yet.</p>
          ) : (
            <>
              <div className="bc-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPresent(new Set(rows.map((r) => r.userId)))}
                >
                  Mark all present
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setPresent(new Set())}>
                  Clear all
                </button>
                <span className="bc-muted">
                  {present.size} of {rows.length} present
                </span>
              </div>

              <div className="bc-attendance-grid">
                {rows.map((r) => (
                  <label key={r.userId} className="bc-check">
                    <input
                      type="checkbox"
                      checked={present.has(r.userId)}
                      onChange={() => togglePresent(r.userId)}
                    />
                    {r.username}
                  </label>
                ))}
              </div>
            </>
          )}

          {attendanceMessage && <p className="bc-muted">{attendanceMessage}</p>}

          <div className="bc-actions">
            {rows.length > 0 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAttendance}
                disabled={isSavingAttendance}
              >
                {isSavingAttendance ? "Saving..." : "Save attendance"}
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => setAttendanceSession(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}