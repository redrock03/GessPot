// מוטיבציה → התאמת λ ומסת-תיקו (CLAUDE.md §8/§11). מנוע טהור.
// קורא QualNeed (משערי ההעפלה) ומזהה מצבים המשנים התנהגות: חייבת-ניצחון, תיקו-הדדי, משחק-חסר-משמעות.
import type { QualNeed } from '../types';

export interface Stakes {
  homeMustWin: boolean;
  awayMustWin: boolean;
  /** תיקו מבטיח מקום 1-2 לשתיהן → משחק זהיר. */
  mutualDraw: boolean;
  /** לשתיהן התוצאה לא משנה את גורל ההעפלה → רוטציה/עצימות נמוכה. */
  deadRubber: boolean;
  lambdaHomeMul: number;
  lambdaAwayMul: number;
  /** הטיית-תיקו [-1..1]; >0 = יותר תיקו צפוי. */
  drawBias: number;
  /** תיאור עברי קצר למשתמש/לאנליסט. */
  note: string;
}

/** גורל ההעפלה (מקום 1-2) של הנבחרת אינו תלוי בתוצאת המשחק. */
function decided(n: QualNeed): boolean {
  return n.win === n.draw && n.draw === n.loss;
}

export function computeStakes(home?: QualNeed, away?: QualNeed): Stakes {
  const homeMustWin = home?.mustWin ?? false;
  const awayMustWin = away?.mustWin ?? false;
  const mutualDraw = home?.draw === 'guaranteed' && away?.draw === 'guaranteed';
  const deadRubber = !!home && !!away && decided(home) && decided(away);

  let lambdaHomeMul = 1;
  let lambdaAwayMul = 1;
  let drawBias = 0;
  const notes: string[] = [];

  if (deadRubber) {
    lambdaHomeMul *= 0.9;
    lambdaAwayMul *= 0.9;
    drawBias += 0.15;
    notes.push('משחק חסר-משמעות לשתי הנבחרות — צפויה רוטציה ועצימות נמוכה.');
  } else if (mutualDraw) {
    lambdaHomeMul *= 0.92;
    lambdaAwayMul *= 0.92;
    drawBias += 0.2;
    notes.push('תיקו מספיק לשתיהן — סיכוי גבוה למשחק זהיר.');
  } else {
    if (homeMustWin) {
      lambdaHomeMul *= 1.12;
      drawBias -= 0.08;
      notes.push('המארחת חייבת ניצחון.');
    }
    if (awayMustWin) {
      lambdaAwayMul *= 1.12;
      drawBias -= 0.08;
      notes.push('האורחת חייבת ניצחון.');
    }
  }

  return {
    homeMustWin,
    awayMustWin,
    mutualDraw,
    deadRubber,
    lambdaHomeMul,
    lambdaAwayMul,
    drawBias,
    note: notes.join(' '),
  };
}

/** מחיל את התאמת המוטיבציה על λ (למסלול הדטרמיניסטי). */
export function applyStakesToLambdas(
  lambdaHome: number,
  lambdaAway: number,
  s: Stakes,
): { lambdaHome: number; lambdaAway: number } {
  return { lambdaHome: lambdaHome * s.lambdaHomeMul, lambdaAway: lambdaAway * s.lambdaAwayMul };
}

/** משפט עברי המתאר מה הנבחרת צריכה — לכותרת ההצעות ולהזנת האנליסט. */
export function describeNeed(n?: QualNeed): string | undefined {
  if (!n) return undefined;
  if (decided(n) && n.win === 'guaranteed') return 'כבר מובטחת העפלה — אין לחץ.';
  if (n.win === 'eliminated') return 'מודחת — אין סיכוי העפלה.';
  if (n.mustWin) {
    return n.minWinMargin && n.minWinMargin > 1
      ? `חייבת לנצח ב-${n.minWinMargin}+ כדי להבטיח מקום 1-2.`
      : 'חייבת ניצחון כדי להעפיל.';
  }
  if (n.draw === 'guaranteed') return 'תיקו מבטיח מקום 1-2.';
  if (n.thirdPlaceWatch) return 'נאבקת על מקום 1-2; מקום שלישי משאיר תקווה במרוץ השלישיות.';
  return 'במאבק על העפלה.';
}
