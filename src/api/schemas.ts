// סכמות zod לתשובות API-Football (v3). סובלניות בכוונה: מאמתים רק את השדות שאנו צורכים,
// שדות נוספים נזרקים בשקט (ברירת המחדל של zod). כך שינוי קל בצד ה-API לא שובר את הגבול.
import { z } from 'zod';

// --- בסיס משותף ---
export const teamSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string().optional(),
});

// --- /leagues?id=1&season=2026 — coverage ---
export const coverageFixturesSchema = z.object({
  events: z.boolean().optional(),
  lineups: z.boolean().optional(),
  statistics_fixtures: z.boolean().optional(),
  statistics_players: z.boolean().optional(),
});
export const coverageSchema = z.object({
  fixtures: coverageFixturesSchema.optional(),
  standings: z.boolean().optional(),
  players: z.boolean().optional(),
  top_scorers: z.boolean().optional(),
  predictions: z.boolean().optional(),
  injuries: z.boolean().optional(),
  odds: z.boolean().optional(),
});
export const leagueItemSchema = z.object({
  league: z.object({ id: z.number(), name: z.string() }),
  seasons: z.array(
    z.object({
      year: z.number(),
      current: z.boolean().optional(),
      coverage: coverageSchema.optional(),
    }),
  ),
});
export type LeagueItem = z.infer<typeof leagueItemSchema>;

// --- /standings?league=1&season=2026 ---
const allStatsSchema = z.object({
  played: z.number().nullable().optional(),
  win: z.number().nullable().optional(),
  draw: z.number().nullable().optional(),
  lose: z.number().nullable().optional(),
  goals: z.object({
    for: z.number().nullable().optional(),
    against: z.number().nullable().optional(),
  }),
});
export const standingRowSchema = z.object({
  rank: z.number(),
  team: teamSchema,
  points: z.number().nullable().optional(),
  goalsDiff: z.number().nullable().optional(),
  group: z.string(),
  form: z.string().nullable().optional(),
  all: allStatsSchema,
});
export type StandingRow = z.infer<typeof standingRowSchema>;

// response[0].league.standings = מערך של בתים, כל בית מערך של שורות.
export const standingsItemSchema = z.object({
  league: z.object({
    id: z.number(),
    season: z.number().optional(),
    standings: z.array(z.array(standingRowSchema)),
  }),
});
export type StandingsItem = z.infer<typeof standingsItemSchema>;

// --- /fixtures?league=1&season=2026 ---
const scoreSideSchema = z.object({
  home: z.number().nullable(),
  away: z.number().nullable(),
});
export const fixtureItemSchema = z.object({
  fixture: z.object({
    id: z.number(),
    date: z.string(),
    timestamp: z.number().optional(),
    venue: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
      })
      .optional(),
    status: z.object({
      long: z.string().optional(),
      short: z.string(),
      elapsed: z.number().nullable().optional(),
    }),
  }),
  league: z.object({
    id: z.number(),
    season: z.number().optional(),
    round: z.string(),
  }),
  teams: z.object({
    home: teamSchema.extend({ winner: z.boolean().nullable().optional() }),
    away: teamSchema.extend({ winner: z.boolean().nullable().optional() }),
  }),
  // הציון הסופי (כולל הארכה) — לתצוגה בלבד.
  goals: scoreSideSchema,
  // score.fulltime = ציון 90 הדקות — זה הקובע לניקוד הפול (CLAUDE.md §3).
  score: z.object({
    halftime: scoreSideSchema.partial().optional(),
    fulltime: scoreSideSchema.partial().optional(),
    extratime: scoreSideSchema.partial().optional(),
    penalty: scoreSideSchema.partial().optional(),
  }),
});
export type FixtureItem = z.infer<typeof fixtureItemSchema>;

// --- /fixtures/rounds — מערך מחרוזות ---
export const roundItemSchema = z.string();

