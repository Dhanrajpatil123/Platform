export default function Logo({ size = 32, showWordmark = true }) {
  return (
    <span className="logo-inline">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="etsLogoGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00E5FF" />
            <stop offset="1" stopColor="#0A84FF" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="url(#etsLogoGradient)" />
        <path
          d="M17 15L10 24L17 33"
          stroke="#0A0A12"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M31 15L38 24L31 33"
          stroke="#0A0A12"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M27 12L21 36" stroke="#0A0A12" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
      {showWordmark && (
        <span className="logo-wordmark">
          <span className="logo-wordmark-primary">ExtraTech</span>{" "}
          <span className="logo-wordmark-secondary">Solution</span>
        </span>
      )}
    </span>
  );
}