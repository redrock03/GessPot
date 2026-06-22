// נקודת התצורה היחידה שנוגעת בהחלטת ה-CORS (CLAUDE.md §7/§17).
// proxy מול ישיר נקבע כאן ובלבד. ערך ריק = ישיר (יחסום ב-browser ללא proxy).
// בפרודקשן: API_BASE = כתובת ה-Cloudflare Worker. בפיתוח: אפשר proxy מקומי דרך wrangler.

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '';

// כתובת פונקציית האנליסט (claude-analyst) — מנוע ה-LLM ההיברידי. ריק = כבוי (נופלים למסלול /predictions).
export const ANALYST_BASE: string = import.meta.env.VITE_ANALYST_BASE ?? '';

// סוד-אפליקציה רך (header x-app-secret) — מקשה על שימוש-לרעה ב-URL של הפונקציה שדלף.
// נכלל ב-bundle (לא סוד אמיתי); ההגנה האמיתית מול עלות היא תקרת-הוצאה ב-Anthropic + cache פר-משחק.
export const APP_SECRET: string = import.meta.env.VITE_APP_SECRET ?? '';

/** מזהי המונדיאל הקבועים (CLAUDE.md §7). */
export const WORLD_CUP = { league: 1, season: 2026 } as const;
