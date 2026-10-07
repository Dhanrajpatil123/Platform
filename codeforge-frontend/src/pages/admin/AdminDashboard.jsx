import { Link } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p className="admin-dashboard-subtext">
        Manage the platform's content from here.
      </p>

      <div className="admin-actions">
        <Link to="/admin/problems" className="admin-action-card">
          <h3>Manage Problems</h3>
          <p>Create, edit, and delete coding problems</p>
        </Link>

        <Link to="/admin/courses" className="admin-action-card">
          <h3>Manage Courses</h3>
          <p>Create, edit, and delete learning tracks</p>
        </Link>

        <Link to="/admin/contests" className="admin-action-card">
          <h3>Manage Contests</h3>
          <p>Schedule contests and assign problems to them</p>
        </Link>

        <Link to="/admin/users" className="admin-action-card">
          <h3>Manage Users</h3>
          <p>View all users, grant or revoke Premium, set academic year</p>
        </Link>

        <Link to="/admin/announcement" className="admin-action-card">
          <h3>Site Announcement</h3>
          <p>Set or clear the banner shown to everyone</p>
        </Link>

      </div>
    </div>
  );
}