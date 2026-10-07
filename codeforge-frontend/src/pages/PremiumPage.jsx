import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getPlans,
  getPremiumStatus,
  checkoutPlan,
  cancelPremium,
} from "../api/premiumApi";
import "./PremiumPage.css";

const PERKS = [
  "Read and solve every Premium problem",
  "Read Premium discussion threads and posted solutions",
  "Enroll in Premium courses",
  "A PRO badge next to your name",
];

export default function PremiumPage() {
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const role = localStorage.getItem("role");

  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Tells the navbar (Layout) to refetch premium status so the PRO badge updates
  const notifyPremiumChanged = () =>
    window.dispatchEvent(new Event("premium-changed"));

  useEffect(() => {
    async function load() {
      try {
        const plansResponse = await getPlans();
        setPlans(plansResponse.data);
      } catch (err) {
        setError("Could not load the plans. Please try again.");
      }

      if (isLoggedIn) {
        try {
          const statusResponse = await getPremiumStatus();
          setStatus(statusResponse.data);
        } catch (err) {
          setStatus(null);
        }
      }
      setIsLoading(false);
    }
    load();
  }, [isLoggedIn]);

  const handleCheckout = async (plan) => {
    setError("");
    setMessage("");
    setBusyPlan(plan.code);
    try {
      const response = await checkoutPlan(plan.code);
      setStatus(response.data);
      setMessage(
        `You're Premium until ${new Date(
          response.data.premiumUntil
        ).toLocaleDateString()}.`
      );
      notifyPremiumChanged();
    } catch (err) {
      setError(err.response?.data?.error || "Checkout failed. Please try again.");
    } finally {
      setBusyPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("End your Premium access now?")) return;
    setError("");
    setMessage("");
    setIsCancelling(true);
    try {
      const response = await cancelPremium();
      setStatus(response.data);
      setMessage("Premium ended.");
      notifyPremiumChanged();
    } catch (err) {
      setError(err.response?.data?.error || "Could not end Premium.");
    } finally {
      setIsCancelling(false);
    }
  };

  const hasPaidPeriod = Boolean(status?.premium && status?.premiumUntil);

  return (
    <div className="premium-page">
      <div className="premium-hero">
        <h1>ExtraTech Solution Premium</h1>
        <p>Unlock the full problem set and support the platform.</p>
      </div>

      {status?.mockCheckout && (
        <p className="premium-dev-note">
          Development mode: checkout activates Premium instantly without taking
          payment. Turn off <code>premium.mock-checkout-enabled</code> before
          going live.
        </p>
      )}

      {message && <p className="premium-message">{message}</p>}
      {error && <p className="premium-error">{error}</p>}

      {status?.premium && (
        <div className="premium-active">
          <strong>Premium is active</strong>
          <span>
            {role === "ADMIN" && !status.premiumUntil
              ? "Admin accounts always have full access."
              : `Valid until ${new Date(status.premiumUntil).toLocaleDateString()}`}
          </span>
        </div>
      )}

      <ul className="premium-perks">
        {PERKS.map((perk) => (
          <li key={perk}>✓ {perk}</li>
        ))}
      </ul>

      {isLoading && <p className="placeholder-text">Loading plans...</p>}

      {!isLoading && (
        <div className="premium-plans">
          {plans.map((plan) => (
            <div key={plan.code} className="premium-plan-card">
              <h3>{plan.label}</h3>
              <div className="premium-plan-price">₹{plan.priceInr}</div>
              <p className="premium-plan-days">{plan.days} days of access</p>

              {isLoggedIn ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleCheckout(plan)}
                  disabled={busyPlan !== null}
                >
                  {busyPlan === plan.code
                    ? "Processing..."
                    : hasPaidPeriod
                    ? "Extend with this plan"
                    : "Get Premium"}
                </button>
              ) : (
                <Link to="/auth" className="btn btn-primary">
                  Sign in to upgrade
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {status?.mockCheckout && hasPaidPeriod && (
        <button
          type="button"
          className="premium-cancel-btn"
          onClick={handleCancel}
          disabled={isCancelling}
        >
          {isCancelling ? "Ending..." : "End Premium now (dev mode)"}
        </button>
      )}
    </div>
  );
}