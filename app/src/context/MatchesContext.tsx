import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { matches as mockMatches } from '../data/mock';
import { isLiveApiConfigured } from '../api/client';
import { fetchFootballDataMatchesByDate, FOOTBALL_DATA_COMPETITION_IDS } from '../api/footballdata';
import type { Match } from '../types';

const FOOTBALL_DATA_ID_TO_INTERNAL = Object.fromEntries(
  Object.entries(FOOTBALL_DATA_COMPETITION_IDS).map(([k, v]) => [String(v), k])
);
const REFRESH_MS = 90_000;

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

    function load() {
      const today = new Date().toISOString().slice(0, 10);
      fetchFootballDataMatchesByDate(today)
        .then((live) => {
          setMatches(live.map((m) => ({ ...m, competitionId: FOOTBALL_DATA_ID_TO_INTERNAL[m.competitionId] ?? m.competitionId })));
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }

    load();
    const interval = setInterval(load, REFRESH_MS);
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
