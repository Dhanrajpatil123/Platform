import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import "./Navbar.css";

const PRIMARY = [
  { to: "/problems", label: "Problems" },
  { to: "/courses", label: "Courses" },
  { to: "/tracks", label: "Tracks" },
  { to: "/bootcamps", label: "Bootcamps" },
  { to: "/contests", label: "Contests" },
  { to: "/playground", label: "Playground" },
  { to: "/leaderboard", label: "Leaderboard" },
];

const ACCOUNT = [
  { to: "/learning", label: "My Learning", icon: "📚" },
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/profile", label: "Profile", icon: "👤" },
  { to: "/bookmarks", label: "Bookmarks", icon: "🔖" },
  { to: "/certificates", label: "My Certificates", icon: "🎓" },
  { to: "/settings/notifications", label: "Email settings", icon: "✉️" },
];

const linkClass = ({ isActive }) => (isActive ? "etsnav-link active" : "etsnav-link");

export default function Navbar({ locked, isLoggedIn, username, role, isPremium, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const initial = (username || "?").charAt(0).toUpperCase();
  const showPro = isLoggedIn && !isPremium && role !== "ADMIN";

  if (locked) {
    return (
      <header className="etsnav">
        <div className="etsnav-inner">
          <span className="etsnav-brand">
            <Logo size={30} />
          </span>
          <span className="etsnav-lock-note">Contest in progress — use “End Contest” to leave this screen</span>
        </div>
      </header>
    );
  }

  return (
    <header className="etsnav">
      <div className="etsnav-inner">
        <Link to="/" className="etsnav-brand">
          <Logo size={30} />
        </Link>

        <nav className="etsnav-links etsnav-desktop">
          {PRIMARY.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="etsnav-right">
          <div className="etsnav-search etsnav-desktop">
            <SearchBar />
          </div>

          {showPro && (
            <Link to="/premium" className="etsnav-pro etsnav-desktop">
              ⭐ Go Pro
            </Link>
          )}

          {isLoggedIn ? (
            <div className="etsnav-user etsnav-desktop" ref={menuRef}>
              <button
                type="button"
                className="etsnav-user-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <span className="etsnav-avatar">{initial}</span>
                <span className="etsnav-username">{username}</span>
                {isPremium && role !== "ADMIN" && <span className="etsnav-badge">PRO</span>}
                {role === "ADMIN" && <span className="etsnav-badge etsnav-badge-admin">ADMIN</span>}
                <span className="etsnav-caret">▾</span>
              </button>

              {menuOpen && (
                <div className="etsnav-menu">
                  {ACCOUNT.map((a) => (
                    <Link key={a.to} to={a.to} className="etsnav-menu-item">
                      <span>{a.icon}</span> {a.label}
                    </Link>
                  ))}
                  {role === "ADMIN" && (
                    <Link to="/admin" className="etsnav-menu-item etsnav-menu-admin">
                      <span>🛠</span> Admin panel
                    </Link>
                  )}
                  {!isPremium && role !== "ADMIN" && (
                    <Link to="/premium" className="etsnav-menu-item">
                      <span>⭐</span> Upgrade to Premium
                    </Link>
                  )}
                  <div className="etsnav-menu-sep" />
                  <button type="button" className="etsnav-menu-item etsnav-menu-logout" onClick={onLogout}>
                    <span>⎋</span> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="etsnav-signin etsnav-desktop">
              Sign in
            </Link>
          )}

          <button
            type="button"
            className={mobileOpen ? "etsnav-burger open" : "etsnav-burger"}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="etsnav-mobile">
          <div className="etsnav-mobile-search">
            <SearchBar />
          </div>

          <div className="etsnav-mobile-section">Explore</div>
          {PRIMARY.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}

          {isLoggedIn ? (
            <>
              <div className="etsnav-mobile-section">
                Account — {username} {isPremium && role !== "ADMIN" ? "· PRO" : ""}
              </div>
              {ACCOUNT.map((a) => (
                <NavLink key={a.to} to={a.to} className={linkClass}>
                  {a.icon} {a.label}
                </NavLink>
              ))}
              {role === "ADMIN" && (
                <NavLink to="/admin" className={linkClass}>
                  🛠 Admin panel
                </NavLink>
              )}
              {!isPremium && role !== "ADMIN" && (
                <NavLink to="/premium" className={linkClass}>
                  ⭐ Upgrade to Premium
                </NavLink>
              )}
              <button type="button" className="etsnav-mobile-logout" onClick={onLogout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/auth" className="etsnav-mobile-logout etsnav-mobile-signin">
              Sign in / Sign up
            </Link>
          )}
        </div>
      )}
    </header>
  );
}