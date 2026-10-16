import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getAdminCertificates,
  revokeCertificate,
  reinstateCertificate,
} from "../../api/certificateApi";
import { longDate } from "../../components/CertificateTemplate";
import "../Certificates.css";
import { certificateTypeName } from "../../utils/certificateLabels";


export default function ManageCertificates() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (q) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await getAdminCertificates(q);
      setRows(response.data);
    } catch (err) {
      setError("Failed to load certificates.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const handleRevoke = async (row) => {
    const reason = window.prompt(`Revoke certificate ${row.certificateCode}?\nReason (shown only to admins):`);
    if (reason === null) return;
    try {
      await revokeCertificate(row.id, reason);
      load(query);
    } catch (err) {
      setError("Failed to revoke the certificate.");
    }
  };

  const handleReinstate = async (row) => {
    try {
      await reinstateCertificate(row.id);
      load(query);
    } catch (err) {
      setError("Failed to reinstate the certificate.");
    }
  };

  return (
    <div className="certp-page">
      <div className="certp-admin-head">
        <div>
          <h1 className="certp-h1">Manage Certificates</h1>
          <p className="certp-muted">Search issued certificates, revoke fraudulent ones, or reinstate them.</p>
        </div>
        <Link to="/admin" className="btn btn-secondary">
          Back to Admin
        </Link>
      </div>

      <div className="certp-search">
        <input
          type="text"
          placeholder="Search by ID, name, username or title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(query)}
        />
        <button type="button" className="btn btn-primary" onClick={() => load(query)}>
          Search
        </button>
      </div>

      {error && <p className="certp-error">{error}</p>}
      {isLoading && <p className="certp-muted">Loading...</p>}
      {!isLoading && rows.length === 0 && <p className="certp-muted">No certificates found.</p>}

      {rows.length > 0 && (
        <table className="certp-table">
          <thead>
            <tr>
              <th>Certificate ID</th>
              <th>Recipient</th>
              <th>Account</th>
              <th>Title</th>
              <th>Type</th>
              <th>Issued</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link to={`/verify/${r.certificateCode}`} className="certp-link">
                    {r.certificateCode}
                  </Link>
                </td>
                <td>{r.recipientName}</td>
                <td>{r.username}</td>
                <td>{r.title}</td>
                
                {/* <td>{r.type === "BOOTCAMP" ? "Bootcamp" : "Course"}</td> */}

                <td>{certificateTypeName(r.type)}</td>


                <td>{longDate(r.issuedDate)}</td>
                <td>
                  {r.revoked ? (
                    <span className="certp-chip certp-chip-bad" title={r.revokedReason || ""}>
                      Revoked
                    </span>
                  ) : (
                    <span className="certp-chip certp-chip-good">Valid</span>
                  )}
                </td>
                <td>
                  {r.revoked ? (
                    <button type="button" className="btn btn-secondary" onClick={() => handleReinstate(r)}>
                      Reinstate
                    </button>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={() => handleRevoke(r)}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}