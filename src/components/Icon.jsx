const PATHS = {
  book: (
    <>
      <path d="M4 5.5c0-1.1.9-2 2-2h6v15H6c-1.1 0-2 .9-2 2v-15Z" />
      <path d="M20 5.5c0-1.1-.9-2-2-2h-6v15h6c1.1 0 2 .9 2 2v-15Z" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.47 5.18 5.53.66-4.1 3.94 1.08 5.72L12 16.9l-4.98 2.1 1.08-5.72-4.1-3.94 5.53-.66L12 3.5z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c0-3.5 3.13-6 7-6s7 2.5 7 6" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.2 12.3l2.4 2.4 5.2-5.4" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  barChart: (
    <>
      <path d="M5 20V11" />
      <path d="M12 20V6" />
      <path d="M19 20v-7" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.2" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.2" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.2" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  node: (
    <>
      <path d="M12 3 19.5 7.25 19.5 15.75 12 20 4.5 15.75 4.5 7.25Z" />
      <circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="M12 4.2 21.3 20.5H2.7L12 4.2Z" />
      <path d="M12 10.3v4" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5.5H4a3 3 0 0 0 3 4.5M17 5.5h3a3 3 0 0 1-3 4.5" />
      <path d="M12 13v3.5M9 20h6M9.5 16.8h5" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  sparkles: (
    <path d="M12 3.5l1 3.2 3.2 1-3.2 1-1 3.2-1-3.2-3.2-1 3.2-1 1-3.2ZM19 13l.55 1.75L21.3 15.3l-1.75.55L19 17.6l-.55-1.75L16.7 15.3l1.75-.55L19 13ZM5.5 14.5l.6 1.9L8 17l-1.9.6-.6 1.9-.6-1.9L3 17l1.9-.6.6-1.9Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.3 2" />
    </>
  ),
  file: (
    <>
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V7a1 1 0 0 0 1 1h3.3" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15.5v-11" />
      <path d="M7.5 8.5 12 4l4.5 4.5" />
      <path d="M5 16v2.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V16" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.45 1 1.15 1.1 1.9h5a2.6 2.6 0 0 1 1.1-1.9A6 6 0 0 0 12 3Z" />
    </>
  ),
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, style, ...props }) {
  const glyph = PATHS[name];
  if (!glyph) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, verticalAlign: "middle", ...style }}
      aria-hidden="true"
      {...props}
    >
      {glyph}
    </svg>
  );
}
