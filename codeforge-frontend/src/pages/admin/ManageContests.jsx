import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllContests, getContestById } from "../../api/contestApi";
import { getAllProblems } from "../../api/problemApi";
import {
  createContest,
  updateContest,
  deleteContest,
} from "../../api/adminContestApi";
import "../admin/ManageProblems.css";

const emptyForm = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  durationMinutes: "60",
  warningLimit: "3",
  problems: [],
};

function toDatetimeLocalValue(isoString) {
  if (!isoString) return "";
  return isoString.slice(0, 16);
}

export default function ManageContests() {
  const [contests, setContests] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadContests = async () => {
    try {
      const response = await getAllContests();
      setContests(response.data);
    } catch (err) {
      // leave empty on failure
    }
  };

  const loadProblems = async () => {
    try {
      const response = await getAllProblems();
      setAllProblems(response.data);
    } catch (err) {
      // leave empty on failure
    }
  };

  useEffect(() => {
    async function loadAll() {
      setIsLoading(true);
      await Promise.all([loadContests(), loadProblems()]);
      setIsLoading(false);
    }
    loadAll();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setSelectedProblemId("");
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = async (contestSummary) => {
    setFormError("");
    try {
      const detailResponse = await getContestById(contestSummary.id);
      const detail = detailResponse.data;

      setEditingId(detail.id);
      setFormData({
        title: detail.title,
        description: detail.description,
        startTime: toDatetimeLocalValue(detail.startTime),
        endTime: toDatetimeLocalValue(detail.endTime),
        durationMinutes: String(detail.durationMinutes),
        warningLimit: String(detail.warningLimit),
        problems: detail.problems.map((p) => ({
          id: p.id,
          title: p.title,
          difficulty: p.difficulty,
        })),
      });
      setSelectedProblemId("");
      setIsFormOpen(true);
    } catch (err) {
      alert("Failed to load contest details for editing.");
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const problemsNotAdded = allProblems.filter(
    (p) => !formData.problems.some((added) => added.id === p.id)
  );

  const addProblem = () => {
    if (!selectedProblemId) return;
    const problem = allProblems.find((p) => p.id === Number(selectedProblemId));
    if (!problem) return;

    setFormData({
      ...formData,
      problems: [
        ...formData.problems,
        { id: problem.id, title: problem.title, difficulty: problem.difficulty },
      ],
    });
    setSelectedProblemId("");
  };

  const removeProblem = (id) => {
    setFormData({
      ...formData,
      problems: formData.problems.filter((p) => p.id !== id),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);

    const payload = {
      title: formData.title,
      description: formData.description,
      startTime: formData.startTime,
      endTime: formData.endTime,
      durationMinutes: Number(formData.durationMinutes),
      warningLimit: Number(formData.warningLimit),
      problemIds: formData.problems.map((p) => p.id),
    };

    try {
      if (editingId) {
        await updateContest(editingId, payload);
      } else {
        await createContest(payload);
      }
      setIsFormOpen(false);
      loadContests();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save contest.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this contest?\n\nRegistrations will be removed and its problems will become regular (non-contest) problems. This cannot be undone."
      )
    ) {
      return;
    }
    try {
      await deleteContest(id);
      loadContests();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete contest.");
    }
  };

  return (
    <div className="manage-page">
      <div className="manage-header">
        <h1>Manage Contests</h1>
        <button type="button" className="btn btn-primary" onClick={openCreateForm}>
          + New Contest
        </button>
      </div>

      {isLoading && <p className="placeholder-text">Loading contests...</p>}

      {!isLoading && (
        <table className="manage-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Starts</th>
              <th>Duration</th>
              <th>Warnings</th>
              <th>Problems</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contests.map((c) => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td>{c.status}</td>
                <td>{new Date(c.startTime).toLocaleString()}</td>
                <td>{c.durationMinutes} min</td>
                <td>{c.warningLimit ?? "—"}</td>
                <td>{c.problemCount}</td>
                <td className="manage-row-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openEditForm(c)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(c.id)}
                  >
                    Delete
                  </button>

                  <Link
                    to={`/admin/contests/${c.id}/report`}
                    className="btn btn-secondary"
                  >
                    Report
                  </Link>
                </td>
              </tr>
            ))}

            {contests.length === 0 && (
              <tr>
                <td colSpan={7} className="manage-empty">
                  No contests yet. Click "New Contest" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isFormOpen && (
        <div className="manage-modal-overlay" onClick={closeForm}>
          <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit Contest" : "New Contest"}</h2>

            {formError && <p className="manage-form-error">{formError}</p>}

            <form onSubmit={handleSubmit} className="manage-form">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                required
              />

              <label>Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                required
              />

              <div className="manage-form-row">
                <div>
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => handleFieldChange("startTime", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => handleFieldChange("endTime", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="manage-form-row">
                <div>
                  <label>Duration per student (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationMinutes}
                    onChange={(e) => handleFieldChange("durationMinutes", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Warning limit before auto-end</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.warningLimit}
                    onChange={(e) => handleFieldChange("warningLimit", e.target.value)}
                    required
                  />
                </div>
              </div>

              <label>Problems</label>

              {formData.problems.length === 0 && (
                <p className="testcase-modal-subtext">No problems added yet.</p>
              )}

              {formData.problems.map((p) => (
                <div key={p.id} className="syllabus-builder-row">
                  <span className="syllabus-builder-title">{p.title}</span>
                  <span className={`difficulty-badge difficulty-${p.difficulty.toLowerCase()}`}>
                    {p.difficulty}
                  </span>
                  <button
                    type="button"
                    className="manage-remove-btn"
                    onClick={() => removeProblem(p.id)}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className="syllabus-picker-row">
                <select
                  value={selectedProblemId}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                >
                  <option value="">Select a problem to add...</option>
                  {problemsNotAdded.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.difficulty})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addProblem}
                  disabled={!selectedProblemId}
                >
                  Add
                </button>
              </div>

              <div className="manage-form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Contest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}