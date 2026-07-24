import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { translate } from '../context/LanguageContext';
import type { Match } from '../types';

// Pe Android (aplicația nativă), notificările de start și de final estimat
// sunt programate în avans de sistemul de operare — funcționează chiar și cu
// ecranul închis (dar aplicația trebuie să fi rulat măcar o dată recent, ca
// să fi apucat să le programeze). Ora exactă de final nu se cunoaște dinainte
// (prelungiri variabile), deci "fluierul final" nativ e o estimare la
// kickoff + 115 minute — dacă aplicația e deschisă, statusul real e verificat
// și notificarea de final corectă apare oricum prin polling.
const ALERTED_KEY = 'centralscore-alerted-matches';
const isNative = Capacitor.isNativePlatform();
const ESTIMATED_MATCH_MINUTES = 115;

type NotifyFn = (title: string, body: string) => void;

function playSound(file: string) {
  try {
    new Audio(`/sounds/${file}`).play().catch(() => {});
  } catch {
    // autoplay blocat de browser — ignorăm
  }
}

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
        if (!favorites.includes(m.id)) continue;
        const done = alerted[m.id] ?? [];

        const kickoff = new Date(`${m.date}T${m.time}:00`);
        const minutesUntil = (kickoff.getTime() - Date.now()) / 60000;

        if (!done.includes('start') && minutesUntil <= 0 && minutesUntil > -10 && m.status !== 'scheduled') {
          const body = translate('alert_match_started', { home: m.homeTeam.name, away: m.awayTeam.name });
          new Notification('CentralScore', { body });
          playSound('whistle_start.wav');
          notify?.('CentralScore', body);
          alerted[m.id] = [...done, 'start'];
        } else if (!done.includes('soon') && minutesUntil <= 15 && minutesUntil > 0) {
          const body = translate('alert_match_soon', { home: m.homeTeam.name, away: m.awayTeam.name });
          new Notification('CentralScore', { body });
          notify?.('CentralScore', body);
          alerted[m.id] = [...done, 'soon'];
        }

        if (!done.includes('finished') && m.status === 'finished') {
          const body = translate('alert_match_finished', {
            home: m.homeTeam.name, away: m.awayTeam.name, homeScore: m.homeScore, awayScore: m.awayScore,
          });
          new Notification('CentralScore', { body });
          playSound('whistle_end.wav');
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

  const favMatches = matches.filter((m) => favorites.includes(m.id));

  const notifications = favMatches.flatMap((m) => {
    const kickoff = new Date(`${m.date}T${m.time}:00`);
    const reminder = new Date(kickoff.getTime() - 15 * 60_000);
    const estimatedEnd = new Date(kickoff.getTime() + ESTIMATED_MATCH_MINUTES * 60_000);
    return [
      {
        id: idFromMatch(m.id, 'soon'),
        title: 'CentralScore',
        body: translate('alert_match_soon', { home: m.homeTeam.name, away: m.awayTeam.name }),
        schedule: { at: reminder },
      },
      {
        id: idFromMatch(m.id, 'start'),
        title: 'CentralScore',
        body: translate('alert_match_started', { home: m.homeTeam.name, away: m.awayTeam.name }),
        schedule: { at: kickoff },
        sound: 'whistle_start.wav',
      },
      {
        id: idFromMatch(m.id, 'end-estimate'),
        title: 'CentralScore',
        body: translate('alert_match_ended_estimate', { home: m.homeTeam.name, away: m.awayTeam.name }),
        schedule: { at: estimatedEnd },
        sound: 'whistle_end.wav',
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
