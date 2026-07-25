import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { matches as mockMatches } from '../data/mock';
import { isLiveApiConfigured } from '../api/client';
import {
  fetchFootballDataMatchesByDate,
  fetchAllSeasonMatches,
  FOOTBALL_DATA_COMPETITION_IDS,
} from '../api/footballdata';
import { fetchFriendliesToday } from '../api/apifootball';
import type { Match } from '../types';

const FOOTBALL_DATA_ID_TO_INTERNAL = Object.fromEntries(
  Object.entries(FOOTBALL_DATA_COMPETITION_IDS).map(([k, v]) => [String(v), k])
);
const REFRESH_MS = 90_000;
const BACKGROUND_REFRESH_THRESHOLD_MS = 5 * 60_000;
const CACHE_KEY = 'centralscore-matches-cache';

function remapCompetition(m: Match): Match {
  return { ...m, competitionId: FOOTBALL_DATA_ID_TO_INTERNAL[m.competitionId] ?? m.competitionId };
}

function loadCachedMatches(): Match[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveCachedMatches(matches: Match[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(matches));
  } catch {
    // spațiu insuficient sau localStorage indisponibil — nu e critic, doar pierdem cache-ul
  }
}

interface MatchesContextValue {
  matches: Match[];
  loading: boolean;
  error: string | null;
}

const MatchesContext = createContext<MatchesContextValue>({ matches: mockMatches, loading: false, error: null });

export function MatchesProvider({ children }: { children: ReactNode }) {
  // La prima deschidere afișăm instant datele din cache (de la ultima
  // sesiune), ca ligile să nu mai apară vizibil una câte una — se
  // actualizează apoi silențios pe fundal cu datele proaspete.
  const cached = isLiveApiConfigured ? loadCachedMatches() : null;
  const [matches, setMatches] = useState<Match[]>(cached ?? (isLiveApiConfigured ? [] : mockMatches));
  const [loading, setLoading] = useState(isLiveApiConfigured && !cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLiveApiConfigured) return;

    // Odată: tot sezonul pentru fiecare competiție, ca lista să nu fie
    // niciodată goală doar pentru că azi nu joacă nimeni (ex. pauze de vară).
    // Acumulăm în fundal și schimbăm ecranul o singură dată, la final — nu
    // liga câte una pe măsură ce sosesc (arăta neprofesional, "sărea" ecranul).
    let accumulated: Match[] = [];
    fetchAllSeasonMatches((competitionMatches) => {
      accumulated = accumulated.concat(competitionMatches.map(remapCompetition));
    })
      .then(() => {
        if (accumulated.length === 0) return;
        // Folosim starea curentă (nu snapshot-ul din cache de la montare) ca
        // bază — altfel am rescrie peste amicalele/actualizările deja
        // adăugate între timp de celelalte cereri, făcându-le să "dispară".
        setMatches((prev) => {
          const byId = new Map(prev.map((m) => [m.id, m]));
          for (const m of accumulated) byId.set(m.id, m);
          const merged = Array.from(byId.values());
          saveCachedMatches(merged);
          return merged;
        });
      })
      .catch((err) => {
        if (!cached) setError(err.message);
      })
      .finally(() => setLoading(false));

    // Amicalele internaționale de azi — cerere unică, de la API-Football (nu
    // sunt pe football-data.org), ca să nu irosim bugetul zilnic limitat.
    fetchFriendliesToday()
      .then((friendlies) => {
        if (friendlies.length === 0) return;
        setMatches((prev) => {
          const byId = new Map(prev.map((m) => [m.id, m]));
          for (const m of friendlies) byId.set(m.id, m);
          const next = Array.from(byId.values());
          saveCachedMatches(next);
          return next;
        });
      })
      .catch((err) => {
        // Eșec silențios pentru UX (nu blocăm restul aplicației), dar logăm
        // ca să putem diagnostica dacă amicalele lipsesc din cauza unei
        // erori reale (rețea, API) și nu pentru că azi chiar nu sunt.
        console.error('Nu am putut încărca amicalele de azi:', err);
      });

    // Periodic: doar meciurile de azi, ca să actualizăm scor/status live
    // fără să reinterogăm întregul sezon de fiecare dată.
    function refreshToday() {
      const today = new Date().toISOString().slice(0, 10);
      fetchFootballDataMatchesByDate(today)
        .then((todayMatches) => {
          const remapped = todayMatches.map(remapCompetition);
          setMatches((prev) => {
            const byId = new Map(prev.map((m) => [m.id, m]));
            for (const m of remapped) byId.set(m.id, m);
            const next = Array.from(byId.values());
            saveCachedMatches(next);
            return next;
          });
        })
        .catch(() => {});
    }

    const interval = setInterval(refreshToday, REFRESH_MS);

    // Dacă utilizatorul a stat cu aplicația în fundal (ecran stins, altă
    // aplicație activă) peste 5 minute, facem refresh imediat la revenire —
    // altfel ar aștepta până la 90s pentru următoarea actualizare automată.
    let hiddenAt: number | null = null;
    function handleVisibilityChange() {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= BACKGROUND_REFRESH_THRESHOLD_MS) {
        refreshToday();
      }
      hiddenAt = null;
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MatchesContext.Provider value={{ matches, loading, error }}>
      {children}
    </MatchesContext.Provider>
  );
}

export function useMatches() {
  return useContext(MatchesContext);
}
