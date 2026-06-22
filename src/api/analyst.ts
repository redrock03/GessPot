// לקוח לפונקציית האנליסט (claude-analyst) — חצי הלקוח של המנוע ההיברידי (CLAUDE.md §4 / מנוע 0).
// שולח חבילת סטטיסטיקות, מקבל תחזית מכוילת ומאומתת (zod). ה-λ מוזן למנוע הטהור בשכבת data/.
import { z } from 'zod';
import { ANALYST_BASE } from '../config';
import type { AnalystPrediction, Stage } from '../domain/types';
import { ApiError } from './errors';

/** חבילת הקלט לאנליסט. רק `fixture` חובה; כל השאר אופציונלי ומתמלא ככל שנבנים hooks (M3/M5). */
export interface AnalystInput {
  fixture: { home: string; away: string; stage: Stage; kickoff?: string; venue?: string };
  apiPrediction?: {
    percent?: { home: number; draw: number; away: number };
    expectedGoals?: { home: number; away: number };
    advice?: string;
    winner?: string;
  };
  comparison?: Record<string, unknown>;
  homeStats?: unknown;
  awayStats?: unknown;
  recentXg?: { home?: number; away?: number };
  odds?: { home?: number; draw?: number; away?: number };
  h2h?: string[];
  absences?: { home?: string[]; away?: string[] };
  stakes?: { home?: string; away?: string };
  notes?: string;
}

const predictionSchema = z.object({
  oneXtwo: z.object({ home: z.number(), draw: z.number(), away: z.number() }),
  expectedGoals: z.object({ home: z.number(), away: z.number() }),
  confidence: z.enum(['low', 'medium', 'high']),
  keyFactors: z.array(z.string()),
  rationale: z.string(),
});
const responseSchema = z.object({ prediction: predictionSchema });

/** קורא לאנליסט ומחזיר תחזית מאומתת. זורק ApiError אם כבוי/נכשל. */
export async function getAnalystPrediction(input: AnalystInput): Promise<AnalystPrediction> {
  if (!ANALYST_BASE) {
    throw new ApiError('api', 'מנוע האנליסט כבוי (VITE_ANALYST_BASE לא מוגדר)');
  }

  let res: Response;
  try {
    res = await fetch(ANALYST_BASE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new ApiError('network', 'הקריאה לאנליסט נכשלה', { detail: err });
  }

  const raw: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError('http', `אנליסט HTTP ${res.status}`, { status: res.status, detail: raw });
  }

  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError('validation', 'תשובת האנליסט לא תאמה את הסכמה', {
      detail: parsed.error.issues,
    });
  }
  return parsed.data.prediction;
}
