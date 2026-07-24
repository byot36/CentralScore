import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matches as mockMatches } from '../data/mock';
import { isLiveApiConfigured } from '../api/client';
import { fetchFootballDataMatchById } from '../api/footballdata';
import { useMatches } from '../context/MatchesContext';
import type { Lineup, Match, Player, TeamStats } from '../types';

const TABS = ['Rezumat', 'Aliniații', 'Statistici', 'Info'] as const;
type Tab = (typeof TABS)[number];

export default function MatchDetail() {
  const { id } = useParams();
  const mockMatch = mockMatches.find((m) => m.id === id);
  const { matches } = useMatches();
  const knownMatch = matches.find((m) => m.id === id);
  const [match, setMatch] = useState<Match | undefined>(mockMatch ?? knownMatch);
  const [tab, setTab] = useState<Tab>('Rezumat');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Meciul e deja în lista principală (încărcată o singură dată la pornire)
    // — evităm o cerere API suplimentară, care altfel se lovea des de limita
    // de request-uri (eroare 429) a planului gratuit.
    if (mockMatch || knownMatch || !isLiveApiConfigured || !id) return;
    fetchFootballDataMatchById(id)
      .then(setMatch)
      .catch((err) => setError(err.message?.includes('429') ? 'Prea multe cereri către sursa de date momentan — încearcă din nou peste un minut.' : err.message));
  }, [id, mockMatch, knownMatch]);

  useEffect(() => {
    if (knownMatch) setMatch(knownMatch);
  }, [knownMatch]);

  if (!match) {
    return (
      <div>
        <p>{error ? `Eroare: ${error}` : 'Se încarcă...'}</p>
        <Link to="/" className="text-[#00c853]">Înapoi</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="text-sm text-gray-400 hover:text-white">← Toate meciurile</Link>

      <div className="mt-3 bg-[#111827] border border-white/10 rounded-lg p-5 text-center">
        <div className="text-xs text-gray-400 mb-2">
          {match.status === 'live' ? (
            <span className="text-[#00c853] font-semibold">● Live · {match.minute}'</span>
          ) : match.status === 'finished' ? 'Final' : (
            new Date(`${match.date}T${match.time}:00`).toLocaleString('ro-RO', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })
          )}
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-1 w-28">
            {match.homeTeam.logo.startsWith('http') ? (
              <img src={match.homeTeam.logo} alt={match.homeTeam.name} className="w-10 h-10 object-contain" />
            ) : (
              <span className="text-3xl">{match.homeTeam.logo}</span>
            )}
            <span className="font-medium text-sm">{match.homeTeam.name}</span>
          </div>
          <div className="text-3xl font-bold tabular-nums">
            {match.status === 'scheduled' ? '-' : match.homeScore} - {match.status === 'scheduled' ? '-' : match.awayScore}
          </div>
          <div className="flex flex-col items-center gap-1 w-28">
            {match.awayTeam.logo.startsWith('http') ? (
              <img src={match.awayTeam.logo} alt={match.awayTeam.name} className="w-10 h-10 object-contain" />
            ) : (
              <span className="text-3xl">{match.awayTeam.logo}</span>
            )}
            <span className="font-medium text-sm">{match.awayTeam.name}</span>
          </div>
        </div>
        {match.manOfTheMatch && (
          <div className="mt-3 text-xs text-yellow-400">
            ⭐ Omul meciului: {match.manOfTheMatch}
          </div>
        )}
      </div>

      <div className="flex gap-1 mt-4 border-b border-white/10 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm shrink-0 border-b-2 -mb-px ${
              tab === t ? 'border-[#00c853] text-white' : 'border-transparent text-gray-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'Rezumat' && <Summary events={match.events} />}
        {tab === 'Aliniații' && (
          <Lineups home={match.homeLineup} away={match.awayLineup} homeName={match.homeTeam.name} awayName={match.awayTeam.name} />
        )}
        {tab === 'Statistici' && <Stats home={match.homeStats} away={match.awayStats} homeName={match.homeTeam.name} awayName={match.awayTeam.name} />}
        {tab === 'Info' && (
          <InfoTab stadium={match.stadium} capacity={match.stadiumCapacity} referee={match.referee} tv={match.tvChannels} />
        )}
      </div>
    </div>
  );
}

function eventIcon(type: string) {
  switch (type) {
    case 'goal': return '⚽';
    case 'yellow': return '🟨';
    case 'red': return '🟥';
    case 'sub-in': return '🔺';
    case 'sub-out': return '🔻';
    default: return '💬';
  }
}

