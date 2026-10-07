import { useState, useEffect } from "react";
import { getAllProblems } from "../../api/problemApi";
import {
  createProblem,
  updateProblem,
  deleteProblem,
  bulkImportProblems,
} from "../../api/adminProblemApi";
import {
  getTestCases,
  addTestCase,
  deleteTestCase,
} from "../../api/adminTestCaseApi";
import "./ManageProblems.css";

const emptyForm = {
  title: "",
  difficulty: "EASY",
  category: "",
  description: "",
  examples: [{ input: "", output: "" }],
  constraints: [""],
  tags: "",
  premium: false,
};

export default function ManageProblems() {
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [testCaseProblem, setTestCaseProblem] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [isLoadingTestCases, setIsLoadingTestCases] = useState(false);
  const [newInput, setNewInput] = useState("");
  const [newExpectedOutput, setNewExpectedOutput] = useState("");
  const [testCaseError, setTestCaseError] = useState("");
  const [isAddingTestCase, setIsAddingTestCase] = useState(false);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState("");

  const loadProblems = async () => {
    setIsLoading(true);
    try {
      const response = await getAllProblems();
      setProblems(response.data);
    } catch (err) {
      // leave list empty on failure
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (problem) => {
    setEditingId(problem.id);
    setFormData({
      title: problem.title,
      difficulty: problem.difficulty,
      category: problem.category,
      description: problem.description,
      examples:
        problem.examples.length > 0
          ? problem.examples
          : [{ input: "", output: "" }],
      constraints:
        problem.constraints && problem.constraints.length > 0
          ? problem.constraints
          : [""],
      tags: problem.tags && problem.tags.length > 0 ? problem.tags.join(", ") : "",
      premium: Boolean(problem.premium),
    });
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleExampleChange = (index, field, value) => {
    const updated = [...formData.examples];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, examples: updated });
  };

  const addExample = () => {
    setFormData({
      ...formData,
      examples: [...formData.examples, { input: "", output: "" }],
    });
  };

  const removeExample = (index) => {
    setFormData({
      ...formData,
      examples: formData.examples.filter((_, i) => i !== index),
    });
  };

  const handleConstraintChange = (index, value) => {
    const updated = [...formData.constraints];
    updated[index] = value;
    setFormData({ ...formData, constraints: updated });
  };

  const addConstraint = () => {
    setFormData({
      ...formData,
      constraints: [...formData.constraints, ""],
    });
  };

  const removeConstraint = (index) => {
    setFormData({
      ...formData,
      constraints: formData.constraints.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);

    const payload = {
      ...formData,
      constraints: formData.constraints.filter((c) => c.trim() !== ""),
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== ""),
    };

    try {
      if (editingId) {
        await updateProblem(editingId, payload);
      } else {
        await createProblem(payload);
      }
      setIsFormOpen(false);
      loadProblems();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save problem.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this problem?\n\nThis permanently deletes its test cases, ALL student submissions for it, and its discussion posts. Solved counts and leaderboard scores will drop accordingly. This cannot be undone."
      )
    ) {
      return;
    }
    try {
      await deleteProblem(id);
      loadProblems();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete problem.");
    }
  };

  const openTestCaseModal = async (problem) => {
    setTestCaseProblem(problem);
    setTestCaseError("");
    setNewInput("");
    setNewExpectedOutput("");
    setIsLoadingTestCases(true);
    try {
      const response = await getTestCases(problem.id);
      setTestCases(response.data);
    } catch (err) {
      setTestCases([]);
    } finally {
      setIsLoadingTestCases(false);
    }
  };

  const closeTestCaseModal = () => {
    setTestCaseProblem(null);
  };

  const handleAddTestCase = async (e) => {
    e.preventDefault();
    setTestCaseError("");
    setIsAddingTestCase(true);
    try {
      const response = await addTestCase(testCaseProblem.id, {
        input: newInput,
        expectedOutput: newExpectedOutput,
      });
      setTestCases([...testCases, response.data]);
      setNewInput("");
      setNewExpectedOutput("");
    } catch (err) {
      setTestCaseError(err.response?.data?.error || "Failed to add test case.");
    } finally {
      setIsAddingTestCase(false);
    }
  };

  const handleDeleteTestCase = async (testCaseId) => {
    if (!window.confirm("Delete this test case?")) return;
    try {
      await deleteTestCase(testCaseProblem.id, testCaseId);
      setTestCases(testCases.filter((tc) => tc.id !== testCaseId));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete test case.");
    }
  };

  const openImportModal = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError("");
    setIsImportOpen(true);
  };

  const closeImportModal = () => {
    setIsImportOpen(false);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImportError("");
    setIsImporting(true);
    try {
      const response = await bulkImportProblems(importFile);
      setImportResult(response.data);
      loadProblems();
    } catch (err) {
      setImportError(err.response?.data?.error || "Import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="manage-page">
      <div className="manage-header">
        <h1>Manage Problems</h1>
        <div className="manage-header-actions">
          <button type="button" className="btn btn-secondary" onClick={openImportModal}>
            ⬆ Bulk Import
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreateForm}>
            + New Problem
          </button>
        </div>
      </div>

      {isLoading && <p className="placeholder-text">Loading problems...</p>}

      {!isLoading && (
        <table className="manage-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Difficulty</th>
              <th>Premium</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr key={problem.id}>
                <td>{problem.title}</td>
                <td>{problem.category}</td>
                <td>
                  <span
                    className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}
                  >
                    {problem.difficulty}
                  </span>
                </td>
                <td>{problem.premium ? "★ Yes" : "—"}</td>
                <td className="manage-row-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openTestCaseModal(problem)}
                  >
                    Test Cases
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openEditForm(problem)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleDelete(problem.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {problems.length === 0 && (
              <tr>
                <td colSpan={5} className="manage-empty">
                  No problems yet. Click "New Problem" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {isFormOpen && (
        <div className="manage-modal-overlay" onClick={closeForm}>
          <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit Problem" : "New Problem"}</h2>

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
                    onChange={(e) => handleFieldChange("difficulty", e.target.value)}
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
                    onChange={(e) => handleFieldChange("category", e.target.value)}
                    required
                  />
                </div>
              </div>

              <label>Description</label>
              <textarea
                rows={5}
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                required
              />

              <label>Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Array, Hash Table, Two Pointers"
                value={formData.tags}
                onChange={(e) => handleFieldChange("tags", e.target.value)}
              />

              <label className="manage-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.premium}
                  onChange={(e) => handleFieldChange("premium", e.target.checked)}
                />
                Premium problem (requires an active subscription to open and submit)
              </label>

              <label>Examples</label>
              {formData.examples.map((ex, idx) => (
                <div key={idx} className="manage-example-row">
                  <input
                    type="text"
                    placeholder="Input"
                    value={ex.input}
                    onChange={(e) => handleExampleChange(idx, "input", e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Output"
                    value={ex.output}
                    onChange={(e) => handleExampleChange(idx, "output", e.target.value)}
                    required
                  />
                  {formData.examples.length > 1 && (
                    <button
                      type="button"
                      className="manage-remove-btn"
                      onClick={() => removeExample(idx)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="manage-add-link" onClick={addExample}>
                + Add example
              </button>

              <label>Constraints</label>
              {formData.constraints.map((constraint, idx) => (
                <div key={idx} className="manage-example-row">
                  <input
                    type="text"
                    placeholder="e.g. 2 <= nums.length <= 10^4"
                    value={constraint}
                    onChange={(e) => handleConstraintChange(idx, e.target.value)}
                  />
                  {formData.constraints.length > 1 && (
                    <button
                      type="button"
                      className="manage-remove-btn"
                      onClick={() => removeConstraint(idx)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="manage-add-link" onClick={addConstraint}>
                + Add constraint
              </button>

              <div className="manage-form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Problem"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {testCaseProblem && (
        <div className="manage-modal-overlay" onClick={closeTestCaseModal}>
          <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Test Cases — {testCaseProblem.title}</h2>
            <p className="testcase-modal-subtext">
              These are hidden from students and used to grade Submit. They are
              separate from the display examples on the problem's description tab.
            </p>

            {isLoadingTestCases && (
              <p className="placeholder-text">Loading test cases...</p>
            )}

            {!isLoadingTestCases && testCases.length === 0 && (
              <p className="testcase-empty-warning">
                ⚠ No test cases yet — students cannot Submit to this problem
                until at least one exists.
              </p>
            )}

            {!isLoadingTestCases &&
              testCases.map((tc) => (
                <div key={tc.id} className="testcase-row">
                  <div className="testcase-row-content">
                    <div>
                      <span className="testcase-label">Input:</span>
                      <pre className="testcase-pre">{tc.input}</pre>
                    </div>
                    <div>
                      <span className="testcase-label">Expected Output:</span>
                      <pre className="testcase-pre">{tc.expectedOutput}</pre>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="manage-remove-btn"
                    onClick={() => handleDeleteTestCase(tc.id)}
                    title="Delete this test case"
                  >
                    ×
                  </button>
                </div>
              ))}

            {testCaseError && <p className="manage-form-error">{testCaseError}</p>}

            <form onSubmit={handleAddTestCase} className="manage-form">
              <label>New Input</label>
              <textarea
                rows={3}
                className="testcase-textarea"
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                placeholder={"e.g.\n4\n2 7 11 15\n9"}
                required
              />

              <label>Expected Output</label>
              <textarea
                rows={2}
                className="testcase-textarea"
                value={newExpectedOutput}
                onChange={(e) => setNewExpectedOutput(e.target.value)}
                placeholder="e.g. 0 1"
                required
              />

              <div className="manage-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeTestCaseModal}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isAddingTestCase}
                >
                  {isAddingTestCase ? "Adding..." : "Add Test Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportOpen && (
        <div className="manage-modal-overlay" onClick={closeImportModal}>
          <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Bulk Import Problems</h2>

            <p className="testcase-modal-subtext">
              <strong>JSON</strong> (recommended): an array of problem objects
              with full fields, including examples, constraints, and tags.
              <br />
              <strong>CSV</strong>: columns <code>title, difficulty, category,
              description, tags, premium</code>. Tags are semicolon-separated
              (e.g. <code>Array;Hash Table</code>). Examples and constraints
              aren't supported via CSV — add those afterward via Edit.
            </p>

            {importError && <p className="manage-form-error">{importError}</p>}

            {!importResult && (
              <form onSubmit={handleImportSubmit} className="manage-form">
                <label>File (.json or .csv)</label>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={(e) => setImportFile(e.target.files[0] || null)}
                  required
                />

                <div className="manage-form-actions">
                  <button type="button" className="btn btn-secondary" onClick={closeImportModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isImporting || !importFile}
                  >
                    {isImporting ? "Importing..." : "Import"}
                  </button>
                </div>
              </form>
            )}

            {importResult && (
              <div>
                <div className="import-result-summary">
                  <span className="import-result-success">
                    ✓ {importResult.successCount} created
                  </span>
                  {importResult.failureCount > 0 && (
                    <span className="import-result-failure">
                      ✗ {importResult.failureCount} failed
                    </span>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <div className="import-result-errors">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="import-result-error-row">
                        Row {err.rowNumber}: {err.reason}
                      </div>
                    ))}
                  </div>
                )}

                <div className="manage-form-actions">
                  <button type="button" className="btn btn-primary" onClick={closeImportModal}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}