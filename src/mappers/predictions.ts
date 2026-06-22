// תשובת /predictions גולמית → בסיס 1X2 לאנליסט. ממיר "35%" → 0.35 ומנרמל.
import type { PredictionItem } from '../api/schemas';

function parsePct(s: string | null | undefined): number | undefined {
  if (!s) return undefined;
  const n = Number.parseFloat(s.replace('%', '').trim());
  return Number.isFinite(n) ? n / 100 : undefined;
}

export interface ApiPredictionBaseline {
  percent?: { home: number; draw: number; away: number };
  advice?: string;
  winner?: string;
}

export function mapPrediction(items: PredictionItem[]): ApiPredictionBaseline | null {
  const p = items[0]?.predictions;
  if (!p) return null;

  const baseline: ApiPredictionBaseline = {};
  const h = parsePct(p.percent?.home);
  const d = parsePct(p.percent?.draw);
  const a = parsePct(p.percent?.away);
  if (h !== undefined && d !== undefined && a !== undefined) {
    const sum = h + d + a || 1;
    baseline.percent = { home: h / sum, draw: d / sum, away: a / sum };
  }
  if (p.advice) baseline.advice = p.advice;
  if (p.winner?.name) {
    baseline.winner = p.winner.comment ? `${p.winner.name} (${p.winner.comment})` : p.winner.name;
  }
  return baseline;
}
