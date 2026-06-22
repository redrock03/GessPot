// persister ל-react-query מעל IndexedDB (idb-keyval). cache שורד reload (CLAUDE.md §5).
// מימוש ישיר של ממשק Persister — ללא תלות נוספת.
import { del, get, set } from 'idb-keyval';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

export function createIdbPersister(key = 'gesspot-react-query'): Persister {
  return {
    persistClient: (client: PersistedClient) => set(key, client),
    restoreClient: () => get<PersistedClient>(key),
    removeClient: () => del(key),
  };
}
