import { competitions } from '../data/mock';
import MatchCard from '../components/MatchCard';
import { useMatches } from '../context/MatchesContext';
import type { Match } from '../types';

const MAX_PER_COMPETITION = 6;

function sortForDisplay(matches: Match[]): Match[] {
  const recentlyFinished = matches.filter(
    (m) => m.status !== 'finished' || Date.now() - new Date(`${m.date}T${m.time}:00`).getTime() < 3 * 24 * 3600_000
  );
  return recentlyFinished.sort((a, b) => {
    // Live primele, apoi cele viitoare (crescător), apoi cele terminate recent (descrescător).
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

      {loading && <p className="text-sm text-gray-400">Se încarcă meciurile...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {featured.map((comp) => {
        const compMatches = sortForDisplay(matches.filter((m) => m.competitionId === comp.id)).slice(0, MAX_PER_COMPETITION);
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

      {!loading && !error && matches.length === 0 && (
        <p className="text-sm text-gray-400">Nu sunt meciuri programate momentan în ligile acoperite.</p>
      )}
    </div>
  );
}
