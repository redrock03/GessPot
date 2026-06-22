// שיטת הניקוד של הפול (CLAUDE.md §3). כל המשחקים מנוקדים לפי תוצאת 90 דקות בלבד.
import type { Stage } from './types';

export interface StageScoring {
  /** ניקוד על כיוון נכון (תוצאה 1X2). */
  tendency: number;
  /** ניקוד על בול (תוצאה מדויקת). */
  exact: number;
}

export const SCORING: Record<Stage, StageScoring> = {
  group: { tendency: 1, exact: 3 }, // יחס 3:1 — רודף בול אגרסיבי יותר
  r32: { tendency: 2, exact: 4 }, // 2:1
  r16: { tendency: 3, exact: 6 }, // 2:1
  qf: { tendency: 4, exact: 8 }, // 2:1
  sf: { tendency: 5, exact: 10 }, // 2:1
  third: { tendency: 5, exact: 10 }, // משחק מקום 3/4
  final: { tendency: 6, exact: 12 }, // 2:1
};

/** בונוסים נעולים בפול — מחוץ לסקופ, כאן לתיעוד בלבד (CLAUDE.md §2/§3). */
export const LOCKED_BONUSES = { champion: 10, runnerUp: 5, topScorer: 10 } as const;

/** נקודות הבול הזמינות בשלב — מדד "ערך המשחק" לטבלה (CLAUDE.md §3). */
export function matchValue(stage: Stage): number {
  return SCORING[stage].exact;
}

/** משחק ערך-גבוה: סף נקודות בול ≥ 6 (שמינית ומעלה). */
export function isHighValueStage(stage: Stage): boolean {
  return SCORING[stage].exact >= 6;
}
