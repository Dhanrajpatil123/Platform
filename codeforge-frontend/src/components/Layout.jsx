import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { getPremiumStatus } from "../api/premiumApi";
import AnnouncementBanner from "./AnnouncementBanner";
import SearchBar from "./SearchBar";
import Logo from "./Logo";

export default function Layout() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const isLoggedIn = Boolean(token);

  const [isPremium, setIsPremium] = useState(false);
  const [isContestLockdown, setIsContestLockdown] = useState(false);

  useEffect(() => {
    const handleLockdown = (e) => setIsContestLockdown(Boolean(e.detail?.active));
    window.addEventListener("contest-lockdown", handleLockdown);
    return () => window.removeEventListener("contest-lockdown", handleLockdown);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsPremium(false);
      return undefined;
    }
    let cancelled = false;
    const loadStatus = async () => {
      try {
        const response = await getPremiumStatus();
        if (!cancelled) setIsPremium(response.data.premium);
      } catch (err) {
        if (!cancelled) setIsPremium(false);
      }
    };
    loadStatus();
    window.addEventListener("premium-changed", loadStatus);
    return () => {
      cancelled = true;
      window.removeEventListener("premium-changed", loadStatus);
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    navigate("/auth");
  };

  // IMPORTANT: one single tree. <main> must always be the 3rd child of
  // app-shell, otherwise React remounts the whole page whenever lockdown
  // toggles (which caused the endless reload loop during contests).
  return (
    <div className="app-shell">
      {!isContestLockdown && <AnnouncementBanner />}

      <header className="navbar">
        {isContestLockdown ? (
          <>
            <span className="navbar-brand">
              <Logo size={30} />
            </span>
            <span className="navbar-lockdown-note">
              Contest in progress — use "End Contest" to leave this screen
            </span>
          </>
        ) : (
          <>
            <Link to="/" className="navbar-brand">
              <Logo size={30} />
            </Link>

            <SearchBar />

            <nav className="navbar-links">
              <Link to="/problems">Problems</Link>
              <Link to="/courses">Courses</Link>
              <Link to="/contests">Contests</Link>
              <Link to="/playground">Playground</Link>
              <Link to="/leaderboard">Leaderboard</Link>
              <Link to="/premium">Premium</Link>
              
              <Link to="/bootcamps">Bootcamps</Link>


              {isLoggedIn ? (
                <>
                  <Link to="/dashboard">Dashboard</Link>
                  <Link to="/profile">Profile</Link>
                  <Link to="/bookmarks">Bookmarks</Link>
                  <Link to="/certificates">Certificates</Link>
                  
                  {role === "ADMIN" && (
                    <Link to="/admin" className="navbar-admin-link">
                      Admin
                    </Link>
                  )}
                  <span className="navbar-username">
                    Hi, {username}
                    {isPremium && role !== "ADMIN" && (
                      <span className="premium-badge">PRO</span>
                    )}
                  </span>
                  <button type="button" className="navbar-logout-btn" onClick={handleLogout}>
                    Log Out
                  </button>
                </>
              ) : (
                <Link to="/auth" className="navbar-auth-link">
                  Sign In / Sign Up
                </Link>
              )}
            </nav>
          </>
        )}
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}