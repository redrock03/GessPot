// מנוע טהור — מספרים נכנסים, מספרים יוצאים. בלי fetch / React / Date.now (CLAUDE.md §6/§14).
// בסיס ה-Poisson + תיקון Dixon-Coles + מטריצת תוצאות (CLAUDE.md §11).

/** מספר השערים המקסימלי לכל צד במטריצה (0..MAX_GOALS). */
export const MAX_GOALS = 8;

/**
 * פרמטר התלות של Dixon-Coles. ρ שלילי קל מגדיל את מסת התיקו הנמוך (0-0, 1-1)
 * שהפואסון העצמאי מחסיר בפועל — תיקון אמפירי מקובל בכדורגל.
 */
export const DEFAULT_RHO = -0.05;

/** poisson(k, λ) = e^{-λ} λ^k / k! */
export function poissonPmf(k: number, lambda: number): number {
  if (k < 0 || !Number.isInteger(k)) return 0;
  if (lambda < 0) return 0;
  if (lambda === 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

export type ScoreMatrix = number[][];

/**
 * גורם התיקון τ של Dixon-Coles, חל רק על ארבעת התאים הנמוכים:
 *   τ(0,0)=1−λμρ ; τ(0,1)=1+λρ ; τ(1,0)=1+μρ ; τ(1,1)=1−ρ ; אחרת 1.
 */
export function dixonColesTau(
  i: number,
  j: number,
  lambdaHome: number,
  lambdaAway: number,
  rho: number,
): number {
  if (i === 0 && j === 0) return Math.max(0, 1 - lambdaHome * lambdaAway * rho);
  if (i === 0 && j === 1) return Math.max(0, 1 + lambdaHome * rho);
  if (i === 1 && j === 0) return Math.max(0, 1 + lambdaAway * rho);
  if (i === 1 && j === 1) return Math.max(0, 1 - rho);
  return 1;
}

/**
 * מטריצת תוצאות M[i][j] = P(home=i)·P(away=j)·τ(i,j) ל-i,j ∈ 0..MAX_GOALS,
 * מנורמלת לסכום 1. rho=0 → פואסון עצמאי (ללא תיקון).
 */
export function buildMatrix(lambdaHome: number, lambdaAway: number, rho = 0): ScoreMatrix {
  const home: number[] = [];
  const away: number[] = [];
  for (let k = 0; k <= MAX_GOALS; k++) {
    home[k] = poissonPmf(k, lambdaHome);
    away[k] = poissonPmf(k, lambdaAway);
  }
  const m: ScoreMatrix = [];
  let total = 0;
  for (let i = 0; i <= MAX_GOALS; i++) {
    m[i] = [];
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p =
        home[i] * away[j] * (rho === 0 ? 1 : dixonColesTau(i, j, lambdaHome, lambdaAway, rho));
      m[i][j] = p;
      total += p;
    }
  }
  // נרמול — הזנב מעבר ל-MAX_GOALS נחתך (וגם τ מטה מ-1), ולכן מחזירים לסכום 1.
  if (total > 0) {
    for (let i = 0; i <= MAX_GOALS; i++) {
      for (let j = 0; j <= MAX_GOALS; j++) m[i][j] /= total;
    }
  }
  return m;
}

export interface CouponCell {
  home: number;
  away: number;
  p: number;
}
export interface CouponGridResult {
  cells: CouponCell[];
  pMax: number;
  max: number;
}

/**
 * רשת מפת-החום לתצוגה (DESIGN.md §4.3/§8): P(home=i, away=j) ל-i,j ∈ 0..max,
 * נלקחת מהמטריצה המלאה המנורמלת (עם Dixon-Coles). `pMax` לשקלוף עוצמת alpha בתא.
 */
export function couponGrid(
  lambdaHome: number,
  lambdaAway: number,
  max = 5,
  rho = 0,
): CouponGridResult {
  const m = buildMatrix(lambdaHome, lambdaAway, rho);
  const cells: CouponCell[] = [];
  let pMax = 0;
  for (let i = 0; i <= max; i++) {
    for (let j = 0; j <= max; j++) {
      const p = m[i][j] ?? 0;
      if (p > pMax) pMax = p;
      cells.push({ home: i, away: j, p });
    }
  }
  return { cells, pMax, max };
}

/** הסתברויות 1X2 הנגזרות ממטריצה (CLAUDE.md §4). */
export function outcomeProbs(m: ScoreMatrix): { home: number; draw: number; away: number } {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let i = 0; i < m.length; i++) {
    for (let j = 0; j < m[i].length; j++) {
      if (i > j) home += m[i][j];
      else if (i === j) draw += m[i][j];
      else away += m[i][j];
    }
  }
  return { home, draw, away };
}
