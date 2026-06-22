// העשרת המודיעין למסך המשחק (CLAUDE.md §9–§10): כושר, ממוצעי שערים, ראש-בראש,
// וניתוח סגל (התנהגות + "במרחק כרטיס מהשעיה" + שחקני מפתח). גבול → domain.
import type {
  FixtureItem,
  InjuryItem,
  LineupItem,
  OddsItem,
  PlayerItem,
  TeamStats,
} from '../api/schemas';
import { analyzeSquad, type SquadPlayer } from '../domain/engine/absences';
import { statusToState } from './stage';

export interface MarketProbs {
  home: number;
  draw: number;
  away: number;
}

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
  /** מערך משוער/רשמי, למשל "4-3-3" (כשפורסם). */
  formation?: string;
  /** הרכב פתיחה (שמות) — האות הכי חזק קרוב לפתיחה. */
  startXI?: string[];
  /** נעדרים ודאיים (פציעות/השעיות מ-/injuries, כשcoverage פעיל). */
  out?: string[];
}

/** קלט אופציונלי לבניית ההעשרה — הרכבים והיעדרויות שכבר חולקו לפי בית/חוץ. */
export interface EnrichExtras {
  homeLineup?: LineupItem;
  awayLineup?: LineupItem;
  homeInjuries?: InjuryItem[];
  awayInjuries?: InjuryItem[];
}

export interface MatchEnrichment {
  home: TeamEnrichment;
  away: TeamEnrichment;
  /** תוצאות ראש-בראש אחרונות, חדש→ישן. */
  h2h: string[];
  /** הסתברויות שוק (consensus סוכנויות, אחרי הסרת vig). */
  market?: MarketProbs;
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

export function teamEnrichment(
  stats: TeamStats,
  players: PlayerItem[],
  lineup?: LineupItem,
  injuries?: InjuryItem[],
): TeamEnrichment {
  const squad = analyzeSquad(toSquad(players));
  const startXI = (lineup?.startXI ?? [])
    .map((s) => s.player.name ?? '')
    .filter(Boolean);
  const out = (injuries ?? []).map((i) => i.player.name ?? '').filter(Boolean);
  return {
    form: stats.form ?? undefined,
    goalsForAvg: num(stats.goals?.for?.average?.total),
    goalsAgainstAvg: num(stats.goals?.against?.average?.total),
    conduct: squad.conduct,
    oneFromBan: squad.oneFromBan,
    keyPlayers: squad.topPlayers.map((p) => p.name).filter(Boolean),
    formation: lineup?.formation ?? undefined,
    startXI: startXI.length ? startXI : undefined,
    out: out.length ? out : undefined,
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

/**
 * הסתברויות שוק מ-consensus סוכנויות: לכל בוקמייקר ממירים את שוק ה-1X2
 * (Match Winner) להסתברויות מרומזות (1/יחס) ומסירים את ה-vig (נרמול לסכום 1),
 * ואז ממצעים על פני כל הסוכנויות. מחזיר undefined אם אין נתונים תקפים.
 */
export function marketProbs(items: OddsItem[]): MarketProbs | undefined {
  const item = items[0];
  if (!item) return undefined;
  const acc = { home: 0, draw: 0, away: 0 };
  let count = 0;
  for (const bm of item.bookmakers) {
    const mw = bm.bets.find((b) => b.id === 1 || b.name === 'Match Winner') ?? bm.bets[0];
    if (!mw) continue;
    const odd = (v: string) => num(mw.values.find((x) => x.value === v)?.odd);
    const h = odd('Home');
    const d = odd('Draw');
    const a = odd('Away');
    if (!h || !d || !a) continue;
    const ih = 1 / h;
    const id = 1 / d;
    const ia = 1 / a;
    const sum = ih + id + ia;
    if (sum <= 0) continue;
    acc.home += ih / sum;
    acc.draw += id / sum;
    acc.away += ia / sum;
    count += 1;
  }
  if (count === 0) return undefined;
  return { home: acc.home / count, draw: acc.draw / count, away: acc.away / count };
}

export function buildEnrichment(
  homeStats: TeamStats,
  homePlayers: PlayerItem[],
  awayStats: TeamStats,
  awayPlayers: PlayerItem[],
  h2h: FixtureItem[],
  odds: OddsItem[] = [],
  extras: EnrichExtras = {},
): MatchEnrichment {
  return {
    home: teamEnrichment(homeStats, homePlayers, extras.homeLineup, extras.homeInjuries),
    away: teamEnrichment(awayStats, awayPlayers, extras.awayLineup, extras.awayInjuries),
    h2h: h2hSummary(h2h),
    market: marketProbs(odds),
  };
}
