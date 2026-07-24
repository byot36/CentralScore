import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Match } from '../types';

// Pe Android (aplicația nativă) folosim notificări locale programate de
// sistemul de operare — funcționează chiar și cu aplicația complet închisă.
// În browser (web), folosim Notification API — funcționează doar cât timp
// tab-ul e deschis sau recent activ; un adevărat push cu telefonul blocat
// ar necesita un server (ex. Firebase Cloud Messaging).
const ALERTED_KEY = 'centralscore-alerted-matches';
const isNative = Capacitor.isNativePlatform();

function idFromMatch(matchId: string) {
  // LocalNotifications cere id numeric — derivăm unul stabil din id-ul meciului.
  let hash = 0;
  for (const ch of matchId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 2147483647;
}

export function useFavoriteAlerts(matches: Match[], favorites: string[]) {
  useEffect(() => {
    if (favorites.length === 0) return;

    if (isNative) {
      scheduleNativeNotifications(matches, favorites);
      return;
    }

    if (!('Notification' in window)) return;

    function checkAndNotify() {
      if (Notification.permission !== 'granted') return;
      const alerted: string[] = JSON.parse(localStorage.getItem(ALERTED_KEY) ?? '[]');

      for (const m of matches) {
        const isFavMatch = favorites.includes(m.homeTeam.id) || favorites.includes(m.awayTeam.id);
        if (!isFavMatch || alerted.includes(m.id)) continue;

        const kickoff = new Date(`${m.date}T${m.time}:00`);
        const minutesUntil = (kickoff.getTime() - Date.now()) / 60000;

        if (minutesUntil <= 15 && minutesUntil > -5) {
          new Notification('CentralScore', {
            body: `${m.homeTeam.name} - ${m.awayTeam.name} începe în curând!`,
          });
          localStorage.setItem(ALERTED_KEY, JSON.stringify([...alerted, m.id]));
        }
      }
    }

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 60_000);
    return () => clearInterval(interval);
  }, [matches, favorites]);
}

async function scheduleNativeNotifications(matches: Match[], favorites: string[]) {
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') return;

  const favMatches = matches.filter(
    (m) => favorites.includes(m.homeTeam.id) || favorites.includes(m.awayTeam.id)
  );

  await LocalNotifications.schedule({
    notifications: favMatches.map((m) => {
      const kickoff = new Date(`${m.date}T${m.time}:00`);
      const notifyAt = new Date(kickoff.getTime() - 15 * 60_000);
      return {
        id: idFromMatch(m.id),
        title: 'CentralScore',
        body: `${m.homeTeam.name} - ${m.awayTeam.name} începe în curând!`,
        schedule: { at: notifyAt },
      };
    }),
  });
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
