import { describe, expect, it } from 'vitest';
import type { GroupRow } from '../types';
import {
  h2hResultsFromFixtures,
  qualNeeds,
  rankGroup,
  thirdsRace,
  type H2HResult,
} from './qualify';

function row(id: number, points: number, gf: number, ga: number, conduct = 0): GroupRow {
  return {
    team: { id, name: `T${id}` },
    group: 'A',
    rank: 0,
    played: 3,
    win: 0,
    draw: 0,
    lose: 0,
    goalsFor: gf,
    goalsAgainst: ga,
    points,
    conduct,
  };
}
const order = (rows: GroupRow[]) => rows.map((r) => r.team.id);

describe('rankGroup — סדר נקודות בסיסי', () => {
  it('ממיין יורד לפי נקודות', () => {
    const teams = [row(1, 3, 2, 2), row(2, 9, 7, 1), row(3, 6, 4, 3)];
    expect(order(rankGroup(teams, []))).toEqual([2, 3, 1]);
  });
});

describe('rankGroup — ראש-בראש תחילה (החידוש של 2026)', () => {
  it('ראש-בראש גובר על הפרש-שערים כללי', () => {
    // שתיהן 6 נק׳. ל-2 הפרש כללי הרבה יותר טוב (+5 מול +1), אבל 1 ניצחה 1-0 ישירות.
    // לפי 2026 (ראש-בראש תחילה) — 1 מעל 2. (לפי הכלל הישן של מונדיאל היה הפוך.)
    const teams = [row(1, 6, 3, 2), row(2, 6, 7, 2)];
    const h2h: H2HResult[] = [{ home: 1, away: 2, gh: 1, ga: 0 }];
    expect(order(rankGroup(teams, h2h))).toEqual([1, 2]);
  });

  it('תיקו בראש-בראש → נופלים להפרש-שערים כללי', () => {
    const teams = [row(1, 6, 3, 2), row(2, 6, 7, 2)]; // 2 עם הפרש כללי טוב יותר
    const h2h: H2HResult[] = [{ home: 1, away: 2, gh: 1, ga: 1 }];
    expect(order(rankGroup(teams, h2h))).toEqual([2, 1]);
  });
});

describe('rankGroup — שוויון שלוש נבחרות', () => {
  it('ראש-בראש (נקודות) מפריד את שלושתן', () => {
    // שלושתן 4 נק׳ כללי. מיני-ליגה: 1>2, 2>3, 1>3.
    const teams = [row(1, 4, 5, 5), row(2, 4, 5, 5), row(3, 4, 5, 5)];
    const h2h: H2HResult[] = [
      { home: 1, away: 2, gh: 1, ga: 0 },
      { home: 2, away: 3, gh: 1, ga: 0 },
      { home: 1, away: 3, gh: 1, ga: 0 },
    ];
    expect(order(rankGroup(teams, h2h))).toEqual([1, 2, 3]);
  });

  it('מעגל ראש-בראש (נקודות שוות) → הפרש ראש-בראש מכריע', () => {
    // 1 ניצחה 2 ב-3:0, 2 ניצחה 3 ב-1:0, 3 ניצחה 1 ב-1:0. כולן 3 נק׳ ראש-בראש.
    // הפרש ראש-בראש: 1=+2, 3=0, 2=−2 → 1,3,2.
    const teams = [row(1, 4, 9, 9), row(2, 4, 9, 9), row(3, 4, 9, 9)];
    const h2h: H2HResult[] = [
      { home: 1, away: 2, gh: 3, ga: 0 },
      { home: 2, away: 3, gh: 1, ga: 0 },
      { home: 3, away: 1, gh: 1, ga: 0 },
    ];
    expect(order(rankGroup(teams, h2h))).toEqual([1, 3, 2]);
  });

  it('הפרדה חלקית → מחשוב-מחדש לשתיים שנותרו (נופל לכללי)', () => {
    // 1 ניצחה את 2 ו-3 (נפרדת בראש); 2 ו-3 תיקו ביניהן → שוות בראש-בראש → כללי מכריע.
    // ל-2 הפרש כללי טוב יותר מ-3.
    const teams = [row(1, 4, 6, 2), row(2, 4, 4, 3), row(3, 4, 3, 5)];
    const h2h: H2HResult[] = [
      { home: 1, away: 2, gh: 2, ga: 0 },
      { home: 1, away: 3, gh: 2, ga: 0 },
      { home: 2, away: 3, gh: 1, ga: 1 },
    ];
    expect(order(rankGroup(teams, h2h))).toEqual([1, 2, 3]);
  });
});

