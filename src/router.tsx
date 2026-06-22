import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './ui/components/AppShell';
import { Fixtures } from './ui/screens/Fixtures';
import { Groups } from './ui/screens/Groups';
import { Match } from './ui/screens/Match';
import { Settings } from './ui/screens/Settings';
import { NotFound } from './ui/screens/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Fixtures /> },
      { path: 'groups', element: <Groups /> },
      { path: 'match', element: <Match /> },
      { path: 'match/:fixtureId', element: <Match /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
