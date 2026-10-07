import { Link } from "react-router-dom";
import Logo from "./Logo";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Logo size={26} />
          <p>Practice. Compete. Grow — one problem at a time.</p>
        </div>

        <div className="footer-links-group">
          <div className="footer-links-col">
            <h4>Platform</h4>
            <Link to="/problems">Problems</Link>
            <Link to="/courses">Courses</Link>
            <Link to="/contests">Contests</Link>
            <Link to="/playground">Playground</Link>
          </div>
          <div className="footer-links-col">
            <h4>Community</h4>
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/premium">Premium</Link>
          </div>
          <div className="footer-links-col">
            <h4>Account</h4>
            <Link to="/auth">Sign In / Sign Up</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} ExtraTech Solution. All rights reserved.</span>
      </div>
    </footer>
  );
}