import { describe, expect, it } from 'vitest';
import {
  buildMatrix,
  couponGrid,
  DEFAULT_RHO,
  dixonColesTau,
  MAX_GOALS,
  outcomeProbs,
  poissonPmf,
} from './poisson';

describe('poissonPmf', () => {
  it('λ=0 נותן כל המסה ב-0', () => {
    expect(poissonPmf(0, 0)).toBe(1);
    expect(poissonPmf(1, 0)).toBe(0);
  });

  it('מתלכד לערך הידוע: P(0;λ)=e^{-λ}', () => {
    expect(poissonPmf(0, 1.5)).toBeCloseTo(Math.exp(-1.5), 12);
  });

  it('מסת ההסתברות מסתכמת ל~1 על פני k רבים', () => {
    let sum = 0;
    for (let k = 0; k <= 30; k++) sum += poissonPmf(k, 2.3);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('מחזיר 0 ל-k שלילי או לא-שלם', () => {
    expect(poissonPmf(-1, 2)).toBe(0);
    expect(poissonPmf(1.5, 2)).toBe(0);
  });
});

describe('buildMatrix', () => {
  it('מטריצה בגודל (MAX_GOALS+1)²', () => {
    const m = buildMatrix(1.4, 1.1);
    expect(m).toHaveLength(MAX_GOALS + 1);
    expect(m[0]).toHaveLength(MAX_GOALS + 1);
  });

  it('המטריצה מנורמלת — סכום כל התאים = 1', () => {
    const m = buildMatrix(1.7, 0.9);
    let total = 0;
    for (const row of m) for (const p of row) total += p;
    expect(total).toBeCloseTo(1, 10);
  });

  it('הסתברויות 1X2 מסתכמות ל-1 ומשקפות יתרון בית', () => {
    const m = buildMatrix(2.0, 0.8);
    const { home, draw, away } = outcomeProbs(m);
    expect(home + draw + away).toBeCloseTo(1, 10);
    expect(home).toBeGreaterThan(away);
  });
});

describe('Dixon-Coles', () => {
  it('τ=1 בכל תא שאינו אחד מארבעת הנמוכים', () => {
    expect(dixonColesTau(2, 1, 1.4, 1.1, -0.05)).toBe(1);
    expect(dixonColesTau(0, 2, 1.4, 1.1, -0.05)).toBe(1);
    expect(dixonColesTau(3, 3, 1.4, 1.1, -0.05)).toBe(1);
  });

  it('המטריצה עם DC עדיין מסתכמת ל-1', () => {
    const m = buildMatrix(1.6, 1.2, DEFAULT_RHO);
    let total = 0;
    for (const row of m) for (const p of row) total += p;
    expect(total).toBeCloseTo(1, 10);
  });

  it('ρ שלילי מגדיל את מסת התיקו לעומת פואסון עצמאי', () => {
    const indep = outcomeProbs(buildMatrix(1.3, 1.3, 0));
    const dc = outcomeProbs(buildMatrix(1.3, 1.3, DEFAULT_RHO));
    expect(dc.draw).toBeGreaterThan(indep.draw);
  });

  it('rho=0 שקול לפואסון עצמאי', () => {
    const a = buildMatrix(1.7, 0.9, 0);
    const b = buildMatrix(1.7, 0.9);
    expect(a[0][0]).toBeCloseTo(b[0][0], 12);
    expect(a[1][1]).toBeCloseTo(b[1][1], 12);
  });
});

describe('couponGrid (מפת-חום לתצוגה)', () => {
  it('מחזיר (max+1)² תאים ו-pMax חיובי', () => {
    const g = couponGrid(2.3, 0.6, 5, DEFAULT_RHO);
    expect(g.cells).toHaveLength(36);
    expect(g.max).toBe(5);
    expect(g.pMax).toBeGreaterThan(0);
  });

  it('pMax הוא אכן התא הסביר ביותר ברשת', () => {
    const g = couponGrid(2.3, 0.6, 5, DEFAULT_RHO);
    const maxCell = g.cells.reduce((a, b) => (b.p > a.p ? b : a));
    expect(maxCell.p).toBeCloseTo(g.pMax, 12);
    // בית חזק מאוד → התא המודאלי הוא ניצחון בית (i>j)
    expect(maxCell.home).toBeGreaterThan(maxCell.away);
  });
});
