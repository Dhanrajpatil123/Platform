import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getPremiumStatus } from "../api/premiumApi";
import AnnouncementBanner from "./AnnouncementBanner";
import Navbar from "./Navbar";
import "../styles/responsive.css";

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

  // One stable tree: <main> must stay the 3rd child so the page never remounts
  // when contest lockdown toggles.
  return (
    <div className="app-shell">
      {!isContestLockdown && <AnnouncementBanner />}

      <Navbar
        locked={isContestLockdown}
        isLoggedIn={isLoggedIn}
        username={username}
        role={role}
        isPremium={isPremium}
        onLogout={handleLogout}
      />

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}