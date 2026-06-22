// היעדרויות, השעיות וכרטיסים (CLAUDE.md §10) + ציון התנהגות (§8). מנוע טהור.
import type { AbsenceImpact, TeamRef } from '../types';

// ============================================================
// ציון התנהגות (פייר-פליי) מכרטיסים — שובר שוויון #7 (§8).
// ניקוד **חתום** (גבוה/קרוב ל-0 = טוב): צהוב 1−, אדום עקיף (צהוב-שני) 3−, אדום ישיר 4−.
// ============================================================
export function conductFromCards(yellows: number, directReds: number, indirectReds = 0): number {
  const penalty =
    Math.max(0, yellows) * 1 + Math.max(0, directReds) * 4 + Math.max(0, indirectReds) * 3;
  return penalty === 0 ? 0 : -penalty;
}

// ============================================================
// חיזוי השעיות (§10) — 2 צהובים מצטברים = הרחקה למשחק הבא; אדום = הרחקה.
// ============================================================
export type SuspensionStatus = 'clear' | 'oneFromBan' | 'banned';

/**
 * סטטוס שחקן למשחק הקרוב.
 * `pendingYellows` = צהובים שנצברו מאז איפוס/הרחקה אחרונה; `bannedForNext` = הורחק למשחק הזה.
 * (הלוגיקה הכרונולוגית — איזה כרטיס בכל משחק — נעשית בשכבת הנתונים.)
 */
export function suspensionStatus(pendingYellows: number, bannedForNext: boolean): SuspensionStatus {
  if (bannedForNext) return 'banned';
  if (pendingYellows >= 1) return 'oneFromBan';
  return 'clear';
}

/** האם השחקן "במרחק כרטיס מהשעיה" (התרעה מרכזית של §10). */
export const isOneFromBan = (s: SuspensionStatus): boolean => s === 'oneFromBan';

// ============================================================
// היעדרויות → התאמת λ. שקלול חשיבות: אובדן שוער/חלוץ ראשון ≠ מחליף.
// importance ∈ [0..1] (1 = שחקן מפתח). אובדן מפתח ≈ −0.3 λ, עם רוויה.
// ============================================================
export function lambdaDeltaFromAbsences(out: Array<{ importance: number }>): number {
  const raw = out.reduce((sum, p) => sum + 0.3 * Math.max(0, Math.min(1, p.importance)), 0);
  return -Math.min(raw, 0.9); // רוויה — לא קורסים מתחת ל-λ סביר
}

export function buildAbsenceImpact(
  team: TeamRef,
  out: AbsenceImpact['out'],
  oneBookingFromBan: string[],
): AbsenceImpact {
  return { team, out, oneBookingFromBan, lambdaDelta: lambdaDeltaFromAbsences(out) };
}

// ============================================================
// ניתוח סגל מסטטיסטיקות שחקנים (/players) — חשיבות + משמעת.
// ============================================================
export interface SquadPlayer {
  name: string;
  yellow: number;
  yellowred: number; // הרחקות צהוב-שני
  red: number;
  minutes: number;
  rating: number;
  goals: number;
  captain: boolean;
}

export interface SquadAnalysis {
  /** ציון התנהגות הקבוצה (אומדן מסך הכרטיסים). */
  conduct: number;
  /** שחקנים "במרחק כרטיס מהשעיה" (מספר צהובים אי-זוגי). */
  oneFromBan: string[];
  /** השחקנים המשפיעים ביותר (לזיהוי "אובדן מפתח"). */
  topPlayers: Array<{ name: string; importance: number }>;
}

/** חשיבות שחקן [0..1] משילוב נוכחות, איכות (rating), קפטן ושערים. */
export function importanceOf(p: SquadPlayer, maxMinutes: number): number {
  const presence = maxMinutes > 0 ? p.minutes / maxMinutes : 0;
  const quality = Math.max(0, (p.rating - 6) / 2); // 6.0→0, 8.0→1
  const role = p.captain ? 0.15 : 0;
  const goalBoost = Math.min(p.goals * 0.06, 0.25);
  return Math.max(0, Math.min(1, 0.55 * presence + 0.3 * quality + role + goalBoost));
}

export function analyzeSquad(players: SquadPlayer[]): SquadAnalysis {
  const maxMin = Math.max(1, ...players.map((p) => p.minutes));
  let netYellows = 0; // צהובים שלא נצרכו בהרחקת צהוב-שני
  let directReds = 0;
  let indirectReds = 0;
  const oneFromBan: string[] = [];
  const scored: Array<{ name: string; importance: number }> = [];
  for (const p of players) {
    // כל הרחקת צהוב-שני (yellowred) צורכת זוג צהובים; הנותרים הם הצבירה "החיה".
    const pending = Math.max(0, p.yellow - 2 * p.yellowred);
    netYellows += pending;
    directReds += p.red;
    indirectReds += p.yellowred;
    scored.push({ name: p.name, importance: importanceOf(p, maxMin) });
    // צהוב בודד "תלוי" (פריטי) → במרחק כרטיס מהשעיה (אלא אם כבר הורחק באדום ישיר).
    if (p.red === 0 && pending % 2 === 1) oneFromBan.push(p.name);
  }
  scored.sort((a, b) => b.importance - a.importance);
  return {
    conduct: conductFromCards(netYellows, directReds, indirectReds),
    oneFromBan,
    topPlayers: scored.slice(0, 5),
  };
}