describe('rankGroup — קריטריונים נמוכים בסולם', () => {
  it('ציון התנהגות מכריע כשהכול שווה', () => {
    // שתיהן שוות לגמרי חוץ מהתנהגות (גבוה=טוב). אין ראש-בראש.
    const teams = [row(1, 6, 4, 4, -3), row(2, 6, 4, 4, -1)];
    expect(order(rankGroup(teams, []))).toEqual([2, 1]);
  });

  it('דירוג פיפ"א מכריע כשגם ההתנהגות שווה', () => {
    const teams = [row(1, 6, 4, 4, -2), row(2, 6, 4, 4, -2)];
    const ranked = rankGroup(teams, [], { fifaRank: { 1: 5, 2: 12 } });
    expect(order(ranked)).toEqual([1, 2]); // דירוג 5 טוב מ-12
  });
});

// תרחישים אדוורסריים שנוצרו ע"י פאנל הסקירה, עם סדר נכון שחושב ביד לפי הסולם של §8.
// כל אחד מפיל מימוש נאיבי (GD-first, או ראש-בראש חד-מעברי ללא מחשוב-מחדש).
interface Scenario {
  name: string;
  teams: Array<{ id: number; points: number; gf: number; ga: number; conduct: number }>;
  h2h: H2HResult[];
  fifaRank?: Array<{ id: number; rank: number }>;
  expected: number[];
}
const SCENARIOS: Scenario[] = [
  {
    name: 'הפרדה חלקית באמצע טורניר — שתיים שנותרו טרם נפגשו → הפרש כללי (לא ראש-בראש מזוהם)',
    teams: [
      { id: 1, points: 4, gf: 3, ga: 1, conduct: 0 },
      { id: 2, points: 4, gf: 4, ga: 2, conduct: 0 },
      { id: 3, points: 4, gf: 2, ga: 3, conduct: 0 },
    ],
    h2h: [
      { home: 1, away: 2, gh: 2, ga: 0 },
      { home: 1, away: 3, gh: 1, ga: 0 },
    ],
    expected: [1, 2, 3],
  },
  {
    name: 'מוביל נפרד בנקודות; השתיים שנותרו תיקו ביניהן → הפרש כללי',
    teams: [
      { id: 1, points: 7, gf: 6, ga: 3, conduct: 0 },
      { id: 2, points: 7, gf: 4, ga: 4, conduct: 0 },
      { id: 3, points: 7, gf: 3, ga: 6, conduct: 0 },
    ],
    h2h: [
      { home: 1, away: 2, gh: 2, ga: 0 },
      { home: 1, away: 3, gh: 1, ga: 0 },
      { home: 2, away: 3, gh: 1, ga: 1 },
    ],
    expected: [1, 2, 3],
  },
  {
    name: 'מעגל ראש-בראש מוכרע בהפרש ראש-בראש',
    teams: [
      { id: 1, points: 4, gf: 9, ga: 9, conduct: 0 },
      { id: 2, points: 4, gf: 9, ga: 9, conduct: 0 },
      { id: 3, points: 4, gf: 9, ga: 9, conduct: 0 },
    ],
    h2h: [
      { home: 1, away: 2, gh: 3, ga: 0 },
      { home: 2, away: 3, gh: 1, ga: 0 },
      { home: 3, away: 1, gh: 1, ga: 0 },
    ],
    expected: [1, 3, 2],
  },
  {
    name: 'תיקו מלא בראש-בראש → התנהגות מכריעה (criterion 7)',
    teams: [
      { id: 1, points: 6, gf: 6, ga: 6, conduct: -5 },
      { id: 2, points: 6, gf: 6, ga: 6, conduct: -1 },
      { id: 3, points: 6, gf: 6, ga: 6, conduct: -3 },
    ],
    h2h: [
      { home: 1, away: 2, gh: 1, ga: 1 },
      { home: 2, away: 3, gh: 1, ga: 1 },
      { home: 3, away: 1, gh: 1, ga: 1 },
    ],
    expected: [2, 3, 1],
  },
  {
    name: 'ראש-בראש גובר על הפרש כללי (2 נבחרות, בית מלא)',
    teams: [
      { id: 1, points: 6, gf: 3, ga: 1, conduct: 0 },
      { id: 2, points: 6, gf: 7, ga: 1, conduct: 0 },
      { id: 4, points: 4, gf: 2, ga: 5, conduct: 0 },
      { id: 3, points: 1, gf: 1, ga: 6, conduct: 0 },
    ],
    h2h: [
      { home: 1, away: 2, gh: 1, ga: 0 },
      { home: 1, away: 3, gh: 2, ga: 0 },
      { home: 1, away: 4, gh: 0, ga: 1 },
      { home: 2, away: 3, gh: 3, ga: 0 },
      { home: 2, away: 4, gh: 4, ga: 0 },
      { home: 3, away: 4, gh: 1, ga: 1 },
    ],
    expected: [1, 2, 4, 3],
  },
  {
    name: 'מעגל ראש-בראש של שלוש → הפרש כללי (ראש-בראש לא יכול להפריד)',
    teams: [
      { id: 1, points: 6, gf: 6, ga: 1, conduct: 0 },
      { id: 2, points: 6, gf: 3, ga: 1, conduct: 0 },
      { id: 3, points: 6, gf: 2, ga: 1, conduct: 0 },
      { id: 4, points: 0, gf: 0, ga: 8, conduct: 0 },
    ],
    h2h: [
      { home: 1, away: 2, gh: 1, ga: 0 },
      { home: 2, away: 3, gh: 1, ga: 0 },
      { home: 3, away: 1, gh: 1, ga: 0 },
      { home: 1, away: 4, gh: 5, ga: 0 },
      { home: 2, away: 4, gh: 2, ga: 0 },
      { home: 3, away: 4, gh: 1, ga: 0 },
    ],
    expected: [1, 2, 3, 4],
  },
  {
    name: 'מחשוב-מחדש לזוג שנותר (הטבלה המלאה משווה, משחק הראש מפריד)',
    teams: [
      { id: 2, points: 4, gf: 6, ga: 5, conduct: 0 },
      { id: 1, points: 4, gf: 7, ga: 7, conduct: 0 },
      { id: 4, points: 4, gf: 7, ga: 7, conduct: 0 },
      { id: 3, points: 4, gf: 7, ga: 8, conduct: 0 },
    ],
    h2h: [
      { home: 1, away: 2, gh: 1, ga: 3 },
      { home: 1, away: 3, gh: 2, ga: 2 },
      { home: 1, away: 4, gh: 4, ga: 2 },
      { home: 2, away: 3, gh: 2, ga: 3 },
      { home: 2, away: 4, gh: 1, ga: 1 },
      { home: 3, away: 4, gh: 2, ga: 4 },
    ],
    expected: [2, 1, 4, 3],
  },
  {
    name: 'תיקו מלא בארבע → התנהגות (גבוה=טוב)',
    teams: [
      { id: 1, points: 3, gf: 5, ga: 5, conduct: -2 },
      { id: 2, points: 3, gf: 5, ga: 5, conduct: -5 },
      { id: 3, points: 3, gf: 6, ga: 4, conduct: -1 },
      { id: 4, points: 3, gf: 4, ga: 6, conduct: -8 },
    ],
    h2h: [
      { home: 1, away: 2, gh: 1, ga: 1 },
      { home: 3, away: 4, gh: 1, ga: 1 },
      { home: 1, away: 3, gh: 1, ga: 1 },
      { home: 2, away: 4, gh: 1, ga: 1 },
      { home: 1, away: 4, gh: 1, ga: 1 },
      { home: 2, away: 3, gh: 1, ga: 1 },
    ],
    expected: [3, 1, 2, 4],
  },
  {
    name: 'הפרדה חלקית למעלה; הזוג התחתון נופל דרך התנהגות שווה לדירוג פיפ"א',
    teams: [
      { id: 1, points: 4, gf: 4, ga: 1, conduct: -2 },
      { id: 2, points: 4, gf: 3, ga: 3, conduct: -4 },
      { id: 3, points: 4, gf: 3, ga: 3, conduct: -4 },
    ],
    h2h: [
      { home: 1, away: 2, gh: 1, ga: 0 },
      { home: 1, away: 3, gh: 1, ga: 0 },
      { home: 2, away: 3, gh: 0, ga: 0 },
    ],
    fifaRank: [
      { id: 2, rank: 9 },
      { id: 3, rank: 20 },
    ],
    expected: [1, 2, 3],
  },
  {
    name: 'מלכודת כיוון-סימן של התנהגות בבית מלא (ניקוד חתום, גבוה=טוב)',
    teams: [
      { id: 1, points: 3, gf: 6, ga: 2, conduct: -3 },
      { id: 2, points: 3, gf: 3, ga: 3, conduct: -1 },
      { id: 3, points: 3, gf: 3, ga: 3, conduct: -7 },
      { id: 4, points: 3, gf: 1, ga: 5, conduct: 0 },
    ],
    h2h: [
      { home: 1, away: 2, gh: 1, ga: 1 },
      { home: 3, away: 4, gh: 1, ga: 1 },
      { home: 1, away: 3, gh: 1, ga: 1 },
      { home: 2, away: 4, gh: 1, ga: 1 },
      { home: 1, away: 4, gh: 1, ga: 1 },
      { home: 2, away: 3, gh: 1, ga: 1 },
    ],
    expected: [1, 2, 3, 4],
  },
];

