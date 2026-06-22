import { describe, expect, it } from 'vitest';
import { styleGoalBias, venueAdjust, weightedForm, type PastMatch } from './history';

describe('weightedForm', () => {
  it('ברירת מחדל סבירה כשאין משחקים', () => {
    const f = weightedForm([]);
    expect(f.attack).toBeGreaterThan(0);
    expect(f.defense).toBeGreaterThan(0);
  });

  it('משחקים עדכניים שוקלים יותר מישנים', () => {
    const recent: PastMatch[] = [
      { gf: 3, ga: 0, oppStrength: 0.5, daysAgo: 5 },
      { gf: 0, ga: 0, oppStrength: 0.5, daysAgo: 600 },
    ];
    // ה-3-0 העדכני מושך את ההתקפה כלפי מעלה
    expect(weightedForm(recent).attack).toBeGreaterThan(2);
  });

  it('ניצחון על יריב חזק שוקל יותר', () => {
    const vsStrong = weightedForm([{ gf: 2, ga: 0, oppStrength: 1, daysAgo: 10 }]);
    const vsWeak = weightedForm([{ gf: 2, ga: 0, oppStrength: 0, daysAgo: 10 }]);
    // שני המקרים נותנים ממוצע 2 (משחק יחיד), אבל המשקל גבוה יותר מול חזק — נבדק דרך שילוב
    const mix = weightedForm([
      { gf: 4, ga: 0, oppStrength: 1, daysAgo: 10 }, // מול חזק
      { gf: 0, ga: 0, oppStrength: 0, daysAgo: 10 }, // מול חלש
    ]);
    expect(mix.attack).toBeGreaterThan(2); // המשחק מול החזק מושך כלפי מעלה
    expect(vsStrong.attack).toBeCloseTo(vsWeak.attack, 5); // משחק יחיד → אותו ממוצע
  });
});

describe('venueAdjust', () => {
  it('גובה קיצוני מוריד λ', () => {
    expect(venueAdjust(1.5, { altitudeM: 2240 })).toBeLessThan(1.5);
  });
  it('מנוחה קצרה מורידה λ', () => {
    expect(venueAdjust(1.5, { restDays: 2 })).toBeLessThan(1.5);
  });
  it('ללא הקשר — ללא שינוי', () => {
    expect(venueAdjust(1.5, {})).toBe(1.5);
  });
});

describe('styleGoalBias', () => {
  it('סך שערים צפוי = התקפה + הגנה', () => {
    expect(styleGoalBias({ attack: 1.6, defense: 1.1 })).toBeCloseTo(2.7, 10);
  });
});
