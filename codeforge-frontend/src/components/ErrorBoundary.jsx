import { Component } from "react";
import "./ErrorBoundary.css";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logged to console for now — a real error-tracking service (Sentry, etc.)
    // would be the next step here, but that's a separate integration decision
    console.error("Uncaught error in CodeForge:", error, errorInfo);
  }

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>
            An unexpected error occurred. You can try reloading, or head back
            to the homepage.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.handleReload}
          >
            Back to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}