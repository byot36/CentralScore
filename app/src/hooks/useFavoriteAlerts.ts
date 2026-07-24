import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Match } from '../types';

// Pe Android (aplicația nativă), notificarea de start de meci e programată de
// sistemul de operare — funcționează chiar și cu aplicația complet închisă.
// Notificarea de "s-a terminat" se detectează prin verificarea periodică a
// statusului meciului, deci necesită aplicația deschisă/recent activă — nu
// există date de evenimente live (gol/cartonaș) pe planul gratuit folosit,
// deci acelea nu pot fi notificate.
const ALERTED_KEY = 'centralscore-alerted-matches';
const isNative = Capacitor.isNativePlatform();

type NotifyFn = (title: string, body: string) => void;

function idFromMatch(matchId: string, suffix: string) {
  let hash = 0;
  for (const ch of `${matchId}-${suffix}`) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 2147483647;
}

export function useFavoriteAlerts(matches: Match[], favorites: string[], notify?: NotifyFn) {
  useEffect(() => {
    if (favorites.length === 0) return;

    if (isNative) {
      scheduleNativeNotifications(matches, favorites);
      if (notify) {
        LocalNotifications.addListener('localNotificationReceived', (n) => {
          notify(n.title ?? 'CentralScore', n.body ?? '');
        });
      }
      return () => {
        LocalNotifications.removeAllListeners();
      };
    }

    if (!('Notification' in window)) return;

    function checkAndNotify() {
      if (Notification.permission !== 'granted') return;
      const alerted: Record<string, string[]> = JSON.parse(localStorage.getItem(ALERTED_KEY) ?? '{}');

      for (const m of matches) {
        const isFavMatch = favorites.includes(m.homeTeam.id) || favorites.includes(m.awayTeam.id);
        if (!isFavMatch) continue;
        const done = alerted[m.id] ?? [];

        const kickoff = new Date(`${m.date}T${m.time}:00`);
        const minutesUntil = (kickoff.getTime() - Date.now()) / 60000;

        if (!done.includes('start') && minutesUntil <= 0 && minutesUntil > -10 && m.status !== 'scheduled') {
          const body = `${m.homeTeam.name} - ${m.awayTeam.name} a început!`;
          new Notification('CentralScore', { body });
          notify?.('CentralScore', body);
          alerted[m.id] = [...done, 'start'];
        } else if (!done.includes('soon') && minutesUntil <= 15 && minutesUntil > 0) {
          const body = `${m.homeTeam.name} - ${m.awayTeam.name} începe în curând!`;
          new Notification('CentralScore', { body });
          notify?.('CentralScore', body);
          alerted[m.id] = [...done, 'soon'];
        }

        if (!done.includes('finished') && m.status === 'finished') {
          const body = `Final: ${m.homeTeam.name} ${m.homeScore} - ${m.awayScore} ${m.awayTeam.name}`;
          new Notification('CentralScore', { body });
          notify?.('CentralScore', body);
          alerted[m.id] = [...(alerted[m.id] ?? done), 'finished'];
        }
      }

      localStorage.setItem(ALERTED_KEY, JSON.stringify(alerted));
    }

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 60_000);
    return () => clearInterval(interval);
  }, [matches, favorites, notify]);
}

async function scheduleNativeNotifications(matches: Match[], favorites: string[]) {
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') return;

  const favMatches = matches.filter(
    (m) => favorites.includes(m.homeTeam.id) || favorites.includes(m.awayTeam.id)
  );

  const notifications = favMatches.flatMap((m) => {
    const kickoff = new Date(`${m.date}T${m.time}:00`);
    const reminder = new Date(kickoff.getTime() - 15 * 60_000);
    return [
      {
        id: idFromMatch(m.id, 'soon'),
        title: 'CentralScore',
        body: `${m.homeTeam.name} - ${m.awayTeam.name} începe în curând!`,
        schedule: { at: reminder },
      },
      {
        id: idFromMatch(m.id, 'start'),
        title: 'CentralScore',
        body: `${m.homeTeam.name} - ${m.awayTeam.name} a început!`,
        schedule: { at: kickoff },
      },
    ];
  }).filter((n) => n.schedule.at.getTime() > Date.now());

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

export async function requestNotificationPermission() {
  if (isNative) {
    await LocalNotifications.requestPermissions();
    return;
  }
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
