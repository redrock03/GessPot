import { describe, expect, it } from 'vitest';
import type { MatchAdvice } from '../types';
import type { ScoreMatrix } from './poisson';
import { buildMatrix } from './poisson';
import { adviseFrom1x2, adviseFromLambdas, recommendByRisk, suggest } from './suggest';

describe('suggest — חוזה §4 על מטריצה בנויה ידנית', () => {
  // מקרה ליבה: הציון הסביר ביותר הוא תיקו 1-1, אך הכיוון הסביר ביותר הוא ניצחון בית.
  // כך שתי ההצעות מתפצלות — בדיוק העיקרון של המוצר.
  // home=0.48, draw=0.34, away=0.18; התא המודאלי (1,1)=0.20.
  const M: ScoreMatrix = [
    [0.08, 0.07, 0.05],
    [0.14, 0.2, 0.06],
    [0.12, 0.15, 0.06],
    [0.0, 0.07, 0.0],
  ];

  const advice = suggest(M, 'group'); // T=1, E=3

  it('הצעת הבול = התא המודאלי (1-1, תיקו)', () => {
    expect(advice.exactPick.score).toEqual({ home: 1, away: 1 });
    expect(advice.exactPick.pExact).toBeCloseTo(0.2, 10);
  });

  it('הצעת הכיוון = הכיוון הסביר (בית), בתוכו התא הסביר ביותר (2-1)', () => {
    expect(advice.tendencyPick.score).toEqual({ home: 2, away: 1 });
    expect(advice.tendencyPick.pOutcome).toBeCloseTo(0.48, 10);
  });

  it('לא מתכנס — שתי ההצעות שונות', () => {
    expect(advice.converged).toBe(false);
  });

  it('EV מחושב לפי E·Pexact + T·(Pout − Pexact)', () => {
    // בול 1-1: 3·0.20 + 1·(0.34−0.20) = 0.74
    expect(advice.exactPick.ev).toBeCloseTo(0.74, 10);
    // כיוון 2-1: 3·0.15 + 1·(0.48−0.15) = 0.78
    expect(advice.tendencyPick.ev).toBeCloseTo(0.78, 10);
  });

  it('הכיוון הבטוח בעל EV מעט גבוה יותר מרדיפת הבול (CLAUDE.md §1)', () => {
    expect(advice.tendencyPick.ev).toBeGreaterThan(advice.exactPick.ev);
  });

  it('outcomeProb מסתכם ל-1', () => {
    const { home, draw, away } = advice.outcomeProb;
    expect(home + draw + away).toBeCloseTo(1, 10);
  });
});

describe('suggest — התכנסות בקבוצת בית חזקה', () => {
  it('כשהתא המודאלי הוא ניצחון בית והכיוון הוא בית — converged', () => {
    const advice = suggest(buildMatrix(2.4, 0.6, -0.05), 'r16');
    expect(advice.outcomeProb.home).toBeGreaterThan(advice.outcomeProb.away);
    expect(advice.tendencyPick.score.home).toBeGreaterThan(advice.tendencyPick.score.away);
    if (advice.converged) {
      expect(advice.exactPick.score).toEqual(advice.tendencyPick.score);
    }
  });
});

describe('adviseFrom1x2 — צינור מלא מ-1X2', () => {
  it('אחוזים מוטים-בית → כיוון בית', () => {
    const advice = adviseFrom1x2({ home: 0.62, draw: 0.23, away: 0.15 }, 'group');
    expect(advice.outcomeProb.home).toBeGreaterThan(advice.outcomeProb.away);
    expect(advice.tendencyPick.score.home).toBeGreaterThanOrEqual(advice.tendencyPick.score.away);
  });
});

describe('adviseFromLambdas — מסלול האנליסט (שערים צפויים ישירות)', () => {
  it('λ מוטה-בית → כיוון בית', () => {
    const advice = adviseFromLambdas(2.0, 0.8, 'qf', -0.05);
    expect(advice.outcomeProb.home).toBeGreaterThan(advice.outcomeProb.away);
    expect(advice.tendencyPick.score.home).toBeGreaterThanOrEqual(advice.tendencyPick.score.away);
  });

  it('זהה ל-suggest על אותה מטריצה (חוזה §4)', () => {
    const viaLambdas = adviseFromLambdas(1.6, 1.2, 'r16', -0.05);
    const direct = suggest(buildMatrix(1.6, 1.2, -0.05), 'r16');
    expect(viaLambdas.exactPick.score).toEqual(direct.exactPick.score);
    expect(viaLambdas.tendencyPick.score).toEqual(direct.tendencyPick.score);
    expect(viaLambdas.exactPick.ev).toBeCloseTo(direct.exactPick.ev, 12);
  });
});

describe('recommendByRisk — חוגת הסיכון §4', () => {
  const split: MatchAdvice = {
    tendencyPick: { kind: 'tendency', score: { home: 2, away: 1 }, pExact: 0.15, pOutcome: 0.48, ev: 0.78 },
    exactPick: { kind: 'exact', score: { home: 1, away: 1 }, pExact: 0.2, pOutcome: 0.34, ev: 0.74 },
    converged: false,
    outcomeProb: { home: 0.48, draw: 0.34, away: 0.18 },
    rationale: '',
  };

  it('α=0 → ההצעה עם ה-EV הגבוה (כיוון)', () => {
    expect(recommendByRisk(split, 0, 'group')).toBe('tendency');
  });
  it('α=1 → דחיפה לבול', () => {
    expect(recommendByRisk(split, 1, 'group')).toBe('exact');
  });
  it('מונוטוני: סף שמעליו ממליץ בול', () => {
    expect(recommendByRisk(split, 0.2, 'group')).toBe('tendency');
    expect(recommendByRisk(split, 0.9, 'group')).toBe('exact');
  });
  it('התכנסות → תמיד בול ללא תלות ב-α', () => {
    expect(recommendByRisk({ ...split, converged: true }, 0, 'group')).toBe('exact');
  });
  it('חוסם α מחוץ לטווח [0,1]', () => {
    expect(recommendByRisk(split, -5, 'group')).toBe('tendency');
    expect(recommendByRisk(split, 5, 'group')).toBe('exact');
  });

  it('α=1 מגיע לבול גם במשחק עתיר-שערים עם פער-Pexact צר (חוזה החוגה)', () => {
    // λ=2.5/2.5 — התא המודאלי בעל Pexact נמוך אך הוא עדיין הבול; α=1 חייב להמליץ עליו.
    const hi = adviseFromLambdas(2.5, 2.5, 'group');
    expect(hi.converged).toBe(false);
    expect(recommendByRisk(hi, 1, 'group')).toBe('exact');
    expect(recommendByRisk(hi, 0, 'group')).toBe('tendency');
  });
});
