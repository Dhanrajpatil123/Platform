import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getBootcampById, enrollInBootcamp, leaveBootcamp } from "../api/bootcampApi";
import { formatDate, timelineText } from "../utils/dateUtils";
import "./Bootcamps.css";
import BootcampSchedule from "../components/BootcampSchedule";

const STATUS_LABEL = { UPCOMING: "Upcoming", ONGOING: "Ongoing", COMPLETED: "Completed" };
const MODE_LABEL = { ONLINE: "Online", OFFLINE: "Offline", HYBRID: "Hybrid" };
const PAY_METHODS = [
  { key: "UPI", label: "UPI" },
  { key: "CARD", label: "Credit / Debit Card" },
  { key: "NETBANKING", label: "Net Banking" },
];

const rupees = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

export default function BootcampDetails() {
  const { bootcampId } = useParams();

  const [bootcamp, setBootcamp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("UPI");
  const [checkoutError, setCheckoutError] = useState("");

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await getBootcampById(bootcampId);
        setBootcamp(response.data);
      } catch (err) {
        setLoadError("Bootcamp not found.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [bootcampId]);

  const handleFreeEnroll = async () => {
    setActionError("");
    setIsBusy(true);
    try {
      const response = await enrollInBootcamp(bootcampId);
      setBootcamp(response.data);
    } catch (err) {
      setActionError(err.response?.data?.error || "Could not enroll. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handlePay = async () => {
    setCheckoutError("");
    setIsBusy(true);
    try {
      const response = await enrollInBootcamp(bootcampId, { paymentMethod: payMethod });
      setBootcamp(response.data);
      setIsCheckoutOpen(false);
    } catch (err) {
      setCheckoutError(err.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleLeave = async () => {
    const warning =
      bootcamp.fee > 0
        ? "Leave this bootcamp? Your seat will be released. Fees are NOT refunded automatically — contact the administrator for refunds."
        : "Leave this bootcamp? Your seat will be released.";
    if (!window.confirm(warning)) return;

    setActionError("");
    setIsBusy(true);
    try {
      const response = await leaveBootcamp(bootcampId);
      setBootcamp(response.data);
    } catch (err) {
      setActionError(err.response?.data?.error || "Could not leave the bootcamp.");
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bc-page">
        <p className="bc-muted">Loading bootcamp...</p>
      </div>
    );
  }

  if (loadError || !bootcamp) {
    return (
      <div className="bc-page bc-center">
        <p>{loadError || "Bootcamp not found."}</p>
        <Link to="/bootcamps" className="btn btn-secondary">
          Back to Bootcamps
        </Link>
      </div>
    );
  }

  const seatsLeft = Math.max(bootcamp.seats - bootcamp.enrolledCount, 0);
  const fillPercent =
    bootcamp.seats > 0 ? Math.min((bootcamp.enrolledCount / bootcamp.seats) * 100, 100) : 0;
  const isFull = seatsLeft === 0;
  const isCompleted = bootcamp.status === "COMPLETED";
  const isPaid = bootcamp.fee > 0;

  return (
    <div className="bc-page">
      <div className="bc-banner">
        <div className="bc-card-top">
          <span className={`bc-status bc-status-${bootcamp.status.toLowerCase()}`}>
            {STATUS_LABEL[bootcamp.status]}
          </span>
          <span className="bc-mode">{MODE_LABEL[bootcamp.mode] || bootcamp.mode}</span>
          <span className={isPaid ? "bc-fee" : "bc-fee bc-fee-free"}>
            {isPaid ? rupees(bootcamp.fee) : "Free"}
          </span>
          {!bootcamp.published && <span className="bc-draft">Draft (only admins see this)</span>}
        </div>

        <h1>{bootcamp.title}</h1>

        <p className="bc-dates">
          📅 {formatDate(bootcamp.startDate)} → {formatDate(bootcamp.endDate)} ·{" "}
          <strong>{timelineText(bootcamp.status, bootcamp.startDate, bootcamp.endDate)}</strong>
        </p>

        <div className="bc-seats">
          <div className="bc-meta-row">
            <span>
              👥 {bootcamp.enrolledCount} of {bootcamp.seats} seats filled
            </span>
            <span className={isFull ? "bc-full" : "bc-muted"}>
              {isFull ? "Full" : `${seatsLeft} left`}
            </span>
          </div>
          <div className="bc-bar">
            <div className="bc-bar-fill" style={{ width: `${fillPercent}%` }} />
          </div>
        </div>

        {actionError && <p className="bc-error">{actionError}</p>}

        <div className="bc-actions">
          {!isLoggedIn && (
            <Link to="/auth" className="btn btn-primary">
              Sign in to enroll
            </Link>
          )}

          {isLoggedIn && !bootcamp.enrolled && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setCheckoutError("");
                if (isPaid) setIsCheckoutOpen(true);
                else handleFreeEnroll();
              }}
              disabled={isBusy || isFull || isCompleted}
            >
              {isCompleted
                ? "Bootcamp finished"
                : isFull
                ? "Bootcamp full"
                : isBusy
                ? "Enrolling..."
                : isPaid
                ? `Pay ${rupees(bootcamp.fee)} & enroll`
                : "Enroll for free"}
            </button>
          )}

          {isLoggedIn && bootcamp.enrolled && (
            <>
              <span className="bc-enrolled">✓ You're enrolled</span>

              {bootcamp.status === "COMPLETED" && (
                <Link to="/certificates" className="btn btn-primary">
                  🎓 Claim certificate
                </Link>
              )}

              {isPaid && (
                <span className="bc-muted">
                  Paid {rupees(bootcamp.fee)}
                  {bootcamp.paymentReference ? ` · Ref ${bootcamp.paymentReference}` : ""}
                </span>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLeave}
                disabled={isBusy}
              >
                {isBusy ? "Please wait..." : "Leave bootcamp"}
              </button>
            </>
          )}

          <Link to="/bootcamps" className="btn btn-secondary">
            All Bootcamps
          </Link>
        </div>
      </div>

      <section className="bc-section">
        <h2>About this bootcamp</h2>
        <p className="bc-description">{bootcamp.description}</p>
      </section>

      <section className="bc-section">
        <h2>Courses included</h2>
        {bootcamp.courses.length === 0 && (
          <p className="bc-muted">No courses have been linked to this bootcamp yet.</p>
        )}
        <div className="bc-course-list">
          {bootcamp.courses.map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="bc-course">
              <div>
                <strong>{c.title}</strong>
                <span className="bc-muted"> · {c.problemCount} problems</span>
              </div>
              <div className="bc-course-chips">
                <span className={`difficulty-badge difficulty-${c.difficulty.toLowerCase()}`}>
                  {c.difficulty}
                </span>
                {c.premium && <span className="premium-chip">★ Premium</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bootcamp schedule */}
      <BootcampSchedule
        bootcampId={bootcamp.id}
        enrolled={bootcamp.enrolled}
      /> 

      {isCheckoutOpen && (
        <div className="bc-modal-overlay" onClick={() => !isBusy && setIsCheckoutOpen(false)}>
          <div className="bc-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Checkout</h2>
            <div className="bc-order">
              <div>
                <strong>{bootcamp.title}</strong>
                <div className="bc-muted">
                  {formatDate(bootcamp.startDate)} → {formatDate(bootcamp.endDate)}
                </div>
              </div>
              <div className="bc-order-amount">{rupees(bootcamp.fee)}</div>
            </div>

            <label className="bc-modal-label">Payment method</label>
            <div className="bc-pay-options">
              {PAY_METHODS.map((m) => (
                <label
                  key={m.key}
                  className={payMethod === m.key ? "bc-pay-option active" : "bc-pay-option"}
                >
                  <input
                    type="radio"
                    name="payMethod"
                    value={m.key}
                    checked={payMethod === m.key}
                    onChange={() => setPayMethod(m.key)}
                  />
                  {m.label}
                </label>
              ))}
            </div>

            <p className="bc-demo-note">
              Demo payment — no real money is charged. A live payment gateway can be connected later.
            </p>

            {checkoutError && <p className="bc-error">{checkoutError}</p>}

            <div className="bc-actions">
              <button type="button" className="btn btn-primary" onClick={handlePay} disabled={isBusy}>
                {isBusy ? "Processing..." : `Pay ${rupees(bootcamp.fee)}`}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCheckoutOpen(false)}
                disabled={isBusy}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}