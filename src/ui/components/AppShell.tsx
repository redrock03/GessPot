import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'משחקים', icon: '⚽', end: true },
  { to: '/groups', label: 'בתים', icon: '📊', end: false },
  { to: '/predict', label: 'חיזוי', icon: '🎯', end: false },
  { to: '/settings', label: 'הגדרות', icon: '⚙️', end: false },
] as const;

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export function AppShell() {
  const online = useOnline();
  return (
    <div className="app">
      <header className="app__header">
        <img className="app__logo" src="/favicon.svg" alt="" aria-hidden="true" />
        <div>
          <h1 className="app__title">מוקד הניחושים</h1>
          <p className="app__subtitle">חיזוי מונדיאל 2026</p>
        </div>
      </header>

      {!online && (
        <div className="app__offline" role="status">
          מצב לא-מקוון — מוצג מהמטמון האחרון
        </div>
      )}

      <main className="app__main">
        <Outlet />
      </main>

      <nav className="app__nav" aria-label="ניווט ראשי">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'is-active' : undefined)}
          >
            <span className="app__nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
