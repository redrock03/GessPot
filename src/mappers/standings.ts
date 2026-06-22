// תשובת /standings גולמית → GroupRow[] (domain). שורות מכל הבתים, משוטחות.
import type { GroupRow } from '../domain/types';
import type { StandingsItem } from '../api/schemas';
import { groupLabel } from './stage';

// API-Football מחזיר 13 תת-מערכים: 12 הבתים (A–L) + טבלת-צבירה אחת של מרוץ השלישיות
// בתווית "Group Stage". מזהים בית אמיתי לפי תווית "Group <אות בודדת>".
const REAL_GROUP = /^group\s+[A-Z]$/i;
export function isRealGroup(group: string): boolean {
  return REAL_GROUP.test(group);
}

export function mapStandings(items: StandingsItem[]): GroupRow[] {
  const rows: GroupRow[] = [];
  for (const item of items) {
    for (const group of item.league.standings) {
      for (const r of group) {
        if (!isRealGroup(r.group)) continue; // מדלגים על טבלת מרוץ השלישיות (תטופל ב-M4)
        rows.push({
          team: { id: r.team.id, name: r.team.name, logo: r.team.logo },
          group: groupLabel(r.group),
          rank: r.rank,
          played: r.all.played ?? 0,
          win: r.all.win ?? 0,
          draw: r.all.draw ?? 0,
          lose: r.all.lose ?? 0,
          goalsFor: r.all.goals.for ?? 0,
          goalsAgainst: r.all.goals.against ?? 0,
          points: r.points ?? 0,
          // ציון התנהגות (פייר-פליי) לא קיים ב-/standings — נגזר מכרטיסים ב-M4/M5.
          conduct: 0,
        });
      }
    }
  }
  return rows;
}
