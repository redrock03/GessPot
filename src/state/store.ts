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
  savedPicks: Record<number, SavedPick>;
  setRiskAlpha: (a: number) => void;
  savePick: (p: SavedPick) => void;
  removePick: (fixtureId: number) => void;
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      riskAlpha: 0.5,
      savedPicks: {},
      setRiskAlpha: (a) => set({ riskAlpha: clamp01(a) }),
      savePick: (p) => set((s) => ({ savedPicks: { ...s.savedPicks, [p.fixtureId]: p } })),
      removePick: (fixtureId) =>
        set((s) => {
          const next = { ...s.savedPicks };
          delete next[fixtureId];
          return { savedPicks: next };
        }),
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
        const savedPicks =
          p.savedPicks && typeof p.savedPicks === 'object' ? p.savedPicks : current.savedPicks;
        return { ...current, ...p, riskAlpha, savedPicks };
      },
    },
  ),
);
