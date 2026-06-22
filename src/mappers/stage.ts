// עזרי המרה משותפים: מחרוזת round → Stage, קוד סטטוס → מצב, ותווית בית.
import type { Stage } from '../domain/types';

/**
 * round של API-Football → Stage של הפול.
 * דוגמאות: "Group Stage - 1", "Round of 32", "Round of 16",
 * "Quarter-finals", "Semi-finals", "3rd Place Final", "Final".
 */
export function roundToStage(round: string): Stage {
  const r = round.toLowerCase();
  if (r.includes('group')) return 'group';
  if (r.includes('round of 32')) return 'r32';
  if (r.includes('round of 16')) return 'r16';
  if (r.includes('quarter')) return 'qf';
  if (r.includes('semi')) return 'sf';
  if (r.includes('3rd place') || r.includes('third place') || r.includes('play-off for 3rd'))
    return 'third';
  if (r.includes('final')) return 'final';
  // ברירת מחדל שמרנית — לא אמורה לקרות במונדיאל; נופל ל-group.
  return 'group';
}

const FINISHED = new Set(['FT', 'AET', 'PEN', 'WO', 'AWD']);
const LIVE = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP']);

/** קוד status.short → מצב המשחק שלנו. */
export function statusToState(short: string): 'scheduled' | 'live' | 'finished' {
  const s = short.toUpperCase();
  if (FINISHED.has(s)) return 'finished';
  if (LIVE.has(s)) return 'live';
  return 'scheduled';
}

/** "Group A" → "A"; שומר על הקלט אם אין קידומת. */
export function groupLabel(group: string): string {
  return group.replace(/^group\s+/i, '').trim();
}
