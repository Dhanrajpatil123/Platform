import { useState, useEffect } from "react";
import {
  getAllUsersAdmin,
  getUserDetailAdmin,
  grantPremiumAdmin,
  revokePremiumAdmin,
  updateUserYearAdmin,
} from "../../api/adminUserApi";
import "./ManageProblems.css";
import "./ManageUsers.css";

const YEAR_LABELS = {
  FIRST_YEAR: "1st Year",
  SECOND_YEAR: "2nd Year",
  THIRD_YEAR: "3rd Year",
  FOURTH_YEAR: "4th Year",
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [actionError, setActionError] = useState("");
  const [grantDays, setGrantDays] = useState("30");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [pendingYear, setPendingYear] = useState("");

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await getAllUsersAdmin();
      setUsers(response.data);
    } catch (err) {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openDetail = async (userId) => {
    setSelectedUserId(userId);
    setActionError("");
    setIsLoadingDetail(true);
    try {
      const response = await getUserDetailAdmin(userId);
      setDetail(response.data);
      setPendingYear(response.data.year || "");
    } catch (err) {
      setActionError("Failed to load user details.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedUserId(null);
    setDetail(null);
  };

  const refreshDetailAndList = async () => {
    await loadUsers();
    if (selectedUserId) {
      const response = await getUserDetailAdmin(selectedUserId);
      setDetail(response.data);
    }
  };

  const handleGrant = async () => {
    setActionError("");
    setIsSubmittingAction(true);
    try {
      await grantPremiumAdmin(selectedUserId, Number(grantDays));
      await refreshDetailAndList();
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to grant premium.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm("Revoke this user's Premium access?")) return;
    setActionError("");
    setIsSubmittingAction(true);
    try {
      await revokePremiumAdmin(selectedUserId);
      await refreshDetailAndList();
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to revoke premium.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSaveYear = async () => {
    setActionError("");
    setIsSubmittingAction(true);
    try {
      await updateUserYearAdmin(selectedUserId, pendingYear || null);
      await refreshDetailAndList();
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to update year.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesYear = yearFilter === "All" || u.year === yearFilter;
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesYear && matchesSearch;
  });

  return (
    <div className="manage-page">
      <div className="manage-header">
        <h1>Manage Users</h1>
      </div>

      <div className="users-filters">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="All">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="All">All Years</option>
          {Object.entries(YEAR_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="placeholder-text">Loading users...</p>}

      {!isLoading && (
        <table className="manage-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Year</th>
              <th>Premium</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.year ? YEAR_LABELS[u.year] : "—"}</td>
                <td>
                  {u.premiumActive ? (
                    <span className="premium-chip">★ Premium</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="manage-row-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openDetail(u.id)}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="manage-empty">
                  No users match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {selectedUserId && (
        <div className="manage-modal-overlay" onClick={closeDetail}>
          <div className="manage-modal user-detail-modal" onClick={(e) => e.stopPropagation()}>
            {isLoadingDetail && <p className="placeholder-text">Loading...</p>}

            {!isLoadingDetail && detail && (
              <>
                <h2>{detail.username}</h2>
                <p className="user-detail-email">{detail.email}</p>

                {actionError && <p className="manage-form-error">{actionError}</p>}

                <div className="user-detail-section">
                  <h3>Academic Year</h3>
                  <div className="user-detail-row">
                    <select value={pendingYear} onChange={(e) => setPendingYear(e.target.value)}>
                      <option value="">Not set</option>
                      {Object.entries(YEAR_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleSaveYear}
                      disabled={isSubmittingAction}
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div className="user-detail-section">
                  <h3>Premium Access</h3>
                  {detail.premiumActive ? (
                    <div className="user-detail-row">
                      <span className="premium-chip">★ Premium</span>
                      <span className="user-detail-meta">
                        {detail.premiumUntil
                          ? `Until ${new Date(detail.premiumUntil).toLocaleDateString()}`
                          : "Full access"}
                      </span>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={handleRevoke}
                        disabled={isSubmittingAction}
                      >
                        Revoke
                      </button>
                    </div>
                  ) : (
                    <div className="user-detail-row">
                      <span className="user-detail-meta">Not on Premium</span>
                    </div>
                  )}
                  <div className="user-detail-row user-detail-grant-row">
                    <input
                      type="number"
                      min="1"
                      value={grantDays}
                      onChange={(e) => setGrantDays(e.target.value)}
                    />
                    <span className="user-detail-meta">days</span>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleGrant}
                      disabled={isSubmittingAction}
                    >
                      Grant / Extend Premium
                    </button>
                  </div>
                  <p className="user-detail-hint">
                    Granting adds the days on top of any remaining Premium time.
                    This does not charge the user — use it for manual overrides.
                  </p>
                </div>

                <div className="user-detail-section">
                  <h3>Problems Solved: {detail.totalProblemsSolved}</h3>
                </div>

                <div className="user-detail-section">
                  <h3>Enrolled Courses</h3>
                  {detail.courses.length === 0 && (
                    <p className="placeholder-text">Not enrolled in any course.</p>
                  )}
                  {detail.courses.map((c) => (
                    <div key={c.courseId} className="user-detail-list-row">
                      <span>{c.courseTitle}</span>
                      <span className="user-detail-meta">{c.progressPercent}%</span>
                    </div>
                  ))}
                </div>

                <div className="user-detail-section">
                  <h3>Contest Participation</h3>
                  {detail.contests.length === 0 && (
                    <p className="placeholder-text">Not registered for any contest.</p>
                  )}
                  {detail.contests.map((c) => (
                    <div key={c.contestId} className="user-detail-list-row">
                      <span>{c.contestTitle}</span>
                      <span className="user-detail-meta">
                        {c.status.replace(/_/g, " ")} · {c.solvedCount}/{c.totalProblems}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="manage-form-actions">
                  <button type="button" className="btn btn-secondary" onClick={closeDetail}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}