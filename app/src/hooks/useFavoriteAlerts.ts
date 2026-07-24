import { useEffect } from 'react';
import type { Match } from '../types';

// Notificări pentru echipele favorite — folosesc Notification API din browser.
// Limitare reală: funcționează doar cât timp aplicația e deschisă (tab activ sau
// recent în fundal). Pentru notificări adevărate cu telefonul blocat/aplicația
// închisă complet ar fi nevoie de push notifications server-side (ex. Firebase
// Cloud Messaging) — necesită un backend suplimentar, nu doar acest site static.
const ALERTED_KEY = 'centralscore-alerted-matches';

export function useFavoriteAlerts(matches: Match[], favorites: string[]) {
  useEffect(() => {
    if (!('Notification' in window) || favorites.length === 0) return;

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

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