function Summary({ events }: { events: import('../types').MatchEvent[] }) {
  if (events.length === 0) return <p className="text-gray-400 text-sm">Meciul nu a început încă.</p>;
  return (
    <ul className="space-y-3">
      {[...events].reverse().map((e, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="w-8 text-gray-400 shrink-0">{e.minute}'</span>
          <span>{eventIcon(e.type)}</span>
          <span className="text-gray-200">{e.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Lineups({ home, away, homeName, awayName }: { home: Lineup; away: Lineup; homeName: string; awayName: string }) {
  if (home.starting.length === 0 && away.starting.length === 0) {
    const knownCoaches = home.coach.name !== 'Necunoscut' || away.coach.name !== 'Necunoscut';
    return (
      <p className="text-gray-400 text-sm">
        {knownCoaches
          ? `Aliniațiile oficiale nu au fost anunțate încă. Antrenori: ${home.coach.name} vs ${away.coach.name}.`
          : 'Aliniații, poziții pe teren și jucători individuali nu sunt disponibile pe planul gratuit al sursei de date folosite.'}
      </p>
    );
  }
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      <TeamLineup title={homeName} lineup={home} />
      <TeamLineup title={awayName} lineup={away} />
    </div>
  );
}

function TeamLineup({ title, lineup }: { title: string; lineup: Lineup }) {
  return (
    <div>
      <h3 className="font-semibold mb-1">{title} · {lineup.formation}</h3>
      <p className="text-xs text-gray-400 mb-2">
        Antrenor: {lineup.coach.name} (n. {lineup.coach.birthDate}) — {lineup.coach.formerClubs.join(', ')}
        {lineup.coach.playedAsFootballer && lineup.coach.playerClubs && (
          <> · Fost jucător la: {lineup.coach.playerClubs.join(', ')}</>
        )}
      </p>
      <p className="text-xs font-semibold text-gray-300 mt-3 mb-1">Titulari</p>
      <ul className="space-y-1 text-sm">
        {lineup.starting.map((p) => <PlayerRow key={p.id} p={p} />)}
      </ul>
      <p className="text-xs font-semibold text-gray-300 mt-3 mb-1">Rezerve</p>
      <ul className="space-y-1 text-sm">
        {lineup.bench.map((p) => <PlayerRow key={p.id} p={p} />)}
      </ul>
      {lineup.unavailable.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-300 mt-3 mb-1">Indisponibili</p>
          <ul className="space-y-1 text-sm">
            {lineup.unavailable.map((p) => (
              <li key={p.id} className="text-gray-400">{p.name} — {p.outReason}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function PlayerRow({ p }: { p: Player }) {
  return (
    <li className="flex items-center gap-2">
      <img src={p.photo} alt={p.name} className="w-6 h-6 rounded-full bg-gray-700" />
      <span className="w-5 text-gray-500 text-xs">{p.number}</span>
      <span className="flex-1">{p.name}</span>
      <span className="text-xs text-gray-500">{p.position}</span>
      <span className="text-xs text-[#00c853]">{p.marketValue}</span>
    </li>
  );
}

function Stats({ home, away, homeName, awayName }: { home: TeamStats; away: TeamStats; homeName: string; awayName: string }) {
  const rows: [string, number, number][] = [
    ['Posesie (%)', home.possession, away.possession],
    ['Suturi', home.shots, away.shots],
    ['Suturi pe poartă', home.shotsOnTarget, away.shotsOnTarget],
    ['Pase', home.passes, away.passes],
    ['Cornere', home.corners, away.corners],
    ['Faulturi', home.fouls, away.fouls],
    ['Cartonașe galbene', home.yellowCards, away.yellowCards],
    ['Cartonașe roșii', home.redCards, away.redCards],
  ];
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>{homeName}</span>
        <span>{awayName}</span>
      </div>
      <div className="space-y-3">
        {rows.map(([label, h, a]) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{h}</span>
              <span className="text-gray-400">{label}</span>
              <span>{a}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden flex">
              <div className="bg-[#2563eb]" style={{ width: `${(h / (h + a || 1)) * 100}%` }} />
              <div className="bg-[#00c853]" style={{ width: `${(a / (h + a || 1)) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoTab({ stadium, capacity, referee, tv }: { stadium: string; capacity: number; referee: string; tv: string[] }) {
  return (
    <div className="space-y-3 text-sm">
      <div><span className="text-gray-400">Stadion:</span> {stadium}</div>
      <div><span className="text-gray-400">Capacitate:</span> {capacity.toLocaleString('ro-RO')} locuri</div>
      <div><span className="text-gray-400">Arbitru:</span> {referee}</div>
      <div><span className="text-gray-400">Canale TV (România):</span> {tv.join(', ') || 'Necunoscut'}</div>
    </div>
  );
}
