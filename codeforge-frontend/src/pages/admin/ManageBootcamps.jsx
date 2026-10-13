import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import {
  getAllBootcamps,
  getBootcampById,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
} from "../../api/bootcampApi";
import { formatDate } from "../../utils/dateUtils";
import "../Bootcamps.css";




const EMPTY_FORM = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  mode: "ONLINE",
  seats: 30,
  fee: 0, // ADD THIS LINE
  published: true,
  courseIds: [],
};


export default function ManageBootcamps() {
  const [bootcamps, setBootcamps] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [bootcampRes, courseRes] = await Promise.all([
        getAllBootcamps(),
        axiosClient.get("/courses"),
      ]);
      setBootcamps(bootcampRes.data);
      setCourses(courseRes.data);
    } catch (err) {
      setPageError("Failed to load bootcamps.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCourse = (courseId) => {
    setForm((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = async (id) => {
    setFormError("");
    try {
      const response = await getBootcampById(id);
      const b = response.data;
      setEditingId(id);
      // setForm({
      //   title: b.title,
      //   description: b.description,
      //   startDate: b.startDate,
      //   endDate: b.endDate,
      //   mode: b.mode,
      //   seats: b.seats,
      //   published: b.published,
      //   courseIds: b.courses.map((c) => c.id),
      // });

      
setForm({
  title: b.title,
  description: b.description,
  startDate: b.startDate,
  endDate: b.endDate,
  mode: b.mode,
  seats: b.seats,
  fee: b.fee ?? 0, // ADD THIS LINE
  published: b.published,
  courseIds: (b.courses || []).map((c) => c.id),
});

      setShowForm(true);
    } catch (err) {
      setPageError("Could not load that bootcamp for editing.");
    }
  };

  const handleSave = async () => {
    setFormError("");
    setIsSaving(true);
    // const payload = { ...form, seats: Number(form.seats) };

    
const payload = {
  ...form,
  seats: Number(form.seats),
  fee: Number(form.fee),
};

    try {
      if (editingId) {
        await updateBootcamp(editingId, payload);
      } else {
        await createBootcamp(payload);
      }
      setShowForm(false);
      setEditingId(null);
      await loadAll();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save the bootcamp.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (b) => {
    if (
      !window.confirm(
        `Delete "${b.title}"? This also removes its ${b.enrolledCount} enrollment(s).`
      )
    ) {
      return;
    }
    try {
      await deleteBootcamp(b.id);
      await loadAll();
    } catch (err) {
      setPageError("Failed to delete the bootcamp.");
    }
  };

  return (
    <div className="bc-page">
      <div className="bc-header">
        <div>
          <h1>Manage Bootcamps</h1>
          <p className="bc-subtitle">Create cohort programs and link existing courses to them.</p>
        </div>
        <div className="bc-actions">
          <Link to="/admin" className="btn btn-secondary">
            Back to Admin
          </Link>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + New Bootcamp
          </button>
        </div>
      </div>

      {pageError && <p className="bc-error">{pageError}</p>}

      {showForm && (
        <div className="bc-form-panel">
          <h2>{editingId ? "Edit bootcamp" : "New bootcamp"}</h2>

          <label>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="e.g. UI/UX Design Bootcamp"
          />

          <label>Description</label>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="What students will learn, schedule, prerequisites, tools used..."
          />

          <div className="bc-form-row">
            <div>
              <label>Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </div>
            <div>
              <label>End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </div>
            <div>
              <label>Mode</label>
              <select value={form.mode} onChange={(e) => updateField("mode", e.target.value)}>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div>
              <label>Seats</label>
              <input
                type="number"
                min={1}
                value={form.seats}
                onChange={(e) => updateField("seats", e.target.value)}
              />
            </div>
            <div>
            <label>Fee (₹) — 0 = free</label>
            <input
              type="number"
              min={0}
              value={form.fee}
              onChange={(e) => updateField("fee", e.target.value)}
            />
          </div>
          </div>

          <label>Linked courses</label>
          <div className="bc-course-picker">
            {courses.length === 0 && <p className="bc-muted">No courses exist yet.</p>}
            {courses.map((c) => (
              <label key={c.id} className="bc-check">
                <input
                  type="checkbox"
                  checked={form.courseIds.includes(c.id)}
                  onChange={() => toggleCourse(c.id)}
                />
                {c.title}
              </label>
            ))}
          </div>

          <label className="bc-check">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => updateField("published", e.target.checked)}
            />
            Published (visible to students)
          </label>

          {formError && <p className="bc-error">{formError}</p>}

          <div className="bc-actions">
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save bootcamp"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowForm(false)}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && <p className="bc-muted">Loading...</p>}

      {!isLoading && bootcamps.length === 0 && (
        <p className="bc-muted">No bootcamps yet. Create the first one.</p>
      )}

      {bootcamps.length > 0 && (
        <table className="bc-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Dates</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Seats</th>
              <th>Courses</th>
              <th>Fee</th>
              <th>Revenue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bootcamps.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link to={`/bootcamps/${b.id}`} className="bc-link">
                    {b.title}
                  </Link>
                  {!b.published && <span className="bc-draft">Draft</span>}
                </td>
                <td>
                  {formatDate(b.startDate)} → {formatDate(b.endDate)}
                </td>
                <td>{b.mode}</td>
                <td>
                  <span className={`bc-status bc-status-${b.status.toLowerCase()}`}>{b.status}</span>
                </td>
                <td>
                  {b.enrolledCount}/{b.seats}
                </td>
                <td>{b.courseCount}</td>

                <td>{b.fee > 0 ? `₹${b.fee.toLocaleString("en-IN")}` : "Free"}</td>
                <td>{b.revenue != null ? `₹${Number(b.revenue).toLocaleString("en-IN")}` : "—"}</td>

                <Link to={`/admin/bootcamps/${b.id}/sessions`} className="btn btn-secondary">
                  Sessions
                </Link>

                <td className="bc-row-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => openEdit(b.id)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => handleDelete(b)}>
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