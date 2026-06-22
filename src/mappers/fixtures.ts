// תשובת /fixtures גולמית → Fixture[] (domain).
// קריטי (CLAUDE.md §3): התוצאה לניקוד היא 90 דקות — score.fulltime, לא goals (שכולל הארכה).
import type { Fixture } from '../domain/types';
import type { FixtureItem } from '../api/schemas';
import { roundToStage, statusToState } from './stage';

/** ציון 90 הדקות: מעדיפים score.fulltime; נופלים ל-goals (חי/לפני סיום) אם חסר. */
function ninetyMinuteResult(item: FixtureItem): { home: number; away: number } | undefined {
  const ft = item.score.fulltime;
  if (ft && typeof ft.home === 'number' && typeof ft.away === 'number') {
    return { home: ft.home, away: ft.away };
  }
  const g = item.goals;
  if (typeof g.home === 'number' && typeof g.away === 'number') {
    return { home: g.home, away: g.away };
  }
  return undefined;
}

export function mapFixture(item: FixtureItem): Fixture {
  const result = ninetyMinuteResult(item);
  const fixture: Fixture = {
    id: item.fixture.id,
    stage: roundToStage(item.league.round),
    kickoff: item.fixture.date,
    home: { id: item.teams.home.id, name: item.teams.home.name, logo: item.teams.home.logo },
    away: { id: item.teams.away.id, name: item.teams.away.name, logo: item.teams.away.logo },
    status: statusToState(item.fixture.status.short),
  };
  if (result) {
    fixture.goalsHome = result.home;
    fixture.goalsAway = result.away;
  }
  return fixture;
}

export function mapFixtures(items: FixtureItem[]): Fixture[] {
  return items
    .map(mapFixture)
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
}
