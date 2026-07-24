import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { isLiveApiConfigured } from '../api/client';
import { matches } from '../data/mock';
import { useFavorites } from '../context/FavoritesContext';
import { useNotifications } from '../context/NotificationsContext';
import { useFavoriteAlerts } from '../hooks/useFavoriteAlerts';

const NAV_LINKS = [
  { to: '/', label: 'Meciuri' },
  { to: '/favorites', label: 'Favorite' },
  { to: '/settings', label: 'Setări' },
];

export default function Layout() {
  const { favorites } = useFavorites();
  const { unreadCount, addNotification } = useNotifications();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useFavoriteAlerts(matches, favorites, addNotification);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="sm:hidden p-1 -ml-1"
              aria-label="Meniu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00c853]" />
              Central<span className="text-[#00c853]">Score</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-300">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={location.pathname === l.to ? 'text-white font-medium' : 'hover:text-white'}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <Link to="/notifications" className="relative p-1" aria-label="Notificări">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#00c853] text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        {menuOpen && (
          <nav className="sm:hidden border-t border-white/10 px-4 py-2 flex flex-col gap-1 text-sm">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={`py-2 ${location.pathname === l.to ? 'text-white font-medium' : 'text-gray-300'}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        {!isLiveApiConfigured && (
          <div className="bg-amber-500/10 text-amber-300 text-xs text-center py-1 px-4">
            Mod demo — date de exemplu. Conectează Worker-ul pentru date live.
          </div>
        )}
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 text-center text-xs text-gray-500 py-4">
        CentralScore · date furnizate de football-data.org
      </footer>
    </div>
  );
}
