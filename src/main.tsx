import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { queryClient } from './data/queryClient';
import { createIdbPersister } from './data/persister';
import { router } from './router';
import { Splash } from './ui/components/Splash';
import './ui/global.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('שורש האפליקציה (#root) לא נמצא');

const persister = createIdbPersister();

createRoot(rootEl).render(
  <StrictMode>
    <Splash />
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 24 * 60 * 60_000, buster: 'v1' }}
    >
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  </StrictMode>,
);

// service worker — autoUpdate (CLAUDE.md §5). מתעדכן ברקע, בלי הטרדת המשתמש.
registerSW({ immediate: true });
