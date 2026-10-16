import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { getAllTracks, getTrackById, createTrack, updateTrack, deleteTrack } from "../../api/trackApi";
import "../Bootcamps.css";
import "../Tracks.css";

const EMPTY_FORM = { title: "", description: "", published: true, courseIds: [] };

export default function ManageTracks() {
  const [tracks, setTracks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toAdd, setToAdd] = useState("");

  const load = useCallback(async () => {
    try {
      const [trackRes, courseRes] = await Promise.all([getAllTracks(), axiosClient.get("/courses")]);
      setTracks(trackRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      setPageError("Failed to load tracks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const courseTitle = (id) => courses.find((c) => c.id === id)?.title || `Course #${id}`;
  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addCourse = () => {
    const id = Number(toAdd);
    if (!id || form.courseIds.includes(id)) return;
    update("courseIds", [...form.courseIds, id]);
    setToAdd("");
  };

  const move = (index, delta) => {
    const next = [...form.courseIds];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update("courseIds", next);
  };

  const remove = (index) =>
    update("courseIds", form.courseIds.filter((_, i) => i !== index));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = async (id) => {
    setFormError("");
    try {
      const response = await getTrackById(id);
      const t = response.data;
      setEditingId(id);
      setForm({
        title: t.title,
        description: t.description,
        published: t.published,
        courseIds: t.courses.map((c) => c.id),
      });
      setShowForm(true);
    } catch (err) {
      setPageError("Could not load that track.");
    }
  };

  const handleSave = async () => {
    setFormError("");
    setIsSaving(true);
    try {
      if (editingId) await updateTrack(editingId, form);
      else await createTrack(form);
      setShowForm(false);
      setEditingId(null);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save the track.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete "${t.title}"? Enrollments are removed; issued certificates stay valid.`)) return;
    try {
      await deleteTrack(t.id);
      await load();
    } catch (err) {
      setPageError("Failed to delete the track.");
    }
  };

  return (
    <div className="bc-page">
      <div className="bc-header">
        <div>
          <h1>Manage Learning Tracks</h1>
          <p className="bc-subtitle">Bundle courses into an ordered path with one combined certificate.</p>
        </div>
        <div className="bc-actions">
          <Link to="/admin" className="btn btn-secondary">
            Back to Admin
          </Link>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + New Track
          </button>
        </div>
      </div>

      {pageError && <p className="bc-error">{pageError}</p>}

      {showForm && (
        <div className="bc-form-panel">
          <h2>{editingId ? "Edit track" : "New track"}</h2>

          <label>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Placement Preparation Track"
          />

          <label>Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Who is this for and what will they achieve?"
          />

          <label>Courses (in learning order)</label>
          <div className="trk-picker">
            {form.courseIds.length === 0 && <p className="bc-muted">No courses added yet.</p>}
            {form.courseIds.map((id, index) => (
              <div key={id} className="trk-picker-row">
                <span>
                  {index + 1}. {courseTitle(id)}
                </span>
                <span className="trk-picker-actions">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0}>
                    ↑
                  </button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === form.courseIds.length - 1}>
                    ↓
                  </button>
                  <button type="button" onClick={() => remove(index)}>
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>

          <div className="trk-add-row">
            <select value={toAdd} onChange={(e) => setToAdd(e.target.value)}>
              <option value="">Choose a course to add…</option>
              {courses
                .filter((c) => !form.courseIds.includes(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
            </select>
            <button type="button" className="btn btn-secondary" onClick={addCourse} disabled={!toAdd}>
              Add
            </button>
          </div>

          <label className="bc-check">
            <input type="checkbox" checked={form.published} onChange={(e) => update("published", e.target.checked)} />
            Published (visible to students)
          </label>

          {formError && <p className="bc-error">{formError}</p>}

          <div className="bc-actions">
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save track"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={isSaving}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="bc-muted">Loading...</p>}
      {!isLoading && tracks.length === 0 && <p className="bc-muted">No tracks yet. Create the first one.</p>}

      {tracks.length > 0 && (
        <table className="bc-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Courses</th>
              <th>Problems</th>
              <th>Learners</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link to={`/tracks/${t.id}`} className="bc-link">
                    {t.title}
                  </Link>
                </td>
                <td>{t.courseCount}</td>
                <td>{t.problemCount}</td>
                <td>{t.enrolledCount}</td>
                <td>{t.published ? "Published" : "Draft"}</td>
                <td className="bc-row-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => openEdit(t.id)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => handleDelete(t)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}