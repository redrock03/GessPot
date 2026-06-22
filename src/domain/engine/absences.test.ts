import { describe, expect, it } from 'vitest';
import {
  analyzeSquad,
  buildAbsenceImpact,
  conductFromCards,
  importanceOf,
  isOneFromBan,
  lambdaDeltaFromAbsences,
  suspensionStatus,
  type SquadPlayer,
} from './absences';

describe('conductFromCards', () => {
  it('ניקוד חתום: צהוב 1−, אדום 4−; יותר כרטיסים = נמוך יותר', () => {
    expect(conductFromCards(0, 0)).toBe(0);
    expect(conductFromCards(3, 0)).toBe(-3);
    expect(conductFromCards(2, 1)).toBe(-6);
    expect(conductFromCards(1, 0)).toBeGreaterThan(conductFromCards(5, 1));
  });
});

describe('suspensionStatus', () => {
  it('אדום → מושעה', () => expect(suspensionStatus(0, true)).toBe('banned'));
  it('צהוב בודד → במרחק כרטיס', () => expect(suspensionStatus(1, false)).toBe('oneFromBan'));
  it('נקי', () => expect(suspensionStatus(0, false)).toBe('clear'));
  it('isOneFromBan', () => expect(isOneFromBan(suspensionStatus(1, false))).toBe(true));
});

describe('lambdaDeltaFromAbsences', () => {
  it('אובדן שחקן מפתח מפחית λ', () => {
    expect(lambdaDeltaFromAbsences([{ importance: 1 }])).toBeLessThan(0);
  });
  it('אובדן מחליף זניח קרוב ל-0', () => {
    expect(lambdaDeltaFromAbsences([{ importance: 0.05 }])).toBeGreaterThan(-0.05);
  });
  it('רוויה — לא קורס מתחת ל-0.9−', () => {
    const many = Array.from({ length: 8 }, () => ({ importance: 1 }));
    expect(lambdaDeltaFromAbsences(many)).toBe(-0.9);
  });
});

describe('buildAbsenceImpact', () => {
  it('מרכיב AbsenceImpact עם lambdaDelta נגזר', () => {
    const imp = buildAbsenceImpact(
      { id: 1, name: 'A' },
      [{ name: 'חלוץ', reason: 'suspension', importance: 0.9 }],
      ['קשר'],
    );
    expect(imp.team.id).toBe(1);
    expect(imp.oneBookingFromBan).toEqual(['קשר']);
    expect(imp.lambdaDelta).toBeLessThan(0);
  });
});

const baseP: SquadPlayer = {
  name: '',
  yellow: 0,
  yellowred: 0,
  red: 0,
  minutes: 90,
  rating: 7,
  goals: 0,
  captain: false,
};

describe('analyzeSquad', () => {
  it('one-from-ban = שחקנים עם מספר צהובים אי-זוגי בלבד', () => {
    const a = analyzeSquad([
      { ...baseP, name: 'A', yellow: 1 },
      { ...baseP, name: 'B', yellow: 2 },
      { ...baseP, name: 'C', yellow: 0 },
      { ...baseP, name: 'D', yellow: 3 },
    ]);
    expect(a.oneFromBan).toEqual(['A', 'D']);
  });
  it('שחקן שכבר הורחק לא נספר כ-one-from-ban', () => {
    const a = analyzeSquad([{ ...baseP, name: 'A', yellow: 1, red: 1 }]);
    expect(a.oneFromBan).toEqual([]);
  });
  it('הרחקת צהוב-שני + צהוב טרי → עדיין במרחק כרטיס (3 צהובים, צהוב-שני אחד)', () => {
    const a = analyzeSquad([{ ...baseP, name: 'A', yellow: 3, yellowred: 1 }]);
    expect(a.oneFromBan).toEqual(['A']);
  });
  it('הרחקת צהוב-שני בלבד (2 צהובים) → לא במרחק כרטיס (המונה אופס)', () => {
    const a = analyzeSquad([{ ...baseP, name: 'A', yellow: 2, yellowred: 1 }]);
    expect(a.oneFromBan).toEqual([]);
  });
  it('conduct: הרחקת צהוב-שני = אדום עקיף 3− (לא 6−)', () => {
    const a = analyzeSquad([{ ...baseP, name: 'A', yellow: 2, yellowred: 1 }]);
    expect(a.conduct).toBe(-3);
  });
  it('conduct יורד עם יותר כרטיסים', () => {
    const clean = analyzeSquad([{ ...baseP, name: 'A' }]);
    const dirty = analyzeSquad([{ ...baseP, name: 'A', yellow: 3, red: 1 }]);
    expect(dirty.conduct).toBeLessThan(clean.conduct);
  });
  it('topPlayers ממוין יורד לפי חשיבות', () => {
    const a = analyzeSquad([
      { ...baseP, name: 'כוכב', rating: 8, goals: 3, captain: true },
      { ...baseP, name: 'ספסל', minutes: 5, rating: 6 },
    ]);
    expect(a.topPlayers[0].name).toBe('כוכב');
    expect(a.topPlayers[0].importance).toBeGreaterThan(a.topPlayers[1].importance);
  });
});

describe('importanceOf', () => {
  it('כוכב מוביל > ספסל', () => {
    const star = importanceOf({ ...baseP, minutes: 90, rating: 8, goals: 2, captain: true }, 90);
    const bench = importanceOf({ ...baseP, minutes: 10, rating: 6 }, 90);
    expect(star).toBeGreaterThan(bench);
    expect(star).toBeLessThanOrEqual(1);
  });
});
