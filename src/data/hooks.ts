// hooks של react-query — מחברים endpoints + mappers ומחזירים domain types בלבד.
import { useQuery } from '@tanstack/react-query';
import {
  getFixtures,
  getCurrentRound,
  getHeadToHead,
  getLeagueCoverage,
  getPrediction,
  getStandings,
  getTeamPlayers,
  getTeamStatistics,
} from '../api/endpoints';
import { getAnalystPrediction, type AnalystInput } from '../api/analyst';
import { adviseFromLambdas } from '../domain/engine/suggest';
import type { AnalystPrediction, MatchAdvice } from '../domain/types';
import { mapCoverage } from '../mappers/coverage';
import { buildEnrichment, type MatchEnrichment } from '../mappers/enrichment';
import { mapFixtures } from '../mappers/fixtures';
import { mapPrediction } from '../mappers/predictions';
import { mapStandings } from '../mappers/standings';

export const queryKeys = {
  coverage: ['coverage'] as const,
  standings: ['standings'] as const,
  fixtures: ['fixtures'] as const,
  currentRound: ['currentRound'] as const,
};

export function useCoverage() {
  return useQuery({
    queryKey: queryKeys.coverage,
    queryFn: async () => mapCoverage(await getLeagueCoverage()),
    staleTime: 60 * 60_000, // coverage כמעט קבוע — שעה
  });
}

export function useStandings() {
  return useQuery({
    queryKey: queryKeys.standings,
    queryFn: async () => mapStandings(await getStandings()),
  });
}

export function useFixtures() {
  return useQuery({
    queryKey: queryKeys.fixtures,
    queryFn: async () => mapFixtures(await getFixtures()),
  });
}

export function useCurrentRound() {
  return useQuery({
    queryKey: queryKeys.currentRound,
    queryFn: async () => (await getCurrentRound())[0] ?? null,
  });
}

/** בסיס 1X2 של ה-API למשחק (קלט לאנליסט). */
export function usePrediction(fixtureId: number | undefined) {
  return useQuery({
    queryKey: ['prediction', fixtureId],
    enabled: fixtureId !== undefined,
    staleTime: 30 * 60_000,
    queryFn: async () => mapPrediction(await getPrediction(fixtureId!)),
  });
}

/**
 * מודיעין מועשר לשתי הנבחרות (§9–§10): כושר, ממוצעי שערים, ראש-בראש,
 * וניתוח סגל (התנהגות + במרחק-כרטיס + שחקני מפתח). מזין את האנליסט ואת ה-UI.
 */
export function useMatchEnrichment(homeId: number | undefined, awayId: number | undefined) {
  return useQuery({
    queryKey: ['enrichment', homeId, awayId],
    enabled: homeId !== undefined && awayId !== undefined,
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<MatchEnrichment> => {
      // allSettled — כשל בקריאה אחת (coverage משתנה ממשחק למשחק, §7) מנוון רק את אותו חלק.
      const [hStats, aStats, h2h, hPlayers, aPlayers] = await Promise.allSettled([
        getTeamStatistics(homeId!),
        getTeamStatistics(awayId!),
        getHeadToHead(homeId!, awayId!),
        getTeamPlayers(homeId!),
        getTeamPlayers(awayId!),
      ]);
      const ok = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
        r.status === 'fulfilled' ? r.value : fallback;
      return buildEnrichment(
        ok(hStats, {}),
        ok(hPlayers, []),
        ok(aStats, {}),
        ok(aPlayers, []),
        ok(h2h, []),
      );
    },
  });
}

export interface MatchAdviceResult {
  prediction: AnalystPrediction;
  advice: MatchAdvice;
}

/**
 * המנוע ההיברידי מקצה-לקצה: אנליסט (Claude) → λ → מנוע טהור → שתי ההצעות.
 * מקבל `AnalystInput` מורכב (מסך Match יבנה אותו מה-hooks). null = מושבת.
 */
export function useMatchAdvice(input: AnalystInput | null) {
  return useQuery({
    // מפתח לפי המשחק + נוכחות מודיעין: אם ריצה קודמת נשמרה בלי העשרה (כשל enrichment),
    // הופעת form/h2h/סגל מאוחר יותר משנה את המפתח ומריצה מחדש עם הקלט המועשר.
    queryKey: [
      'matchAdvice',
      input?.fixture,
      { enriched: Boolean(input?.homeStats), pred: Boolean(input?.apiPrediction) },
    ],
    enabled: input !== null,
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<MatchAdviceResult> => {
      const prediction = await getAnalystPrediction(input!);
      const advice = adviseFromLambdas(
        prediction.expectedGoals.home,
        prediction.expectedGoals.away,
        input!.fixture.stage,
      );
      return { prediction, advice };
    },
  });
}
