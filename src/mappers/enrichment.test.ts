import { describe, expect, it } from 'vitest';
import type { OddsItem } from '../api/schemas';
import { marketProbs } from './enrichment';

const oneBook = (h: string, d: string, a: string): OddsItem => ({
  bookmakers: [
    {
      bets: [
        {
          id: 1,
          name: 'Match Winner',
          values: [
            { value: 'Home', odd: h },
            { value: 'Draw', odd: d },
            { value: 'Away', odd: a },
          ],
        },
      ],
    },
  ],
});

describe('marketProbs', () => {
  it('ממיר יחסים להסתברויות מנורמלות', () => {
    const m = marketProbs([oneBook('2.0', '4.0', '4.0')])!;
    expect(m.home + m.draw + m.away).toBeCloseTo(1, 10);
    expect(m.home).toBeCloseTo(0.5, 10);
    expect(m.draw).toBeCloseTo(0.25, 10);
    expect(m.away).toBeCloseTo(0.25, 10);
  });

  it('מסיר vig — הסכום 1 גם כשהיחסים כוללים מרווח, וסדר הגודל נשמר', () => {
    const m = marketProbs([oneBook('1.45', '4.10', '7.30')])!;
    expect(m.home + m.draw + m.away).toBeCloseTo(1, 10);
    expect(m.home).toBeGreaterThan(m.draw);
    expect(m.draw).toBeGreaterThan(m.away);
  });

  it('ממצע על פני בוקמייקרים', () => {
    const both: OddsItem = {
      bookmakers: [
        ...oneBook('2.0', '4.0', '4.0').bookmakers,
        ...oneBook('1.5', '4.0', '7.0').bookmakers,
      ],
    };
    const m = marketProbs([both])!;
    expect(m.home + m.draw + m.away).toBeCloseTo(1, 10);
    expect(m.home).toBeGreaterThan(0.5); // שתי הסוכנויות מוטות-בית
  });

  it('undefined כשאין נתונים תקפים', () => {
    expect(marketProbs([])).toBeUndefined();
    expect(marketProbs([{ bookmakers: [] }])).toBeUndefined();
  });
});
