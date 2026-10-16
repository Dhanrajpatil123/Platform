import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicCertificate } from "../api/certificateApi";
import CertificateTemplate from "../components/CertificateTemplate";
import "./Certificates.css";

export default function CertificateView() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setNotFound(false);
      try {
        const response = await getPublicCertificate(code);
        setData(response.data);
      } catch (err) {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [code]);

  const verifyUrl = `${window.location.origin}/verify/${code}`;

  const handlePrint = () => {
    const previous = document.title;
    document.title = `Certificate - ${data.recipientName} - ${data.title}`;
    window.print();
    setTimeout(() => {
      document.title = previous;
    }, 500);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      window.prompt("Copy this link:", verifyUrl);
    }
  };

  const linkedInUrl = () => {
    const [y, m] = String(data.issuedDate).split("-");
    const url = new URL("https://www.linkedin.com/profile/add");
    url.searchParams.set("startTask", "CERTIFICATION_NAME");
    url.searchParams.set("name", data.title);
    url.searchParams.set("organizationName", "ExtraTech Solution");
    url.searchParams.set("issueYear", y);
    url.searchParams.set("issueMonth", String(Number(m)));
    url.searchParams.set("certId", data.certificateCode);
    url.searchParams.set("certUrl", verifyUrl);
    return url.toString();
  };

  if (isLoading) {
    return (
      <div className="certp-page">
        <p className="certp-muted">Verifying certificate...</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="certp-page certp-center">
        <div className="certp-banner certp-banner-bad">✗ No certificate found with ID “{code}”.</div>
        <p className="certp-muted">Please check the ID and try again.</p>
        <Link to="/" className="btn btn-secondary">
          Back to home
        </Link>
      </div>
    );
  }

  if (!data.valid) {
    return (
      <div className="certp-page certp-center">
        <div className="certp-banner certp-banner-bad">✗ {data.message}</div>
        <p className="certp-muted">Certificate ID: {data.certificateCode}</p>
      </div>
    );
  }

  return (
    <div className="certp-page">
      <div className="certp-banner certp-banner-good">
        ✓ Verified — this certificate was issued by <strong>{data.issuer}</strong> and is authentic.
      </div>

      <CertificateTemplate certificate={data} />

      <div className="certp-actions">
        <button type="button" className="btn btn-primary" onClick={handlePrint}>
          🖨 Download / Print PDF
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleCopy}>
          {copied ? "✓ Link copied" : "🔗 Copy verification link"}
        </button>
        <a href={linkedInUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          in Add to LinkedIn
        </a>
      </div>
      <p className="certp-muted certp-tip">
        Tip: in the print dialog choose “Save as PDF”, set layout to Landscape and margins to None.
      </p>
    </div>
  );
}