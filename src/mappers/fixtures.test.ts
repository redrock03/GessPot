import { describe, expect, it } from 'vitest';
import type { FixtureItem } from '../api/schemas';
import { mapFixture } from './fixtures';

function makeItem(over: {
  round?: string;
  short?: string;
  goals?: { home: number | null; away: number | null };
  fulltime?: { home: number | null; away: number | null };
}): FixtureItem {
  return {
    fixture: {
      id: 1,
      date: '2026-06-11T16:00:00+00:00',
      status: { short: over.short ?? 'FT' },
    },
    league: { id: 1, round: over.round ?? 'Group Stage - 1' },
    teams: {
      home: { id: 10, name: 'A' },
      away: { id: 20, name: 'B' },
    },
    goals: over.goals ?? { home: 1, away: 1 },
    score: { fulltime: over.fulltime },
  } as FixtureItem;
}

describe('mapFixture — תוצאת 90 דקות (CLAUDE.md §3)', () => {
  it('בנוקאאוט שהוכרע בהארכה — לוקח את ציון 90 הדקות מ-fulltime, לא את goals', () => {
    // 1-1 ב-90; 2-1 אחרי הארכה. הפול מנקד 1-1 (תיקו = כיוון).
    const f = mapFixture(
      makeItem({
        round: 'Round of 16',
        short: 'AET',
        goals: { home: 2, away: 1 },
        fulltime: { home: 1, away: 1 },
      }),
    );
    expect(f.stage).toBe('r16');
    expect(f.goalsHome).toBe(1);
    expect(f.goalsAway).toBe(1);
    expect(f.status).toBe('finished');
  });

  it('כשאין fulltime (משחק חי) — נופל ל-goals', () => {
    const f = mapFixture(
      makeItem({ short: '2H', goals: { home: 0, away: 1 }, fulltime: undefined }),
    );
    expect(f.status).toBe('live');
    expect(f.goalsHome).toBe(0);
    expect(f.goalsAway).toBe(1);
  });

  it('משחק עתידי — בלי תוצאה', () => {
    const f = mapFixture(
      makeItem({ short: 'NS', goals: { home: null, away: null }, fulltime: undefined }),
    );
    expect(f.status).toBe('scheduled');
    expect(f.goalsHome).toBeUndefined();
    expect(f.goalsAway).toBeUndefined();
  });
});
