import { useState } from 'react';
import { Link } from 'react-router-dom';
import { competitions } from '../data/mock';
import MatchCard from '../components/MatchCard';
import MatchCardSkeleton from '../components/MatchCardSkeleton';
import { useMatches } from '../context/MatchesContext';
import { useLanguage } from '../context/LanguageContext';
import { FOOTBALL_DATA_COMPETITION_IDS } from '../api/footballdata';
import type { Match } from '../types';

const MAX_PER_COMPETITION = 6;

// Competiții de tip cupă/turneu — apar în listă doar cu 3 zile înainte de
// următorul meci (altfel ar putea rămâne "vizibile" luni întregi cu un
// singur meci foarte îndepărtat în viitor). Ligile obișnuite rămân
// neschimbate — arată orice meci programat, oricât de departe.
const CUP_COMPETITIONS = new Set(['ucl', 'uel', 'uecl', 'nations', 'euro', 'wc']);
const VISIBILITY_WINDOW_MS = 3 * 24 * 3600_000;

function sortForDisplay(matches: Match[]): Match[] {
  const recentlyFinished = matches.filter(
    (m) => m.status !== 'finished' || Date.now() - new Date(`${m.date}T${m.time}:00`).getTime() < 3 * 24 * 3600_000
  );
  return recentlyFinished.sort((a, b) => {
    const rank = (m: Match) => (m.status === 'live' ? 0 : m.status === 'scheduled' ? 1 : 2);
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    const timeA = new Date(`${a.date}T${a.time}:00`).getTime();
    const timeB = new Date(`${b.date}T${b.time}:00`).getTime();
    return a.status === 'finished' ? timeB - timeA : timeA - timeB;
  });
}

export default function Home() {
  const featured = competitions.filter((c) => c.featured);
  const { matches, loading, error } = useMatches();
  const { t } = useLanguage();
  const [selectedLeague, setSelectedLeague] = useState<string | null>('epl');
  const [search, setSearch] = useState('');
  const compName = (id: string) => t(`comp_${id}`);

  const searchResults = search.trim()
    ? matches.filter((m) => {
        const q = search.trim().toLowerCase();
        return m.homeTeam.name.toLowerCase().includes(q) || m.awayTeam.name.toLowerCase().includes(q);
      })
    : null;

  const groups = featured
    .map((comp) => ({ comp, compMatches: sortForDisplay(matches.filter((m) => m.competitionId === comp.id)) }))
    .filter((g) => {
      if (g.compMatches.length === 0) return false;
      if (!CUP_COMPETITIONS.has(g.comp.id)) return true;
      return g.compMatches.some((m) => {
        if (m.status !== 'scheduled') return true;
        const kickoff = new Date(`${m.date}T${m.time}:00`).getTime();
        return kickoff - Date.now() <= VISIBILITY_WINDOW_MS;
      });
    });

  const selectedGroups = selectedLeague ? groups.filter((g) => g.comp.id === selectedLeague) : groups;
  // Dacă liga selectată implicit (Premier League) nu are momentan meciuri
  // (ex. pauză de sezon), arătăm toate ligile în loc de un ecran gol.
  const visibleGroups = selectedGroups.length > 0 ? selectedGroups : groups;
  const effectiveSelection = selectedGroups.length > 0 ? selectedLeague : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold mb-3">{t('home_title')}</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full mb-3 bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#00c853]/50"
        />
        {!searchResults && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {groups.map(({ comp }) => (
              <button
                key={comp.id}
                onClick={() => setSelectedLeague(comp.id === effectiveSelection ? null : comp.id)}
                className={`shrink-0 flex items-center gap-2 border rounded-full px-3 py-1.5 text-sm transition-colors ${
                  comp.id === effectiveSelection
                    ? 'bg-[#00c853]/10 border-[#00c853] text-white'
                    : 'bg-[#111827] border-white/10 hover:border-[#00c853]/50'
                }`}
              >
                <span>{comp.logo}</span>
                <span>{compName(comp.id)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {searchResults ? (
        searchResults.length === 0 ? (
          <p className="text-sm text-gray-400">{t('search_no_results')}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {searchResults.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )
      ) : (
        <>
          {effectiveSelection && FOOTBALL_DATA_COMPETITION_IDS[effectiveSelection] && (
            <Link
              to={`/standings/${effectiveSelection}`}
              className="inline-flex items-center gap-1.5 text-sm text-[#00c853] hover:underline -mt-4"
            >
              🏆 {t('standings_link')}
            </Link>
          )}

          {loading && (
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => <MatchCardSkeleton key={i} />)}
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {visibleGroups.map(({ comp, compMatches }) => (
            <section key={comp.id}>
              {!effectiveSelection && (
                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                  <span>{comp.logo}</span> {compName(comp.id)}
                </h2>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {(effectiveSelection ? compMatches : compMatches.slice(0, MAX_PER_COMPETITION)).map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))}

          {!loading && !error && groups.length === 0 && (
            <p className="text-sm text-gray-400">{t('home_no_matches')}</p>
          )}
        </>
      )}
    </div>
  );
}
