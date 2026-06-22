// מודלי הליבה (CLAUDE.md §12). טיפוסי domain בלבד — לא תלויים ב-API או ב-UI.

export type Outcome = 'home' | 'draw' | 'away';

export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';

export interface TeamRef {
  id: number;
  name: string;
  logo?: string;
}

export interface GroupRow {
  team: TeamRef;
  group: string;
  rank: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  /** ציון התנהגות (פייר-פליי) — שובר שוויון בסולם 2026. */
  conduct: number;
}

export interface Fixture {
  id: number;
  group?: string;
  stage: Stage;
  kickoff: string;
  home: TeamRef;
  away: TeamRef;
  status: 'scheduled' | 'live' | 'finished';
  goalsHome?: number;
  goalsAway?: number;
}

export interface Suggestion {
  kind: 'tendency' | 'exact';
  score: { home: number; away: number };
  pExact: number;
  pOutcome: number;
  ev: number;
}

export interface MatchAdvice {
  tendencyPick: Suggestion;
  exactPick: Suggestion;
  /** השתיים מתלכדות → דגל ביטחון גבוה. */
  converged: boolean;
  outcomeProb: { home: number; draw: number; away: number };
  rationale: string;
}

export interface QualNeed {
  team: TeamRef;
  win: 'guaranteed' | 'possible' | 'eliminated';
  draw: 'guaranteed' | 'possible' | 'eliminated';
  loss: 'guaranteed' | 'possible' | 'eliminated';
  mustWin: boolean;
  drawOk: boolean;
  /** "נצח ב-2+". */
  minWinMargin?: number;
  thirdPlaceWatch: boolean;
  /** דגל רגישות הפרש-שערים / ראש-בראש. */
  gdSensitive: boolean;
}

export interface AbsenceImpact {
  team: TeamRef;
  out: Array<{ name: string; reason: 'injury' | 'suspension'; importance: number }>;
  oneBookingFromBan: string[];
  lambdaDelta: number;
}

/**
 * פלט האנליסט (Claude LLM) — המנוע ההיברידי (§4 ב-CLAUDE.md / מנוע 0).
 * Claude סורק את כל הסטטיסטיקות המתקדמות ומחזיר תחזית מכוילת ומובנית;
 * `expectedGoals` (λ) מוזן ישירות למתמטיקה הטהורה (`adviseFromLambdas`) שגוזרת
 * את שתי ההצעות + EV. שאר השדות לתצוגה/שקיפות.
 */
export interface AnalystPrediction {
  /** הסתברויות 1X2 מכוילות (0..1, סכום ~1). */
  oneXtwo: { home: number; draw: number; away: number };
  /** שערים צפויים לכל צד (λ) — הקלט למטריצה. */
  expectedGoals: { home: number; away: number };
  confidence: 'low' | 'medium' | 'high';
  /** הגורמים המרכזיים שהניעו את התחזית (עברית). */
  keyFactors: string[];
  /** נימוק קצר בעברית. */
  rationale: string;
}
