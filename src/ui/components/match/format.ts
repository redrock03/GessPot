// עזרי פורמט משותפים למסך המשחק. כל מספר ב-mono+tabular-nums (DESIGN.md §3).
import type { Outcome } from '../../../domain/types';

export const pct = (p: number): string => `${Math.round(p * 100)}%`;
export const ev2 = (x: number): string => x.toFixed(2);

export function outcomeOf(home: number, away: number): Outcome {
  return home > away ? 'home' : home === away ? 'draw' : 'away';
}

export const OUTCOME_HE: Record<Outcome, string> = {
  home: 'ניצחון בית',
  draw: 'תיקו',
  away: 'ניצחון חוץ',
};

/** מחזיר את שם הצד המנצח לפי התוצאה, או "תיקו". */
export function outcomeSideName(
  home: number,
  away: number,
  homeName: string,
  awayName: string,
): string {
  if (home > away) return homeName;
  if (home < away) return awayName;
  return 'תיקו';
}
