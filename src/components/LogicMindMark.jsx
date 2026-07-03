const SIZES = { sm: 28, lg: 96 };

export default function LogicMindMark({ size = "sm" }) {
  const px = SIZES[size] ?? SIZES.sm;
  const id = `lm-grad-${size}`;
  return (
    <svg
      width={px} height={px}
      viewBox="0 0 48 48" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5B5FEF" />
          <stop offset="1" stopColor="#17C3B2" />
        </linearGradient>
      </defs>
      {/* Hexagon outline */}
      <path
        d="M24 2 L42 12.5 L42 35.5 L24 46 L6 35.5 L6 12.5 Z"
        stroke={`url(#${id})`} strokeWidth="2" fill="none"
      />
      {/* Connection lines from center to outer nodes */}
      <line x1="24" y1="24" x2="24" y2="11" stroke={`url(#${id})`} strokeWidth="1.5" opacity="0.55" />
      <line x1="24" y1="24" x2="36" y2="34" stroke={`url(#${id})`} strokeWidth="1.5" opacity="0.55" />
      <line x1="24" y1="24" x2="12" y2="34" stroke={`url(#${id})`} strokeWidth="1.5" opacity="0.55" />
      {/* Outer nodes */}
      <circle cx="24" cy="11" r="3.5" fill="#5B5FEF" />
      <circle cx="36" cy="34" r="3.5" fill="#5B5FEF" />
      <circle cx="12" cy="34" r="3.5" fill="#5B5FEF" />
      {/* Center node — pulsing */}
      <circle cx="24" cy="24" r="5.5" fill={`url(#${id})`} className="lm-pulse" />
    </svg>
  );
}
