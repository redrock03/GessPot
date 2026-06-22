import { QueryClient } from '@tanstack/react-query';

// נתוני המונדיאל יציבים יחסית בתוך מחזור — cache נדיב, refetch מבוקר.
// התמדה ל-IndexedDB (idb-keyval + persister) מתווספת ב-M1.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000, // 5 דק'
      gcTime: 24 * 60 * 60_000, // יום — לשרוד reload כשתתווסף התמדה
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
