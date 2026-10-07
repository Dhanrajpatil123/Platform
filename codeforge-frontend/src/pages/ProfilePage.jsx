import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProfileStats, getMyProfile, updateMyProfile } from "../api/profileApi";
import { getPremiumStatus } from "../api/premiumApi";
import ContributionHeatmap from "../components/ContributionHeatmap";
import DifficultyRing from "../components/DifficultyRing";
import "./ProfilePage.css";

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
}

const DIFFICULTY_LABELS = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

export default function ProfilePage() {
  const [username, setUsername] = useState(localStorage.getItem("username") || "you");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    preferredLanguage: "Java",
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [premium, setPremium] = useState(null);
  const [isLoadingPremium, setIsLoadingPremium] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await getMyProfile();
        setFormData({
          username: response.data.username || "",
          email: response.data.email || "",
          bio: response.data.bio || "",
          preferredLanguage: response.data.preferredLanguage || "Java",
        });
      } catch (err) {
        setSaveError("Failed to load your profile.");
      } finally {
        setIsLoadingProfile(false);
      }
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await getProfileStats();
        setStats(response.data);
      } catch (err) {
        setStats(null);
      } finally {
        setIsLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchPremium() {
      try {
        const response = await getPremiumStatus();
        setPremium(response.data);
      } catch (err) {
        setPremium(null);
      } finally {
        setIsLoadingPremium(false);
      }
    }
    fetchPremium();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
    setSaveError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");
    setIsSaving(true);
    try {
      const response = await updateMyProfile(formData);
      // The backend may have issued a fresh token (if the username changed) —
      // always sync localStorage from the response rather than assuming the
      // old token/username are still valid.
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("email", response.data.email);
      setUsername(response.data.username);
      setSaved(true);
    } catch (err) {
      setSaveError(err.response?.data?.error || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Profile & Account Settings</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="profile-stats-layout">
        <div className="profile-stats-side">
          <div className="profile-avatar">{username.charAt(0).toUpperCase()}</div>
          <h2 className="profile-username">{username}</h2>

          {!isLoadingStats && stats && (
            <p className="profile-rank">
              {stats.rank
                ? `Rank ${stats.rank.toLocaleString()} of ${stats.totalUsersRanked.toLocaleString()}`
                : "Unranked — solve a problem to get ranked"}
            </p>
          )}

          <a href="#profile-edit-section" className="btn btn-secondary profile-edit-jump">
            Edit Profile
          </a>

          {!isLoadingStats && stats && stats.languages.length > 0 && (
            <div className="profile-languages">
              <h3>Languages</h3>
              {stats.languages.map((lang) => (
                <div key={lang.language} className="profile-language-row">
                  <span className="lang-chip">{lang.language}</span>
                  <span className="lang-count">
                    {lang.problemsSolved} problem{lang.problemsSolved === 1 ? "" : "s"} solved
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="profile-stats-main">
          {isLoadingStats && <p className="placeholder-text">Loading stats...</p>}

          {!isLoadingStats && stats && (
            <>
              <div className="profile-top-row">
                <div className="profile-summary-card">
                  <div className="profile-summary-inner">
                    <DifficultyRing
                      difficultyBreakdown={stats.difficultyBreakdown}
                      totalSolved={stats.totalSolved}
                      totalProblems={stats.totalProblems}
                    />
                    <div className="difficulty-stat-boxes">
                      {stats.difficultyBreakdown.map((d) => (
                        <div
                          key={d.difficulty}
                          className={`difficulty-stat-box difficulty-stat-${d.difficulty.toLowerCase()}`}
                        >
                          <span className="difficulty-stat-label">
                            {DIFFICULTY_LABELS[d.difficulty] || d.difficulty}
                          </span>
                          <span className="difficulty-stat-count">
                            {d.solved}/{d.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="profile-premium-card">
                  <h3>Premium Status</h3>
                  {isLoadingPremium && <p className="placeholder-text">Loading...</p>}
                  {!isLoadingPremium && premium && premium.premium && (
                    <div className="profile-premium-active">
                      <span className="premium-badge">PRO</span>
                      <p>
                        {premium.premiumUntil
                          ? `Valid until ${new Date(premium.premiumUntil).toLocaleDateString()}`
                          : "Full access"}
                      </p>
                    </div>
                  )}
                  {!isLoadingPremium && premium && !premium.premium && (
                    <div className="profile-premium-inactive">
                      <p>You're on the free plan.</p>
                      <Link to="/premium" className="btn btn-primary">
                        Upgrade to Premium
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="profile-heatmap-card">
                <div className="profile-heatmap-header">
                  <span>
                    <strong>{stats.submissionsInPastYear}</strong> submissions in
                    the past year
                  </span>
                  <span className="profile-heatmap-meta">
                    Active days: {stats.totalActiveDays} · Max streak:{" "}
                    {stats.maxStreak}
                  </span>
                </div>
                <ContributionHeatmap heatmap={stats.heatmap} />
              </div>

              <div className="profile-recent-card">
                <h3>Recent Accepted</h3>
                {stats.recentAccepted.length === 0 && (
                  <p className="placeholder-text">
                    No accepted submissions yet — solve a problem to see it here.
                  </p>
                )}
                {stats.recentAccepted.map((sub) => (
                  <div key={sub.id} className="profile-recent-row">
                    <Link to={`/problems/${sub.problemId}`} className="problem-link">
                      {sub.problemTitle}
                    </Link>
                    <span className="profile-recent-time">
                      {timeAgo(sub.submittedAt)}
                    </span>
                  </div>
                ))}
              </div>


              <div className="profile-badges-card">
                <h3>Achievements</h3>
                <div className="profile-badges-grid">
                  {stats.badges.map((badge) => (
                    <div
                      key={badge.name}
                      className={badge.earned ? "profile-badge earned" : "profile-badge"}
                      title={badge.description}
                    >
                      <span className="profile-badge-icon">{badge.icon}</span>
                      <span className="profile-badge-name">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </div>
 

            </>
          )}
        </div>
      </div>

      <div className="profile-edit-section" id="profile-edit-section">
        <h2 className="profile-edit-heading">Edit Profile</h2>

        {isLoadingProfile ? (
          <p className="placeholder-text">Loading your details...</p>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            {saveError && <p className="profile-error">{saveError}</p>}

            <div className="profile-section">
              <h3>Identity</h3>

              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
              />

              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <div className="profile-section">
              <h3>Coding Preferences</h3>

              <label htmlFor="preferredLanguage">Preferred Language</label>
              <select
                id="preferredLanguage"
                name="preferredLanguage"
                value={formData.preferredLanguage}
                onChange={handleChange}
              >
                <option value="Java">Java</option>
                <option value="Python">Python</option>
                <option value="C++">C++</option>
                <option value="JavaScript">JavaScript</option>
              </select>
            </div>

            <div className="profile-actions">
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              {saved && <span className="profile-saved-msg">Saved!</span>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}