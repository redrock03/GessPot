// הצעת כיוון + הצעת בול (CLAUDE.md §4). מנוע טהור.
import type { MatchAdvice, Outcome, Stage, Suggestion } from '../types';
import { SCORING } from '../scoring';
import { buildMatrix, DEFAULT_RHO, outcomeProbs, type ScoreMatrix } from './poisson';
import { deriveLambdas, type OneXTwo } from './lambdas';

function outcomeOf(i: number, j: number): Outcome {
  if (i > j) return 'home';
  if (i === j) return 'draw';
  return 'away';
}

const OUTCOME_HE: Record<Outcome, string> = { home: 'בית', draw: 'תיקו', away: 'חוץ' };
const pct = (p: number): number => Math.round(p * 100);

/**
 * נגזרות שתי ההצעות ממטריצת תוצאות M ונקודות השלב (T,E):
 *   הצעת בול   = argmax_s Pexact(s)               (התא המודאלי)
 *   הצעת כיוון = o*=argmax_o pOut(o); ואז argmax_{s∈o*} M[s]
 *   EV(s)      = E·Pexact(s) + T·(Pout(s) − Pexact(s))
 */
export function suggest(matrix: ScoreMatrix, stage: Stage): MatchAdvice {
  const { tendency: T, exact: E } = SCORING[stage];
  const pOut = outcomeProbs(matrix);

  // הכיוון הסביר ביותר
  let bestOut: Outcome = 'home';
  let bestOutP = -1;
  (['home', 'draw', 'away'] as const).forEach((o) => {
    if (pOut[o] > bestOutP) {
      bestOutP = pOut[o];
      bestOut = o;
    }
  });

  let exactI = 0;
  let exactJ = 0;
  let exactP = -1;
  let tendI = 0;
  let tendJ = 0;
  let tendP = -1;

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      const p = matrix[i][j];
      if (p > exactP) {
        exactP = p;
        exactI = i;
        exactJ = j;
      }
      if (outcomeOf(i, j) === bestOut && p > tendP) {
        tendP = p;
        tendI = i;
        tendJ = j;
      }
    }
  }

  const mk = (kind: Suggestion['kind'], i: number, j: number): Suggestion => {
    const pExact = matrix[i][j];
    const pOutcome = pOut[outcomeOf(i, j)];
    return {
      kind,
      score: { home: i, away: j },
      pExact,
      pOutcome,
      ev: E * pExact + T * (pOutcome - pExact),
    };
  };

  const exactPick = mk('exact', exactI, exactJ);
  const tendencyPick = mk('tendency', tendI, tendJ);
  const converged = exactI === tendI && exactJ === tendJ;

  const rationale = converged
    ? `שתי ההצעות מתלכדות על ${tendI}–${tendJ} (${OUTCOME_HE[bestOut]}, ${pct(bestOutP)}%) — ביטחון גבוה.`
    : `כיוון בטוח: ${OUTCOME_HE[bestOut]} (${pct(bestOutP)}%) עם ${tendI}–${tendJ}. ` +
      `בול סביר יותר: ${exactI}–${exactJ} (${pct(exactP)}%). ` +
      `רדיפת הבול מעלה את התקרה אך מורידה מעט EV.`;

  return { tendencyPick, exactPick, converged, outcomeProb: pOut, rationale };
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

/**
 * חוגת-סיכון (§4): α∈[0,1] משלבת בין הכיוון הבטוח (EV מרבי) לבול (תקרה מרבית).
 * ערך משוקלל = (1−α)·EV + α·E·Pexact: α=0 → ההצעה עם ה-EV הגבוה (בטוח);
 * α=1 → איבר ה-EV נעלם ונותר E·Pexact → תמיד הבול (התא עם ה-Pexact הגבוה). מונוטוני בין השניים.
 * כשהשתיים מתלכדות — תמיד בול (הוא "חינם").
 */
export function recommendByRisk(
  advice: MatchAdvice,
  alpha: number,
  stage: Stage,
): Suggestion['kind'] {
  if (advice.converged) return 'exact';
  const a = clamp01(alpha);
  const { exact: E } = SCORING[stage];
  const blended = (s: Suggestion): number => (1 - a) * s.ev + a * E * s.pExact;
  return blended(advice.exactPick) >= blended(advice.tendencyPick) ? 'exact' : 'tendency';
}

/** נוחות ל-M3: אחוזי 1X2 (מ-/predictions) → כיול λ → מטריצה → שתי ההצעות. */
export function adviseFrom1x2(target: OneXTwo, stage: Stage, rho = DEFAULT_RHO): MatchAdvice {
  const { lambdaHome, lambdaAway } = deriveLambdas(target, { rho });
  return suggest(buildMatrix(lambdaHome, lambdaAway, rho), stage);
}

/**
 * מסלול האנליסט (Claude): שערים צפויים (λ) ישירות → מטריצה → שתי ההצעות.
 * זה החיבור של מנוע ה-LLM ההיברידי — הפלט שלו (expectedGoals) נכנס למתמטיקה הטהורה,
 * וה-EV/ההתכנסות נגזרים כרגיל (CLAUDE.md §4/§11).
 */
export function adviseFromLambdas(
  lambdaHome: number,
  lambdaAway: number,
  stage: Stage,
  rho = DEFAULT_RHO,
): MatchAdvice {
  return suggest(buildMatrix(lambdaHome, lambdaAway, rho), stage);
}
