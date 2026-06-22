// היסטוריה ומשחקי עבר (CLAUDE.md §9) → בסיס λ ועוצמה. מנוע טהור.
// כושר משוקלל לפי עדכניות *ולפי עוצמת היריב* (ניצחון על חלשה ≠ על מעצמה),
// + התאמות מגרש: גובה (מקסיקו סיטי ~2,240מ') ומנוחה.

export interface PastMatch {
  gf: number; // שערים בעד
  ga: number; // שערים נגד
  /** עוצמת היריב [0..1] (1 = מעצמה). */
  oppStrength: number;
  /** עדכניות — לפני כמה ימים. */
  daysAgo: number;
}

export interface TeamForm {
  /** ממוצע שערים בעד משוקלל. */
  attack: number;
  /** ממוצע שערים נגד משוקלל. */
  defense: number;
}

/**
 * כושר משוקלל → ממוצעי שערים בעד/נגד, משוקללים לפי עדכניות (דעיכה מעריכית)
 * ולפי עוצמת היריב (משחקים מול חזקים שוקלים יותר).
 */
export function weightedForm(matches: PastMatch[], halfLifeDays = 150): TeamForm {
  if (matches.length === 0) return { attack: 1.3, defense: 1.2 };
  let wSum = 0;
  let gfSum = 0;
  let gaSum = 0;
  for (const m of matches) {
    const recency = Math.pow(0.5, Math.max(0, m.daysAgo) / halfLifeDays);
    const strength = 0.6 + 0.8 * Math.max(0, Math.min(1, m.oppStrength));
    const w = recency * strength;
    wSum += w;
    gfSum += w * m.gf;
    gaSum += w * m.ga;
  }
  return { attack: gfSum / wSum, defense: gaSum / wSum };
}

export interface VenueContext {
  /** גובה המגרש במטרים (מקסיקו סיטי ~2,240). */
  altitudeM?: number;
  /** ימי מנוחה מאז המשחק הקודם. */
  restDays?: number;
}

/**
 * התאמת λ לגובה ולמנוחה (ייחודי ל-2026): גובה קיצוני מוריד מעט שערים (עייפות/אוויר דליל),
 * ומנוחה קצרה (<3 ימים) מורידה מעט עצימות.
 */
export function venueAdjust(lambda: number, ctx: VenueContext): number {
  let l = lambda;
  if (ctx.altitudeM && ctx.altitudeM > 1500) {
    l *= 1 - Math.min((ctx.altitudeM - 1500) / 1500, 1) * 0.08; // עד −8% בגובה קיצוני
  }
  if (ctx.restDays !== undefined && ctx.restDays < 3) {
    l *= 0.95; // עייפות ממנוחה קצרה
  }
  return l;
}

/** נטיית over/under מסגנון: ממוצע שערים גבוה → צפי לסך שערים גבוה. */
export function styleGoalBias(form: TeamForm): number {
  return form.attack + form.defense; // סך שערים צפוי במשחק טיפוסי של הקבוצה
}
