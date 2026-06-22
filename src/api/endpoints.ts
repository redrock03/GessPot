// קריאות טיפוסיות ל-endpoints מ-§7. כל פונקציה מחזירה את ה-item הגולמי המאומת;
// ההמרה ל-domain types קורית ב-mappers/ (נקודת ההחלפה היחידה).
import { WORLD_CUP } from '../config';
import { apiGet, apiGetObject } from './http';
import {
  eventItemSchema,
  fixtureItemSchema,
  injuryItemSchema,
  leagueItemSchema,
  lineupItemSchema,
  oddsItemSchema,
  playerItemSchema,
  predictionItemSchema,
  roundItemSchema,
  standingsItemSchema,
  statisticsItemSchema,
  teamStatsSchema,
  type EventItem,
  type FixtureItem,
  type InjuryItem,
  type LeagueItem,
  type LineupItem,
  type OddsItem,
  type PlayerItem,
  type PredictionItem,
  type StandingsItem,
  type StatisticsItem,
  type TeamStats,
} from './schemas';

const { league, season } = WORLD_CUP;

/** coverage — לבדוק לפני endpoints תלויי-coverage (CLAUDE.md §7). */
export function getLeagueCoverage(): Promise<LeagueItem[]> {
  return apiGet('/leagues', leagueItemSchema, { id: league, season });
}

/** כל 12 הבתים בקריאה אחת (כולל בסיס מרוץ השלישיות). */
export function getStandings(): Promise<StandingsItem[]> {
  return apiGet('/standings', standingsItemSchema, { league, season });
}

/** לוח המשחקים + תוצאות. */
export function getFixtures(): Promise<FixtureItem[]> {
  return apiGet('/fixtures', fixtureItemSchema, { league, season });
}

/** השלב הפעיל כעת (מחרוזת round בודדת בד"כ). */
export function getCurrentRound(): Promise<string[]> {
  return apiGet('/fixtures/rounds', roundItemSchema, { league, season, current: true });
}

/** בסיס 1X2 + advice של API-Football למשחק (קלט בסיס לאנליסט). */
export function getPrediction(fixtureId: number): Promise<PredictionItem[]> {
  return apiGet('/predictions', predictionItemSchema, { fixture: fixtureId });
}

/** אירועי משחק — כרטיסים/שערים/חילופים (לחיזוי השעיות + ציון התנהגות). */
export function getEvents(fixtureId: number): Promise<EventItem[]> {
  return apiGet('/fixtures/events', eventItemSchema, { fixture: fixtureId });
}

/** הרכבים (פרוקסי להיעדרויות לפני המשחק). */
export function getLineups(fixtureId: number): Promise<LineupItem[]> {
  return apiGet('/fixtures/lineups', lineupItemSchema, { fixture: fixtureId });
}

/** פצועים/מורחקים (coverage תלוי-טורניר). */
export function getInjuries(fixtureId: number): Promise<InjuryItem[]> {
  return apiGet('/injuries', injuryItemSchema, { fixture: fixtureId });
}

/** סטטיסטיקות שחקני קבוצה — כרטיסים, דקות, דירוג (חשיבות + השעיות). דף ראשון. */
export function getTeamPlayers(teamId: number): Promise<PlayerItem[]> {
  return apiGet('/players', playerItemSchema, { team: teamId, season, league });
}

/** סטטיסטיקת קבוצה לעונה — כושר + ממוצעי שערים (אובייקט יחיד). */
export function getTeamStatistics(teamId: number): Promise<TeamStats> {
  return apiGetObject('/teams/statistics', teamStatsSchema, { team: teamId, season, league });
}

/** ראש בראש בין שתי נבחרות (היסטוריה — §9). */
export function getHeadToHead(homeId: number, awayId: number): Promise<FixtureItem[]> {
  return apiGet('/fixtures/headtohead', fixtureItemSchema, { h2h: `${homeId}-${awayId}` });
}

/** סטטיסטיקות משחק — xG, בעיטות, החזקה. */
export function getFixtureStatistics(fixtureId: number): Promise<StatisticsItem[]> {
  return apiGet('/fixtures/statistics', statisticsItemSchema, { fixture: fixtureId });
}

/** ליינים של סוכנויות — שוק 1X2 (bet=1 "Match Winner"). */
export function getOdds(fixtureId: number): Promise<OddsItem[]> {
  return apiGet('/odds', oddsItemSchema, { fixture: fixtureId, bet: 1 });
}
