import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { matches as mockMatches } from '../data/mock';
import { isLiveApiConfigured } from '../api/client';
import {
  fetchFootballDataMatchesByDate,
  fetchAllSeasonMatches,
  FOOTBALL_DATA_COMPETITION_IDS,
} from '../api/footballdata';
import type { Match } from '../types';

const FOOTBALL_DATA_ID_TO_INTERNAL = Object.fromEntries(
  Object.entries(FOOTBALL_DATA_COMPETITION_IDS).map(([k, v]) => [String(v), k])
);
const REFRESH_MS = 90_000;

function remapCompetition(m: Match): Match {
  return { ...m, competitionId: FOOTBALL_DATA_ID_TO_INTERNAL[m.competitionId] ?? m.competitionId };
}

interface MatchesContextValue {
  matches: Match[];
  loading: boolean;
  error: string | null;
}

const MatchesContext = createContext<MatchesContextValue>({ matches: mockMatches, loading: false, error: null });

export function MatchesProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [loading, setLoading] = useState(isLiveApiConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLiveApiConfigured) return;

    // Odată: tot sezonul pentru fiecare competiție, ca lista să nu fie
    // niciodată goală doar pentru că azi nu joacă nimeni (ex. pauze de vară).
    fetchAllSeasonMatches()
      .then((season) => setMatches(season.map(remapCompetition)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

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
            return Array.from(byId.values());
          });
        })
        .catch(() => {});
    }

    const interval = setInterval(refreshToday, REFRESH_MS);
    return () => clearInterval(interval);
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