describe('rankGroup — תרחישים אדוורסריים (פאנל סקירה, סדר מחושב-ביד לפי §8)', () => {
  it.each(SCENARIOS)('$name', (sc) => {
    const teams = sc.teams.map((t) => row(t.id, t.points, t.gf, t.ga, t.conduct));
    const fifaRank = sc.fifaRank?.reduce<Record<number, number>>((m, r) => {
      m[r.id] = r.rank;
      return m;
    }, {});
    expect(order(rankGroup(teams, sc.h2h, fifaRank ? { fifaRank } : {}))).toEqual(sc.expected);
  });
});

describe('qualNeeds — שערי ההעפלה (סבב אחרון)', () => {
  // לפני הסבב האחרון: A,B,C כולן 4 נק׳, D עם 0. נותרו: A-B ו-C-D.
  const teams = [row(1, 4, 3, 1), row(2, 4, 3, 2), row(3, 4, 2, 2), row(4, 0, 0, 3)];
  const remaining = [
    { home: 1, away: 2 },
    { home: 3, away: 4 },
  ];
  const needs = qualNeeds(teams, remaining, []);
  const need = (id: number) => needs.find((n) => n.team.id === id)!;

  it('A: ניצחון מבטיח מקום 1-2; תיקו עדיין אפשרי; לא "חייבת ניצחון"', () => {
    expect(need(1).win).toBe('guaranteed');
    expect(need(1).drawOk).toBe(true);
    expect(need(1).mustWin).toBe(false);
  });

  it('A: רגיש להפרש-שערים (הגבול נחתך בשוויון-נקודות)', () => {
    expect(need(1).gdSensitive).toBe(true);
  });

  it('D (0 נק׳): מודחת — לא יכולה להגיע למקום 1-2, ואינה במרוץ השלישיות של הבית', () => {
    expect(need(4).win).toBe('eliminated');
    expect(need(4).draw).toBe('eliminated');
    expect(need(4).loss).toBe('eliminated');
    expect(need(4).thirdPlaceWatch).toBe(false);
  });

  it('מחזיר QualNeed לכל ארבע הנבחרות', () => {
    expect(needs).toHaveLength(4);
  });
});

