import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { isLiveApiConfigured } from '../api/client';
import { useFavorites } from '../context/FavoritesContext';
import { useNotifications } from '../context/NotificationsContext';
import { useMatches } from '../context/MatchesContext';
import { useFavoriteAlerts, requestNotificationPermission } from '../hooks/useFavoriteAlerts';
import { useLiveEventAlerts } from '../hooks/useLiveEventAlerts';
import { useAppUpdateCheck } from '../hooks/useAppUpdateCheck';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const isNative = Capacitor.isNativePlatform();

const NAV_LINKS = [
  { to: '/', label: 'Meciuri' },
  { to: '/favorites', label: 'Favorite' },
  { to: '/settings', label: 'Setări' },
];

export default function Layout() {
  const { favorites } = useFavorites();
  const { unreadCount, addNotification } = useNotifications();
  const { matches } = useMatches();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useFavoriteAlerts(matches, favorites, addNotification);
  useLiveEventAlerts(matches, favorites, addNotification);
  const update = useAppUpdateCheck();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!update) return;
    const body = `Versiunea ${update.version} este disponibilă. Apasă pentru a actualiza.`;
    addNotification('Actualizare CentralScore disponibilă', body, update.downloadUrl);
    if (isNative) {
      LocalNotifications.checkPermissions().then((p) => {
        if (p.display === 'granted') {
          LocalNotifications.schedule({
            notifications: [{ id: 999999, title: 'CentralScore', body, schedule: { at: new Date(Date.now() + 500) } }],
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update?.version]);

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
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform duration-300 ${menuOpen ? 'rotate-90' : ''}`}
              >
                <path
                  strokeLinecap="round"
                  className="transition-all duration-300"
                  d={menuOpen ? 'M6 6l12 12M6 18L18 6' : 'M4 6h16M4 12h16M4 18h16'}
                />
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
                  className={`relative py-1 transition-colors duration-200 after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:bg-[#00c853] after:transition-all after:duration-300 ${
                    location.pathname === l.to
                      ? 'text-white font-medium after:w-full'
                      : 'hover:text-white after:w-0 hover:after:w-full'
                  }`}
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
        <nav
          className={`sm:hidden grid transition-all duration-300 ease-out ${
            menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden border-t border-white/10">
            <div className="px-4 py-2 flex flex-col gap-1 text-sm">
              {NAV_LINKS.map((l, i) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  style={{ transitionDelay: menuOpen ? `${i * 40}ms` : '0ms' }}
                  className={`py-2 transition-all duration-200 ${
                    menuOpen ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                  } ${location.pathname === l.to ? 'text-white font-medium' : 'text-gray-300'}`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
        {!isLiveApiConfigured && (
          <div className="bg-amber-500/10 text-amber-300 text-xs text-center py-1 px-4">
            Mod demo — date de exemplu. Conectează Worker-ul pentru date live.
          </div>
        )}
        {update && (
          <div className="bg-[#00c853]/10 text-[#00c853] text-xs text-center py-1.5 px-4 flex items-center justify-center gap-3">
            <span>Versiune nouă disponibilă: v{update.version}</span>
            <button
              onClick={() => Browser.open({ url: update.downloadUrl })}
              className="bg-[#00c853] text-black font-medium px-2.5 py-0.5 rounded-full"
            >
              Actualizează
            </button>
          </div>
        )}
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 text-center text-xs text-gray-500 py-4">
        Copyright 2026 by Luisito
      </footer>
    </div>
  );
}
