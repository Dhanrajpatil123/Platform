import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import "./PasswordResetPage.css";

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h1 className="reset-brand">ExtraTech Solution</h1>

        {!submitted ? (
          <>
            <h2 className="reset-title">Reset your password</h2>
            <p className="reset-subtext">
              Enter your registered email address and we'll send you a
              secure link to reset your password.
            </p>

            {error && <p className="reset-error">{error}</p>}

            <form className="reset-form" onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button
                type="submit"
                className="btn btn-primary reset-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="reset-confirmation">
            <h2 className="reset-title">Check your email</h2>
            <p className="reset-subtext">
              If an account exists for <strong>{email}</strong>, a password
              reset link has been sent.
            </p>
          </div>
        )}

        <Link to="/auth" className="reset-back-link">
          Return to Sign In
        </Link>
      </div>
    </div>
  );
}