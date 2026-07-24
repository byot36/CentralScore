import { useEffect, useState } from 'react';
import { competitions, matches as mockMatches } from '../data/mock';
import { SPORTMONKS_LEAGUE_IDS } from '../data/league-ids';
import MatchCard from '../components/MatchCard';
import { isLiveApiConfigured } from '../api/client';
import { fetchFixturesByDate } from '../api/sportmonks';
import { fetchFootballDataMatchesByDate, FOOTBALL_DATA_COMPETITION_IDS } from '../api/footballdata';
import type { Match } from '../types';

// Inversăm mapările ca să putem rescrie competitionId-ul brut al fiecărei
// surse (Sportmonks / football-data.org) în ID-ul intern folosit de UI.
const SPORTMONKS_ID_TO_INTERNAL = Object.fromEntries(
  Object.entries(SPORTMONKS_LEAGUE_IDS)
    .filter(([, v]) => v != null)
    .map(([k, v]) => [String(v), k])
);
const FOOTBALL_DATA_ID_TO_INTERNAL = Object.fromEntries(
  Object.entries(FOOTBALL_DATA_COMPETITION_IDS).map(([k, v]) => [String(v), k])
);

export default function Home() {
  const featured = competitions.filter((c) => c.featured);
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [loading, setLoading] = useState(isLiveApiConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLiveApiConfigured) return;
    const today = new Date().toISOString().slice(0, 10);

    Promise.allSettled([fetchFixturesByDate(today), fetchFootballDataMatchesByDate(today)])
      .then(([sportmonksResult, footballDataResult]) => {
        const sportmonksMatches =
          sportmonksResult.status === 'fulfilled'
            ? sportmonksResult.value.map((m) => ({ ...m, competitionId: SPORTMONKS_ID_TO_INTERNAL[m.competitionId] ?? m.competitionId }))
            : [];
        const footballDataMatches =
          footballDataResult.status === 'fulfilled'
            ? footballDataResult.value.map((m) => ({ ...m, competitionId: FOOTBALL_DATA_ID_TO_INTERNAL[m.competitionId] ?? m.competitionId }))
            : [];

        setMatches([...sportmonksMatches, ...footballDataMatches]);

        if (sportmonksResult.status === 'rejected' && footballDataResult.status === 'rejected') {
          setError('Nu s-au putut încărca datele live din nicio sursă.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold mb-3">Ligile de top</h1>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {featured.map((c) => (
            <div
              key={c.id}
              className="shrink-0 flex items-center gap-2 bg-[#111827] border border-white/10 rounded-full px-3 py-1.5 text-sm"
            >
              <span>{c.logo}</span>
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Se încarcă meciurile live...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {featured.map((comp) => {
        const compMatches = matches.filter((m) => m.competitionId === comp.id);
        if (compMatches.length === 0) return null;
        return (
          <section key={comp.id}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
              <span>{comp.logo}</span> {comp.name}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {compMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
