import { describe, expect, it } from 'vitest';
import type { QualNeed } from '../types';
import { applyStakesToLambdas, computeStakes, describeNeed } from './stakes';

function need(over: Partial<QualNeed>): QualNeed {
  return {
    team: { id: 1, name: 'A' },
    win: 'possible',
    draw: 'possible',
    loss: 'possible',
    mustWin: false,
    drawOk: true,
    thirdPlaceWatch: false,
    gdSensitive: false,
    ...over,
  };
}

describe('computeStakes', () => {
  it('חייבת ניצחון → מעלה את λ של המארחת ומפחיתה תיקו', () => {
    const s = computeStakes(
      need({ mustWin: true, draw: 'eliminated', loss: 'eliminated', drawOk: false }),
      need({}),
    );
    expect(s.homeMustWin).toBe(true);
    expect(s.lambdaHomeMul).toBeGreaterThan(1);
    expect(s.drawBias).toBeLessThan(0);
    expect(s.note).toContain('המארחת חייבת ניצחון');
  });

  it('תיקו מספיק לשתיהן → הטיית-תיקו חיובית ו-λ נמוך', () => {
    const s = computeStakes(need({ draw: 'guaranteed' }), need({ draw: 'guaranteed' }));
    expect(s.mutualDraw).toBe(true);
    expect(s.drawBias).toBeGreaterThan(0);
    expect(s.lambdaHomeMul).toBeLessThan(1);
  });

  it('משחק חסר-משמעות → deadRubber, λ יורד', () => {
    const fixed = need({ win: 'guaranteed', draw: 'guaranteed', loss: 'guaranteed' });
    const s = computeStakes(fixed, fixed);
    expect(s.deadRubber).toBe(true);
    expect(s.lambdaHomeMul).toBeLessThan(1);
  });

  it('applyStakesToLambdas מכפיל', () => {
    const s = computeStakes(
      need({ mustWin: true, draw: 'eliminated', loss: 'eliminated' }),
      need({}),
    );
    const { lambdaHome } = applyStakesToLambdas(1.5, 1, s);
    expect(lambdaHome).toBeCloseTo(1.5 * s.lambdaHomeMul, 10);
  });
});

describe('describeNeed', () => {
  it('"נצח ב-2+" כשנדרש מרווח', () => {
    expect(describeNeed(need({ mustWin: true, minWinMargin: 2 }))).toContain('ב-2+');
  });
  it('מודחת', () => {
    expect(describeNeed(need({ win: 'eliminated' }))).toContain('מודחת');
  });
});
