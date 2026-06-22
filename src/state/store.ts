// הגדרות + ניחושים שמורים (CLAUDE.md §13 מסך 4 / §6). zustand + persist ל-localStorage.
// כל ההתמדה בדפדפן — ללא שרת, ללא חשבון (§2).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Stage } from '../domain/types';

export interface SavedPick {
  fixtureId: number;
  kind: 'tendency' | 'exact';
  score: { home: number; away: number };
  homeName: string;
  awayName: string;
  stage: Stage;
  kickoff: string;
  /** ISO — נחתם בשכבת ה-UI (לא במנוע הטהור). */
  savedAt: string;
}

interface AppState {
  /** חוגת-סיכון α∈[0,1]: 0 = כיוון בטוח (EV מרבי), 1 = בול (תקרה מרבית). */
  riskAlpha: number;
  /** התאמת אגרסיביות אוטומטית לפי מצב הפול (§4). */
  poolAdjust: boolean;
  /** true = מאחורי המוביל; false = מוביל. */
  poolBehind: boolean;
  /** עוצמת הפער בנקודות (≥0). */
  poolPoints: number;
  savedPicks: Record<number, SavedPick>;
  setRiskAlpha: (a: number) => void;
  setPoolAdjust: (b: boolean) => void;
  setPoolBehind: (b: boolean) => void;
  setPoolPoints: (n: number) => void;
  savePick: (p: SavedPick) => void;
  removePick: (fixtureId: number) => void;
  clearPicks: () => void;
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      riskAlpha: 0.5,
      poolAdjust: false,
      poolBehind: true,
      poolPoints: 0,
      savedPicks: {},
      setRiskAlpha: (a) => set({ riskAlpha: clamp01(a) }),
      setPoolAdjust: (b) => set({ poolAdjust: b }),
      setPoolBehind: (b) => set({ poolBehind: b }),
      setPoolPoints: (n) => set({ poolPoints: Math.max(0, Math.round(n)) }),
      savePick: (p) => set((s) => ({ savedPicks: { ...s.savedPicks, [p.fixtureId]: p } })),
      removePick: (fixtureId) =>
        set((s) => {
          const next = { ...s.savedPicks };
          delete next[fixtureId];
          return { savedPicks: next };
        }),
      clearPicks: () => set({ savedPicks: {} }),
    }),
    {
      name: 'gesspot-prefs',
      version: 1,
      // מנקים ערכים פגומים מ-localStorage (riskAlpha מחוץ לטווח/NaN, savedPicks לא-אובייקט)
      // כך שגם אם המטמון נערך ידנית — האינווריאנטות נשמרות והתצוגה לא נשברת.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const riskAlpha =
          typeof p.riskAlpha === 'number' && Number.isFinite(p.riskAlpha)
            ? clamp01(p.riskAlpha)
            : current.riskAlpha;
        const poolPoints =
          typeof p.poolPoints === 'number' && Number.isFinite(p.poolPoints)
            ? Math.max(0, Math.round(p.poolPoints))
            : current.poolPoints;
        const savedPicks =
          p.savedPicks && typeof p.savedPicks === 'object' ? p.savedPicks : current.savedPicks;
        return { ...current, ...p, riskAlpha, poolPoints, savedPicks };
      },
    },
  ),
);
