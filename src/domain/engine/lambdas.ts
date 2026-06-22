// כיול λ (CLAUDE.md §11). מנוע טהור — בלי I/O.
// deriveLambdas: מוצא (λ_home, λ_away) כך שהמטריצה (פואסון+DC) משחזרת את אחוזי 1X2 מ-/predictions.
// fallback: lambdasFromStrength — כשה-predictions כבוי, גזירה מעוצמת התקפה/הגנה.
import { buildMatrix, DEFAULT_RHO, outcomeProbs } from './poisson';

export interface OneXTwo {
  home: number;
  draw: number;
  away: number;
}

export interface Lambdas {
  lambdaHome: number;
  lambdaAway: number;
}

export interface DeriveOptions {
  rho?: number;
  muMin?: number;
  muMax?: number;
  iterations?: number;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * כיול (λ_home, λ_away) לאחוזי 1X2 ע"י ביסקציה מקוננת:
 * - חיצונית על סך השערים μ=λh+λa (pDraw יורד מונוטונית ב-μ) לכיול אחוז התיקו.
 * - פנימית על העדיפות s=λh−λa (חלק ה-home מתוך ההכרעות עולה מונוטונית ב-s).
 */
export function deriveLambdas(target: OneXTwo, opts: DeriveOptions = {}): Lambdas {
  const rho = opts.rho ?? DEFAULT_RHO;
  const iters = opts.iterations ?? 48;
  let muLo = opts.muMin ?? 0.4;
  let muHi = opts.muMax ?? 7;

  // נרמול הקלט (מגן מפני אחוזים שלא מסתכמים בדיוק ל-1).
  const sum = target.home + target.draw + target.away || 1;
  const tH = clamp01(target.home / sum);
  const tD = clamp01(target.draw / sum);
  const tA = clamp01(target.away / sum);
  const homeShare = tH + tA > 0 ? tH / (tH + tA) : 0.5;

  function solveSForMu(mu: number): Lambdas & { draw: number } {
    let lo = -mu + 1e-6;
    let hi = mu - 1e-6;
    let lambdaHome = mu / 2;
    let lambdaAway = mu / 2;
    let draw = 0;
    for (let k = 0; k < iters; k++) {
      const s = (lo + hi) / 2;
      lambdaHome = (mu + s) / 2;
      lambdaAway = (mu - s) / 2;
      const o = outcomeProbs(buildMatrix(lambdaHome, lambdaAway, rho));
      draw = o.draw;
      const decisive = o.home + o.away;
      const sh = decisive > 0 ? o.home / decisive : 0.5;
      if (sh < homeShare) lo = s;
      else hi = s;
    }
    return { lambdaHome, lambdaAway, draw };
  }

  let best = solveSForMu((muLo + muHi) / 2);
  for (let k = 0; k < iters; k++) {
    const mu = (muLo + muHi) / 2;
    best = solveSForMu(mu);
    // pDraw יורד כש-μ עולה: תיקו גבוה מדי → דרושים יותר שערים → מעלים את הרצפה.
    if (best.draw > tD) muLo = mu;
    else muHi = mu;
  }
  return { lambdaHome: best.lambdaHome, lambdaAway: best.lambdaAway };
}

export interface TeamStrength {
  /** שערים בעד למשחק. */
  attack: number;
  /** שערים נגד למשחק. */
  defense: number;
}

export interface StrengthOptions {
  leagueAvg?: number;
  homeAdvantage?: number;
}

function clampPos(x: number): number {
  return Math.min(6, Math.max(0.05, x));
}

/**
 * fallback בסיסי כש-/predictions אינו זמין: מודל עוצמה פואסוני.
 * λ_home = avg · (תקיפת בית/avg) · (הגנת חוץ/avg) · יתרון-בית. שכלול מלא (עדכניות,
 * עוצמת יריב, גובה/מנוחה) מגיע ב-history.ts (M5).
 */
export function lambdasFromStrength(
  home: TeamStrength,
  away: TeamStrength,
  opts: StrengthOptions = {},
): Lambdas {
  const avg = opts.leagueAvg ?? 1.35;
  const homeAdv = opts.homeAdvantage ?? 1.1;
  return {
    lambdaHome: clampPos((home.attack / avg) * (away.defense / avg) * avg * homeAdv),
    lambdaAway: clampPos((away.attack / avg) * (home.defense / avg) * avg),
  };
}
