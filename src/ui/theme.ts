// מירור TS לטוקני DESIGN.md §2 (מקור-האמת ב-CSS :root ב-global.css). לשימוש מ-TS בעת הצורך.
// אין להמציא ערכים מחוץ ל-DESIGN.md.
export const theme = {
  color: {
    ink: '#0a0e16',
    surface: '#121a28',
    surface2: '#0e1622',
    line: '#1f2a3c',
    text: '#eaf1fb',
    textDim: '#8a99b0',
    textMute: '#5a6b82',
    // ציר מהות
    home: '#2fbf87',
    draw: '#e8b23a',
    away: '#f26d7d',
    // ציר סוג-הצעה
    steady: '#4da8ff', // כיוון
    strike: '#f5c84b', // בול
  },
  font: {
    display: "'Heebo', system-ui, sans-serif",
    body: "'Heebo', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  },
} as const;

export type Theme = typeof theme;