describe('thirdsRace — מרוץ השלישיות (קו-חתך 8/9)', () => {
  it('8 השלישיות הטובות עוברות, 4 התחתונות בחוץ', () => {
    const thirds = Array.from({ length: 12 }, (_, i) => row(i + 1, 12 - i, 12 - i, 0));
    const race = thirdsRace(thirds);
    expect(race.qualified).toHaveLength(8);
    expect(race.out).toHaveLength(4);
    expect(race.cutIndex).toBe(8);
    expect(race.qualified.map((r) => r.team.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('שובר שוויון בנקודות לפי הפרש כללי (ללא ראש-בראש)', () => {
    const thirds = [row(1, 3, 2, 4), row(2, 3, 5, 1), row(3, 3, 3, 3)];
    const race = thirdsRace(thirds);
    expect(race.ranked.map((r) => r.team.id)).toEqual([2, 3, 1]); // GD +4, 0, -2
  });
});

describe('h2hResultsFromFixtures', () => {
  it('לוקח רק משחקים גמורים בין נבחרות הבית', () => {
    const fx = [
      { status: 'finished', home: { id: 1 }, away: { id: 2 }, goalsHome: 2, goalsAway: 1 },
      { status: 'finished', home: { id: 1 }, away: { id: 9 }, goalsHome: 0, goalsAway: 0 }, // 9 לא בבית
      { status: 'scheduled', home: { id: 2 }, away: { id: 3 } }, // לא גמור
    ];
    const res = h2hResultsFromFixtures(fx, new Set([1, 2, 3]));
    expect(res).toEqual([{ home: 1, away: 2, gh: 2, ga: 1 }]);
  });
});
