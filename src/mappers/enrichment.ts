// העשרת המודיעין למסך המשחק (CLAUDE.md §9–§10): כושר, ממוצעי שערים, ראש-בראש,
// וניתוח סגל (התנהגות + "במרחק כרטיס מהשעיה" + שחקני מפתח). גבול → domain.
import type { FixtureItem, PlayerItem, TeamStats } from '../api/schemas';
import { analyzeSquad, type SquadPlayer } from '../domain/engine/absences';
import { statusToState } from './stage';

export interface TeamEnrichment {
  /** מחרוזת כושר אחרונה, למשל "WWDLW". */
  form?: string;
  goalsForAvg?: number;
  goalsAgainstAvg?: number;
  conduct: number;
  /** שחקנים במרחק כרטיס מהשעיה. */
  oneFromBan: string[];
  /** שמות השחקנים המשפיעים ביותר. */
  keyPlayers: string[];
}

export interface MatchEnrichment {
  home: TeamEnrichment;
  away: TeamEnrichment;
  /** תוצאות ראש-בראש אחרונות, חדש→ישן. */
  h2h: string[];
}

const num = (s?: string | null): number | undefined => {
  if (s == null) return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
};

function toSquad(players: PlayerItem[]): SquadPlayer[] {
  return players.map((p) => {
    const s = p.statistics?.[0];
    return {
      name: p.player.name ?? '',
      yellow: s?.cards?.yellow ?? 0,
      yellowred: s?.cards?.yellowred ?? 0,
      red: s?.cards?.red ?? 0,
      minutes: s?.games?.minutes ?? 0,
      rating: num(s?.games?.rating) ?? 0,
      goals: s?.goals?.total ?? 0,
      captain: s?.games?.captain ?? false,
    };
  });
}

export function teamEnrichment(stats: TeamStats, players: PlayerItem[]): TeamEnrichment {
  const squad = analyzeSquad(toSquad(players));
  return {
    form: stats.form ?? undefined,
    goalsForAvg: num(stats.goals?.for?.average?.total),
    goalsAgainstAvg: num(stats.goals?.against?.average?.total),
    conduct: squad.conduct,
    oneFromBan: squad.oneFromBan,
    keyPlayers: squad.topPlayers.map((p) => p.name).filter(Boolean),
  };
}

export function h2hSummary(fixtures: FixtureItem[], limit = 5): string[] {
  return fixtures
    .filter(
      (f) =>
        statusToState(f.fixture.status.short) === 'finished' &&
        f.goals.home != null &&
        f.goals.away != null,
    )
    .sort((a, b) => b.fixture.date.localeCompare(a.fixture.date))
    .slice(0, limit)
    .map(
      (f) =>
        `${f.teams.home.name} ${f.goals.home}–${f.goals.away} ${f.teams.away.name} (${f.fixture.date.slice(0, 4)})`,
    );
}

export function buildEnrichment(
  homeStats: TeamStats,
  homePlayers: PlayerItem[],
  awayStats: TeamStats,
  awayPlayers: PlayerItem[],
  h2h: FixtureItem[],
): MatchEnrichment {
  return {
    home: teamEnrichment(homeStats, homePlayers),
    away: teamEnrichment(awayStats, awayPlayers),
    h2h: h2hSummary(h2h),
  };
}
