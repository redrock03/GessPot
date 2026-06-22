import { describe, expect, it } from 'vitest';
import type { StandingsItem } from '../api/schemas';
import { isRealGroup, mapStandings } from './standings';

function row(group: string, id: number, name: string, rank: number) {
  return {
    rank,
    team: { id, name },
    points: 0,
    goalsDiff: 0,
    group,
    all: { played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } },
  };
}

describe('isRealGroup', () => {
  it('מזהה בתים אמיתיים A–L', () => {
    expect(isRealGroup('Group A')).toBe(true);
    expect(isRealGroup('Group L')).toBe(true);
  });
  it('דוחה את טבלת-הצבירה של מרוץ השלישיות', () => {
    expect(isRealGroup('Group Stage')).toBe(false);
  });
});

describe('mapStandings — מתעלם מטבלת מרוץ השלישיות (תת-מערך 13)', () => {
  const items: StandingsItem[] = [
    {
      league: {
        id: 1,
        standings: [
          [row('Group A', 16, 'Mexico', 1), row('Group A', 17, 'South Korea', 2)],
          [row('Group B', 7, 'Canada', 1)],
          // טבלת הצבירה — תווית "Group Stage", שחקנים שכבר הופיעו בבתים
          [row('Group Stage', 17, 'South Korea', 3), row('Group Stage', 99, 'Sweden', 4)],
        ],
      },
    } as StandingsItem,
  ];

  const rows = mapStandings(items);

  it('כולל רק שורות מבתים אמיתיים', () => {
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.group === 'A' || r.group === 'B')).toBe(true);
  });

  it('אין בית "Stage" מזוייף', () => {
    expect(rows.some((r) => r.group === 'Stage')).toBe(false);
  });
});