// --- /predictions?fixture={id} — בסיס 1X2 לאנליסט (אומת חי) ---
export const predictionItemSchema = z.object({
  predictions: z.object({
    percent: z
      .object({
        home: z.string().nullable().optional(),
        draw: z.string().nullable().optional(),
        away: z.string().nullable().optional(),
      })
      .optional(),
    goals: z
      .object({
        home: z.string().nullable().optional(),
        away: z.string().nullable().optional(),
      })
      .optional(),
    advice: z.string().nullable().optional(),
    winner: z
      .object({
        id: z.number().nullable().optional(),
        name: z.string().nullable().optional(),
        comment: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  }),
  comparison: z.record(z.string(), z.unknown()).optional(),
});
export type PredictionItem = z.infer<typeof predictionItemSchema>;

// --- /fixtures/events?fixture={id} — כרטיסים (לחיזוי השעיות + ציון התנהגות) ---
export const eventItemSchema = z.object({
  time: z
    .object({
      elapsed: z.number().nullable().optional(),
      extra: z.number().nullable().optional(),
    })
    .optional(),
  team: teamSchema,
  player: z
    .object({ id: z.number().nullable().optional(), name: z.string().nullable().optional() })
    .optional(),
  type: z.string(), // Goal | Card | subst | Var
  detail: z.string().nullable().optional(), // "Yellow Card" | "Red Card" | "Second Yellow card"
});
export type EventItem = z.infer<typeof eventItemSchema>;

// --- /fixtures/lineups?fixture={id} — הרכב משוער/סופי (פרוקסי להיעדרויות) ---
const lineupPlayerSchema = z.object({
  player: z.object({
    id: z.number().nullable().optional(),
    name: z.string().nullable().optional(),
    number: z.number().nullable().optional(),
    pos: z.string().nullable().optional(),
  }),
});
export const lineupItemSchema = z.object({
  team: teamSchema,
  formation: z.string().nullable().optional(),
  startXI: z.array(lineupPlayerSchema).optional(),
  substitutes: z.array(lineupPlayerSchema).optional(),
});
export type LineupItem = z.infer<typeof lineupItemSchema>;

// --- /injuries?fixture={id} — פצועים/מורחקים (coverage=false במונדיאל הזה כרגע) ---
export const injuryItemSchema = z.object({
  player: z.object({
    id: z.number().nullable().optional(),
    name: z.string().nullable().optional(),
  }),
  team: teamSchema,
  type: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
});
export type InjuryItem = z.infer<typeof injuryItemSchema>;

// --- /players?team={id}&season=2026&league=1 — כרטיסים + חשיבות שחקן ---
export const playerItemSchema = z.object({
  player: z.object({
    id: z.number().nullable().optional(),
    name: z.string().nullable().optional(),
  }),
  statistics: z
    .array(
      z.object({
        games: z
          .object({
            appearences: z.number().nullable().optional(),
            minutes: z.number().nullable().optional(),
            rating: z.string().nullable().optional(),
            position: z.string().nullable().optional(),
            captain: z.boolean().nullable().optional(),
          })
          .optional(),
        cards: z
          .object({
            yellow: z.number().nullable().optional(),
            yellowred: z.number().nullable().optional(),
            red: z.number().nullable().optional(),
          })
          .optional(),
        goals: z
          .object({
            total: z.number().nullable().optional(),
            assists: z.number().nullable().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});
export type PlayerItem = z.infer<typeof playerItemSchema>;

// --- /teams/statistics — אובייקט יחיד: כושר + ממוצעי שערים ---
const avgSchema = z
  .object({
    home: z.string().nullable().optional(),
    away: z.string().nullable().optional(),
    total: z.string().nullable().optional(),
  })
  .optional();
export const teamStatsSchema = z.object({
  form: z.string().nullable().optional(),
  goals: z
    .object({
      for: z.object({ average: avgSchema }).optional(),
      against: z.object({ average: avgSchema }).optional(),
    })
    .optional(),
  clean_sheet: z.object({ total: z.number().nullable().optional() }).optional(),
  failed_to_score: z.object({ total: z.number().nullable().optional() }).optional(),
});
export type TeamStats = z.infer<typeof teamStatsSchema>;

// --- /fixtures/statistics?fixture={id} — xG, בעיטות, החזקה (לכל קבוצה) ---
export const statisticsItemSchema = z.object({
  team: teamSchema,
  statistics: z.array(
    z.object({
      type: z.string(),
      value: z.union([z.number(), z.string(), z.null()]).optional(),
    }),
  ),
});
export type StatisticsItem = z.infer<typeof statisticsItemSchema>;

// --- /odds?fixture={id}&bet=1 — ליינים של סוכנויות (1X2 = "Match Winner") ---
export const oddsItemSchema = z.object({
  bookmakers: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      bets: z.array(
        z.object({
          id: z.number().optional(),
          name: z.string().optional(),
          values: z.array(z.object({ value: z.string(), odd: z.string() })),
        }),
      ),
    }),
  ),
});
export type OddsItem = z.infer<typeof oddsItemSchema>;
