import { competitions } from '../data/mock';
import MatchCard from '../components/MatchCard';
import { useMatches } from '../context/MatchesContext';

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
