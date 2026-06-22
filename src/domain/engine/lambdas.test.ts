import { describe, expect, it } from 'vitest';
import { buildMatrix, DEFAULT_RHO, outcomeProbs } from './poisson';
import { deriveLambdas, lambdasFromStrength, type OneXTwo } from './lambdas';

describe('deriveLambdas — שחזור אחוזי ה-API', () => {
  const cases: OneXTwo[] = [
    { home: 0.4, draw: 0.3, away: 0.3 },
    { home: 0.6, draw: 0.25, away: 0.15 },
    { home: 0.2, draw: 0.25, away: 0.55 },
    { home: 0.3, draw: 0.45, away: 0.25 },
    { home: 0.5, draw: 0.27, away: 0.23 },
  ];

  it.each(cases)('משחזר %o בתוך ~1 נקודת אחוז', (target) => {
    const { lambdaHome, lambdaAway } = deriveLambdas(target);
    const got = outcomeProbs(buildMatrix(lambdaHome, lambdaAway, DEFAULT_RHO));
    expect(got.home).toBeCloseTo(target.home, 2);
    expect(got.draw).toBeCloseTo(target.draw, 2);
    expect(got.away).toBeCloseTo(target.away, 2);
    expect(lambdaHome).toBeGreaterThan(0);
    expect(lambdaAway).toBeGreaterThan(0);
  });

  it('יתרון בית מובהק → λ_home > λ_away', () => {
    const { lambdaHome, lambdaAway } = deriveLambdas({ home: 0.65, draw: 0.2, away: 0.15 });
    expect(lambdaHome).toBeGreaterThan(lambdaAway);
  });

  it('מנרמל קלט שלא מסתכם ל-1', () => {
    const { lambdaHome, lambdaAway } = deriveLambdas({ home: 50, draw: 30, away: 20 });
    const got = outcomeProbs(buildMatrix(lambdaHome, lambdaAway, DEFAULT_RHO));
    expect(got.home).toBeCloseTo(0.5, 2);
  });
});

describe('lambdasFromStrength (fallback)', () => {
  it('יתרון בית לקבוצות שוות', () => {
    const eq = { attack: 1.4, defense: 1.2 };
    const { lambdaHome, lambdaAway } = lambdasFromStrength(eq, eq);
    expect(lambdaHome).toBeGreaterThan(lambdaAway);
  });

  it('תוקפת חזקה מול הגנה חלשה → λ גבוה', () => {
    const strong = lambdasFromStrength(
      { attack: 2.2, defense: 0.8 },
      { attack: 0.9, defense: 1.9 },
    );
    const weak = lambdasFromStrength({ attack: 0.9, defense: 1.9 }, { attack: 2.2, defense: 0.8 });
    expect(strong.lambdaHome).toBeGreaterThan(weak.lambdaHome);
  });
});
