import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import "./CertificateTemplate.css";

const W = 1122;
const H = 793;

export function longDate(value) {
  if (!value) return "";
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Corner({ pos }) {
  return (
    <svg className={`cert-corner cert-corner-${pos}`} width="110" height="110" viewBox="0 0 110 110" fill="none">
      <path d="M4 4 H78 M4 4 V78" stroke="#c9a24d" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 14 H58 M14 14 V58" stroke="#c9a24d" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M24 24 C 40 24, 52 36, 52 52 C 36 52, 24 40, 24 24 Z" stroke="#c9a24d" strokeWidth="1.4" fill="rgba(201,162,77,0.12)" />
      <circle cx="4" cy="4" r="5" fill="#0b1f3a" />
      <circle cx="78" cy="4" r="2.5" fill="#c9a24d" />
      <circle cx="4" cy="78" r="2.5" fill="#c9a24d" />
    </svg>
  );
}

function Seal() {
  return (
    <svg className="cert-seal" width="150" height="170" viewBox="0 0 100 114" fill="none">
      <defs>
        <linearGradient id="certGold" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f3d98b" />
          <stop offset="0.5" stopColor="#c9a24d" />
          <stop offset="1" stopColor="#9a7424" />
        </linearGradient>
      </defs>
      <path d="M34 78 L26 110 L40 102 L50 112 L52 80 Z" fill="#0b1f3a" />
      <path d="M66 78 L74 110 L60 102 L50 112 L48 80 Z" fill="#14305a" />
      <circle cx="50" cy="50" r="46" fill="url(#certGold)" />
      <circle cx="50" cy="50" r="46" stroke="#9a7424" strokeWidth="5" strokeDasharray="3 2.2" fill="none" opacity="0.55" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#fff7d6" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="33" fill="#0b1f3a" />
      <polygon
        points="50,32 54.23,44.18 67.12,44.44 56.85,52.22 60.58,64.56 50,57.2 39.42,64.56 43.15,52.22 32.88,44.44 45.77,44.18"
        fill="url(#certGold)"
      />
      <text x="50" y="76" textAnchor="middle" fontSize="6.4" fontWeight="700" fill="#f3d98b" letterSpacing="1.4" fontFamily="Georgia, serif">
        VERIFIED
      </text>
    </svg>
  );
}

export default function CertificateTemplate({ certificate }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [qr, setQr] = useState("");

  const verifyUrl = `${window.location.origin}/verify/${certificate.certificateCode}`;
  // const typeLabel = certificate.type === "BOOTCAMP" ? "bootcamp" : "course";

  const typeLabel = { BOOTCAMP: "bootcamp", TRACK: "learning track" }[certificate.type] || "course";

  const name = certificate.recipientName || "";
  const nameSize = name.length > 34 ? 40 : name.length > 26 ? 50 : 62;

  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 240,
      color: { dark: "#0b1f3a", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [verifyUrl]);

  useEffect(() => {
    const update = () => {
      if (wrapRef.current) setScale(Math.min(1, wrapRef.current.clientWidth / W));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div className="cert-scale-wrap" ref={wrapRef} style={{ height: H * scale }}>
      <div className="cert-print-area" style={{ transform: `scale(${scale})` }}>
        <div className="cert-sheet">
          <div className="cert-frame cert-frame-outer" />
          <div className="cert-frame cert-frame-mid" />
          <div className="cert-frame cert-frame-inner" />
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />
          <div className="cert-watermark">&lt;/&gt;</div>

          <div className="cert-content">
            <div className="cert-brand">
              <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="certLogoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00E5FF" />
                    <stop offset="1" stopColor="#0A84FF" />
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="12" fill="url(#certLogoGrad)" />
                <path d="M17 15L10 24L17 33" stroke="#0A0A12" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M31 15L38 24L31 33" stroke="#0A0A12" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M27 13L21 35" stroke="#0A0A12" strokeWidth="3.2" strokeLinecap="round" />
              </svg>
              <div>
                <div className="cert-brand-name">
                  ExtraTech <b>Solution</b>
                </div>
                <div className="cert-brand-tag">LEARN · BUILD · GROW</div>
              </div>
            </div>

            <h1 className="cert-title">Certificate</h1>
            <div className="cert-subtitle">OF COMPLETION</div>
            <div className="cert-divider">
              <span />
              <i>◆</i>
              <span />
            </div>

            <p className="cert-presented">This certificate is proudly presented to</p>
            <div className="cert-name" style={{ fontSize: nameSize }}>
              {name}
            </div>
            <div className="cert-name-line" />

            <p className="cert-body">for successfully completing the {typeLabel}</p>
            <div className="cert-course">{certificate.title}</div>
            {certificate.detail && <p className="cert-detail">{certificate.detail}</p>}

            <div className="cert-footer">
              <div className="cert-sign">
                <div className="cert-sign-value">{longDate(certificate.completionDate)}</div>
                <div className="cert-sign-line" />
                <div className="cert-sign-label">Date of Completion</div>
              </div>

              <Seal />

              <div className="cert-sign">
                <svg className="cert-signature" width="170" height="46" viewBox="0 0 170 46" fill="none">
                  <path
                    d="M6 32 C 20 4, 30 44, 44 20 S 70 10, 80 30 S 104 40, 118 14 S 146 8, 164 26"
                    stroke="#0b1f3a"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="cert-sign-line" />
                <div className="cert-sign-label">
                  Authorized Signatory
                  <br />
                  ExtraTech Solution
                </div>
              </div>
            </div>
          </div>

          <div className="cert-verify">
            {qr && <img src={qr} alt="Verification QR code" />}
            <div className="cert-verify-text">
              <div>
                Certificate ID: <b>{certificate.certificateCode}</b>
              </div>
              <div>Issued on {longDate(certificate.issuedDate)}</div>
              <div>
                Verify authenticity at <b>{verifyUrl}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}