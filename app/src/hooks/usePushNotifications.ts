import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { API_BASE } from '../api/client';
import type { Match } from '../types';

// Înregistrează device-ul pentru notificări push reale (Firebase Cloud
// Messaging), care ajung chiar și cu aplicația complet închisă — nu doar cu
// ecranul stins, ca notificările locale. Serverul (Cloudflare Worker)
// verifică periodic meciurile favorizate și trimite push-ul din exterior.
const isNative = Capacitor.isNativePlatform();

export function usePushNotifications(matches: Match[], favorites: string[]) {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isNative) return;

    PushNotifications.createChannel({
      id: 'centralscore-live',
      name: 'Meciuri live',
      description: 'Start, final și goluri pentru meciurile favorite',
      importance: 5,
      visibility: 1,
    }).catch(() => {});

    PushNotifications.checkPermissions().then(async (p) => {
      if (p.receive === 'prompt') {
        const req = await PushNotifications.requestPermissions();
        if (req.receive !== 'granted') return;
      } else if (p.receive !== 'granted') {
        return;
      }
      await PushNotifications.register();
    });

    const regListener = PushNotifications.addListener('registration', (token) => {
      tokenRef.current = token.value;
      syncFavoriteTeams(token.value, matches, favorites);
    });

    return () => {
      regListener.then((l) => l.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isNative || !tokenRef.current) return;
    syncFavoriteTeams(tokenRef.current, matches, favorites);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, favorites]);
}

function syncFavoriteTeams(token: string, matches: Match[], favorites: string[]) {
  const teamNames = new Set<string>();
  for (const m of matches) {
    if (!favorites.includes(m.id)) continue;
    teamNames.add(m.homeTeam.name);
    teamNames.add(m.awayTeam.name);
  }
  fetch(`${API_BASE}/push/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, teams: Array.from(teamNames) }),
  }).catch(() => {});
}
