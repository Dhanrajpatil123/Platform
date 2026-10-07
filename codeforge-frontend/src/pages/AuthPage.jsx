import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup, login } from "../api/authApi";
import "./AuthPage.css";

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("signin");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [signInData, setSignInData] = useState({
    identifier: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignInChange = (e) => {
    setSignInData({ ...signInData, [e.target.name]: e.target.value });
  };

  const handleSignUpChange = (e) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
  };

  const storeSessionAndRedirect = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.role);
    navigate("/dashboard");
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await login(signInData);
      storeSessionAndRedirect(response.data);
    } catch (err) {
      const message =
        err.response?.data?.error || "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await signup({
        username: signUpData.username,
        email: signUpData.email,
        password: signUpData.password,
        year: signUpData.year || null,
      });
      storeSessionAndRedirect(response.data);
    } catch (err) {
      const message =
        err.response?.data?.error || "Signup failed. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back-link">
          &larr; Back to Landing Page
        </Link>

        <h1 className="auth-brand">ExtraTech Solution</h1>

        <div className="auth-tabs">
          <button
            type="button"
            className={activeTab === "signin" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setActiveTab("signin");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={activeTab === "signup" ? "auth-tab active" : "auth-tab"}
            onClick={() => {
              setActiveTab("signup");
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        {error && <p className="auth-error">{error}</p>}

        {activeTab === "signin" ? (
          <form className="auth-form" onSubmit={handleSignInSubmit}>
            <label htmlFor="identifier">Email or Username</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              value={signInData.identifier}
              onChange={handleSignInChange}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={signInData.password}
              onChange={handleSignInChange}
              required
            />

            <Link to="/reset-password" className="auth-forgot-link">
              Forgot Password?
            </Link>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignUpSubmit}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={signUpData.username}
              onChange={handleSignUpChange}
              required
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={signUpData.email}
              onChange={handleSignUpChange}
              required
            />

            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              name="password"
              type="password"
              value={signUpData.password}
              onChange={handleSignUpChange}
              required
            />

            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={signUpData.confirmPassword}
              onChange={handleSignUpChange}
              required
            />


            <label htmlFor="year">Academic Year (optional)</label>
              <select
                id="year"
                name="year"
                value={signUpData.year}
                onChange={handleSignUpChange}
              >
                <option value="">Prefer not to say</option>
                <option value="FIRST_YEAR">1st Year</option>
                <option value="SECOND_YEAR">2nd Year</option>
                <option value="THIRD_YEAR">3rd Year</option>
                <option value="FOURTH_YEAR">4th Year</option>
              </select>



            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}