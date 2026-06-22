// תשובת /leagues גולמית → דגלי coverage (CLAUDE.md §7). בודקים לפני endpoints תלויי-coverage.
import type { LeagueItem } from '../api/schemas';
import { WORLD_CUP } from '../config';

export interface Coverage {
  standings: boolean;
  predictions: boolean;
  odds: boolean;
  injuries: boolean;
  lineups: boolean;
  statistics: boolean;
  events: boolean;
}

export function mapCoverage(items: LeagueItem[]): Coverage {
  const seasons = items[0]?.seasons ?? [];
  const season = seasons.find((s) => s.year === WORLD_CUP.season) ?? seasons[0];
  const c = season?.coverage;
  return {
    standings: Boolean(c?.standings),
    predictions: Boolean(c?.predictions),
    odds: Boolean(c?.odds),
    injuries: Boolean(c?.injuries),
    lineups: Boolean(c?.fixtures?.lineups),
    statistics: Boolean(c?.fixtures?.statistics_fixtures),
    events: Boolean(c?.fixtures?.events),
  };
}
