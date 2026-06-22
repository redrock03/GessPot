// אייקונוגרפיה שמבדילה כיוון↔בול ב-*צורה* ולא רק בגוון (DESIGN.md §4.1 / נגישות §5).
// כיוון = ריבוע-כוונת (סורק/טווח). בול = בולסאיי (פגיעה מדויקת). שניהם currentColor.

export function TendencyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function ExactIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.9" fill="currentColor" />
    </svg>
  );
}

export function ConvergeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7h4l5 5 5-5h4M3 17h4l5-5 5 5h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
