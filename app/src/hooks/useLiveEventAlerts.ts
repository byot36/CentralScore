import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { findLiveFixtureByTeams, fetchFixtureEvents } from '../api/apifootball';
import { isLiveApiConfigured } from '../api/client';
import { translate } from '../context/LanguageContext';
import type { Match } from '../types';

const isNative = Capacitor.isNativePlatform();

function playGoalSound() {
  try {
    new Audio('/sounds/goal_sound.wav').play().catch(() => {});
  } catch {
    // autoplay blocat de browser — ignorăm
  }
}

// Verifică periodic (doar cât timp aplicația e deschisă) dacă vreo echipă
// favorită are un meci LIVE, și dacă da, urmărește evenimentele (gol,
// cartonaș) prin API-Football. Bugetul e limitat (100 cereri/zi gratuit),
// deci interogăm rar și doar cât există efectiv un meci live de urmărit.
const SEEN_EVENTS_KEY = 'centralscore-seen-events';
const POLL_MS = 3 * 60_000;

function eventKey(fixtureId: number, e: { type: string; time: { elapsed: number }; player: { name: string } }) {
  return `${fixtureId}-${e.type}-${e.time.elapsed}-${e.player.name}`;
}

function eventText(e: { type: string; detail: string; player: { name: string }; team: { name: string } }) {
  const vars = { player: e.player.name, team: e.team.name };
  if (e.type === 'Goal') return translate('event_goal', vars);
  if (e.type === 'Card' && e.detail.toLowerCase().includes('red')) return translate('event_red_card', vars);
  if (e.type === 'Card') return translate('event_yellow_card', vars);
  return null;
}

export function useLiveEventAlerts(
  matches: Match[],
  favorites: string[],
  notify: (title: string, body: string) => void
) {
  const fixtureIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLiveApiConfigured || favorites.length === 0) return;

    async function poll() {
      const liveFavMatch = matches.find((m) => m.status === 'live' && favorites.includes(m.id));
      if (!liveFavMatch) {
        fixtureIdRef.current = null;
        return;
      }

      try {
        if (fixtureIdRef.current == null) {
          fixtureIdRef.current = await findLiveFixtureByTeams(liveFavMatch.homeTeam.name, liveFavMatch.awayTeam.name);
        }
        if (fixtureIdRef.current == null) return;

        const events = await fetchFixtureEvents(fixtureIdRef.current);
        const seen: string[] = JSON.parse(localStorage.getItem(SEEN_EVENTS_KEY) ?? '[]');

        for (const e of events) {
          const key = eventKey(fixtureIdRef.current, e);
          if (seen.includes(key)) continue;
          const text = eventText(e);
          if (text) {
            notify('CentralScore', text);
            if (e.type === 'Goal') {
              if (isNative) {
                LocalNotifications.schedule({
                  notifications: [{
                    id: Math.floor(Math.random() * 2147483647),
                    title: 'CentralScore',
                    body: text,
                    schedule: { at: new Date(Date.now() + 300) },
                    sound: 'goal_sound.wav',
                  }],
                });
              } else {
                playGoalSound();
              }
            }
          }
          seen.push(key);
        }
        localStorage.setItem(SEEN_EVENTS_KEY, JSON.stringify(seen.slice(-200)));
      } catch {
        // budget epuizat sau eroare de rețea — ignorăm silențios, reîncercăm la următorul interval
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [matches, favorites, notify]);
}
