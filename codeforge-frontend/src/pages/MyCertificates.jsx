import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyCertificates,
  getCertificateEligibility,
  claimCertificate,
} from "../api/certificateApi";
import { longDate } from "../components/CertificateTemplate";
import "./Certificates.css";
import { certificateTypeName } from "../utils/certificateLabels";

const NAME_KEY = "ets-certificate-name";

export default function MyCertificates() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const [certificates, setCertificates] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [claimTarget, setClaimTarget] = useState(null);
  const [claimName, setClaimName] = useState(localStorage.getItem(NAME_KEY) || "");
  const [claimError, setClaimError] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  const load = useCallback(async () => {
    try {
      const [certRes, eligRes] = await Promise.all([getMyCertificates(), getCertificateEligibility()]);
      setCertificates(certRes.data);
      setItems(eligRes.data);
    } catch (err) {
      setLoadError("Could not load your certificates.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) load();
    else setIsLoading(false);
  }, [isLoggedIn, load]);

  const handleClaim = async () => {
    setClaimError("");
    setIsClaiming(true);
    try {
      const response = await claimCertificate({
        type: claimTarget.type,
        referenceId: claimTarget.referenceId,
        recipientName: claimName,
      });
      localStorage.setItem(NAME_KEY, claimName.trim());
      navigate(`/verify/${response.data.certificateCode}`);
    } catch (err) {
      setClaimError(err.response?.data?.error || "Could not issue the certificate.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="certp-page certp-center">
        <p>Please sign in to see your certificates.</p>
        <Link to="/auth" className="btn btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  const pending = items.filter((i) => i.status !== "ISSUED");

  return (
    <div className="certp-page">
      <h1 className="certp-h1">🎓 My Certificates</h1>
      <p className="certp-muted">
        Finish a course (solve every problem) or a bootcamp (attend at least 75% of sessions) to earn a
        verifiable certificate.
      </p>

      {isLoading && <p className="certp-muted">Loading...</p>}
      {loadError && <p className="certp-error">{loadError}</p>}

      <h2 className="certp-h2">Earned</h2>
      {!isLoading && certificates.length === 0 && (
        <p className="certp-muted">No certificates yet — keep going, you're on your way!</p>
      )}
      <div className="certp-grid">
        {certificates.map((c) => (
          <div key={c.id} className={c.revoked ? "certp-card certp-card-revoked" : "certp-card"}>
            <div className="certp-card-top">
              {/* <span className="certp-chip">{c.type === "BOOTCAMP" ? "Bootcamp" : "Course"}</span> */}
              
              <span className="certp-chip">{c.type === "BOOTCAMP" ? "Bootcamp" : "Course"}</span>

              {c.revoked && <span className="certp-chip certp-chip-bad">Revoked</span>}
            </div>
            <h3>{c.title}</h3>
            <p className="certp-muted">Issued {longDate(c.issuedDate)}</p>
            <p className="certp-code">{c.certificateCode}</p>
            <Link to={`/verify/${c.certificateCode}`} className="btn btn-primary">
              View certificate
            </Link>
          </div>
        ))}
      </div>

      <h2 className="certp-h2">In progress</h2>
      {!isLoading && pending.length === 0 && (
        <p className="certp-muted">
          Nothing in progress. <Link to="/courses" className="certp-link">Enroll in a course</Link> or{" "}
          <Link to="/bootcamps" className="certp-link">join a bootcamp</Link> to start earning certificates.
        </p>
      )}
      <div className="certp-list">
        {pending.map((i) => (
          <div key={`${i.type}-${i.referenceId}`} className="certp-row">
            <div className="certp-row-main">
              <div className="certp-row-title">
                {/* <span className="certp-chip">{i.type === "BOOTCAMP" ? "Bootcamp" : "Course"}</span> */}

                <span className="certp-chip">{certificateTypeName(i.type)}</span>


                {i.title}
              </div>
              <div className="certp-bar">
                <div className="certp-bar-fill" style={{ width: `${i.progressPercent}%` }} />
              </div>
              <div className="certp-muted">{i.progressLabel}</div>
              <div className={i.status === "ELIGIBLE" ? "certp-good" : "certp-muted"}>{i.message}</div>
            </div>
            {i.status === "ELIGIBLE" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setClaimError("");
                  setClaimTarget(i);
                }}
              >
                Claim certificate
              </button>
            )}
          </div>
        ))}
      </div>

      {claimTarget && (
        <div className="certp-overlay" onClick={() => !isClaiming && setClaimTarget(null)}>
          <div className="certp-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Claim your certificate</h2>
            <p className="certp-muted">{claimTarget.title}</p>

            <label>Your full name as it should appear on the certificate</label>
            <input
              type="text"
              value={claimName}
              maxLength={60}
              onChange={(e) => setClaimName(e.target.value)}
              placeholder="e.g. Raj Sharma"
              autoFocus
            />
            <p className="certp-warn">
              ⚠ Please double-check the spelling. The name can’t be changed after the certificate is issued.
            </p>

            {claimError && <p className="certp-error">{claimError}</p>}

            <div className="certp-actions certp-actions-left">
              <button type="button" className="btn btn-primary" onClick={handleClaim} disabled={isClaiming}>
                {isClaiming ? "Issuing..." : "Issue certificate"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setClaimTarget(null)}
                disabled={isClaiming}
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