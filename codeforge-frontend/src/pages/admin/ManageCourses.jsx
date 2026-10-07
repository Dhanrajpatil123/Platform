import { useState, useEffect } from "react";
import { getAllCourses, getCourseById } from "../../api/courseApi";
import { getAllProblems } from "../../api/problemApi";
import {
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../api/adminCourseApi";
import "./ManageCourses.css";

const emptyForm = {
  title: "",
  difficulty: "EASY",
  category: "",
  description: "",
  estimatedHours: "",
  syllabus: [], // [{ problemId, title, difficulty }]
};

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [allProblems, setAllProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadCourses = async () => {
    try {
      const response = await getAllCourses();
      setCourses(response.data);
    } catch (err) {
      // leave list empty on failure
    }
  };

  const loadProblems = async () => {
    try {
      const response = await getAllProblems();
      setAllProblems(response.data);
    } catch (err) {
      // leave list empty on failure
    }
  };

  useEffect(() => {
    async function loadAll() {
      setIsLoading(true);
      await Promise.all([loadCourses(), loadProblems()]);
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

  const openEditForm = async (courseSummary) => {
    setFormError("");
    try {
      const response = await getCourseById(courseSummary.id);
      const detail = response.data;

      setEditingId(detail.id);
      setFormData({
        title: detail.title,
        difficulty: detail.difficulty,
        category: detail.category,
        description: detail.description,
        estimatedHours: String(detail.estimatedHours),
        syllabus: detail.syllabus.map((item) => ({
          problemId: item.problemId,
          title: item.problemTitle,
          difficulty: item.problemDifficulty,
        })),
      });
      setSelectedProblemId("");
      setIsFormOpen(true);
    } catch (err) {
      alert("Failed to load course details for editing.");
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const problemsNotInSyllabus = allProblems.filter(
    (p) => !formData.syllabus.some((s) => s.problemId === p.id)
  );

  const addProblemToSyllabus = () => {
    if (!selectedProblemId) return;
    const problem = allProblems.find((p) => p.id === Number(selectedProblemId));
    if (!problem) return;

    setFormData({
      ...formData,
      syllabus: [
        ...formData.syllabus,
        { problemId: problem.id, title: problem.title, difficulty: problem.difficulty },
      ],
    });
    setSelectedProblemId("");
  };

  const removeFromSyllabus = (index) => {
    setFormData({
      ...formData,
      syllabus: formData.syllabus.filter((_, i) => i !== index),
    });
  };

  const moveSyllabusItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formData.syllabus.length) return;

    const updated = [...formData.syllabus];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFormData({ ...formData, syllabus: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (formData.syllabus.length === 0) {
      setFormError("Add at least one problem to the syllabus.");
      return;
    }

    setIsSaving(true);

    const payload = {
      title: formData.title,
      difficulty: formData.difficulty,
      category: formData.category,
      description: formData.description,
      estimatedHours: Number(formData.estimatedHours),
      problemIds: formData.syllabus.map((s) => s.problemId),
    };

    try {
      if (editingId) {
        await updateCourse(editingId, payload);
      } else {
        await createCourse(payload);
      }
      setIsFormOpen(false);
      loadCourses();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save course.");
    } finally {
      setIsSaving(false);
    }
  };

  // const handleDelete = async (id) => {
  //   if (!window.confirm("Delete this course? This cannot be undone.")) {
  //     return;
  //   }
  //   try {
  //     await deleteCourse(id);
  //     loadCourses();
  //   } catch (err) {
  //     alert(err.response?.data?.error || "Failed to delete course.");
  //   }
  // };

  const handleDelete = async (id) => {
  if (
    !window.confirm(
      "Delete this course?\n\nStudents enrolled in it will be unenrolled. Their submissions are not affected. This cannot be undone."
    )
  ) {
    return;
  }
  try {
    await deleteCourse(id);
    loadCourses();
  } catch (err) {
    alert(err.response?.data?.error || "Failed to delete course.");
  }
};

  return (
    <div className="manage-page">
      <div className="manage-header">
        <h1>Manage Courses</h1>
        <button type="button" className="btn btn-primary" onClick={openCreateForm}>
          + New Course
        </button>
      </div>

      {isLoading && <p className="placeholder-text">Loading courses...</p>}

      {!isLoading && (
        <table className="manage-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Problems</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.title}</td>
                <td>{course.category}</td>
                <td>
                  <span
                    className={`difficulty-badge difficulty-${course.difficulty.toLowerCase()}`}
                  >
                    {course.difficulty}
                  </span>
                </td>
                <td>{course.problemCount}</td>
                <td className="manage-row-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openEditForm(course)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(course.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {courses.length === 0 && (
              <tr>
                <td colSpan={5} className="manage-empty">
                  No courses yet. Click "New Course" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isFormOpen && (
        <div className="manage-modal-overlay" onClick={closeForm}>
          <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit Course" : "New Course"}</h2>

            {formError && <p className="manage-form-error">{formError}</p>}

            <form onSubmit={handleSubmit} className="manage-form">
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                required
              />

              <div className="manage-form-row">
                <div>
                  <label>Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      handleFieldChange("difficulty", e.target.value)
                    }
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div>
                  <label>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      handleFieldChange("category", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <label>Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                required
              />

              <label>Estimated Hours</label>
              <input
                type="number"
                min="1"
                value={formData.estimatedHours}
                onChange={(e) =>
                  handleFieldChange("estimatedHours", e.target.value)
                }
                required
              />

              <label>Syllabus</label>

              {formData.syllabus.length === 0 && (
                <p className="syllabus-builder-empty">
                  No problems added yet.
                </p>
              )}

              {formData.syllabus.map((item, idx) => (
                <div key={item.problemId} className="syllabus-builder-row">
                  <span className="syllabus-builder-order">{idx + 1}</span>
                  <span className="syllabus-builder-title">{item.title}</span>
                  <span
                    className={`difficulty-badge difficulty-${item.difficulty.toLowerCase()}`}
                  >
                    {item.difficulty}
                  </span>
                  <div className="syllabus-builder-controls">
                    <button
                      type="button"
                      onClick={() => moveSyllabusItem(idx, -1)}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSyllabusItem(idx, 1)}
                      disabled={idx === formData.syllabus.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="manage-remove-btn"
                      onClick={() => removeFromSyllabus(idx)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              <div className="syllabus-picker-row">
                <select
                  value={selectedProblemId}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                >
                  <option value="">Select a problem to add...</option>
                  {problemsNotInSyllabus.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.difficulty})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addProblemToSyllabus}
                  disabled={!selectedProblemId}
                >
                  Add
                </button>
              </div>

              <div className="manage-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}