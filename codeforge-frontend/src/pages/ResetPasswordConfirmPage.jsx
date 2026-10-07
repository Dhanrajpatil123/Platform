import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import "./PasswordResetPage.css";

export default function ResetPasswordConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h1 className="reset-brand">CodeForge</h1>

        {success ? (
          <div className="reset-confirmation">
            <h2 className="reset-title">Password reset!</h2>
            <p className="reset-subtext">
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <>
            <h2 className="reset-title">Set a new password</h2>

            {error && <p className="reset-error">{error}</p>}

            <form className="reset-form" onSubmit={handleSubmit}>
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <button
                type="submit"
                className="btn btn-primary reset-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        <Link to="/auth" className="reset-back-link">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}