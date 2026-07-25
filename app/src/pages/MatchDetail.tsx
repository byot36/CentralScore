import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matches as mockMatches } from '../data/mock';
import { isLiveApiConfigured } from '../api/client';
import { fetchFootballDataMatchById } from '../api/footballdata';
import { fetchFixtureEvents, mapFootballEventsToMatchEvents } from '../api/apifootball';
import { useMatches } from '../context/MatchesContext';
import { useLanguage } from '../context/LanguageContext';
import type { Lineup, Match, Player, TeamStats } from '../types';

const TABS = ['summary', 'lineups', 'stats', 'info'] as const;
type Tab = (typeof TABS)[number];

export default function MatchDetail() {
  const { id } = useParams();
  const { t, locale } = useLanguage();
  const mockMatch = mockMatches.find((m) => m.id === id);
  const { matches } = useMatches();
  const knownMatch = matches.find((m) => m.id === id);
  const [match, setMatch] = useState<Match | undefined>(mockMatch ?? knownMatch);
  const [tab, setTab] = useState<Tab>('summary');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Meciul e deja în lista principală (încărcată o singură dată la pornire)
    // — evităm o cerere API suplimentară, care altfel se lovea des de limita
    // de request-uri (eroare 429) a planului gratuit.
    if (mockMatch || knownMatch || !isLiveApiConfigured || !id) return;
    fetchFootballDataMatchById(id)
      .then(setMatch)
      .catch((err) => setError(err.message?.includes('429') ? t('match_rate_limited') : err.message));
  }, [id, mockMatch, knownMatch]);

  useEffect(() => {
    if (knownMatch) setMatch(knownMatch);
  }, [knownMatch]);

  useEffect(() => {
    // Amicalele nu vin cu evenimente (goluri/cartonașe) incluse, spre
    // deosebire de meciurile din ligile de pe football-data.org — le cerem
    // separat, o singură dată, la deschiderea paginii meciului.
    if (!match || match.competitionId !== 'friendlies' || match.events.length > 0) return;
    const fixtureId = Number(match.id.replace('af-friendly-', ''));
    const homeTeamId = Number(match.homeTeam.id.replace('af-team-', ''));
    if (!fixtureId || !homeTeamId) return;
    fetchFixtureEvents(fixtureId)
      .then((events) => {
        if (events.length === 0) return;
        setMatch((prev) => (prev ? { ...prev, events: mapFootballEventsToMatchEvents(events, homeTeamId) } : prev));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id]);

  if (!match) {
    return (
      <div>
        <p>{error ? `${t('match_error')}: ${error}` : t('match_loading')}</p>
        <Link to="/" className="text-[#00c853]">{t('match_back')}</Link>
      </div>
    );
  }

  const TAB_LABELS: Record<Tab, string> = {
    summary: t('tab_summary'),
    lineups: t('tab_lineups'),
    stats: t('tab_stats'),
    info: t('tab_info'),
  };

  return (
    <div>
      <Link to="/" className="text-sm text-gray-400 hover:text-white">{t('match_back')}</Link>

      <div className="mt-3 bg-[#111827] border border-white/10 rounded-lg p-5 text-center">
        <div className="text-xs text-gray-400 mb-2">
          {match.status === 'live' ? (
            <span className="text-[#00c853] font-semibold">● {t('match_live')} · {match.minute}'</span>
          ) : match.status === 'finished' ? t('match_final') : (
            new Date(`${match.date}T${match.time}:00`).toLocaleString(locale, {
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
            ⭐ {t('match_man_of_match')}: {match.manOfTheMatch}
          </div>
        )}
      </div>

      <div className="flex gap-1 mt-4 border-b border-white/10 overflow-x-auto">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-3 py-2 text-sm shrink-0 border-b-2 -mb-px ${
              tab === tabKey ? 'border-[#00c853] text-white' : 'border-transparent text-gray-400'
            }`}
          >
            {TAB_LABELS[tabKey]}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'summary' && <Summary events={match.events} status={match.status} />}
        {tab === 'lineups' && (
          <Lineups home={match.homeLineup} away={match.awayLineup} homeName={match.homeTeam.name} awayName={match.awayTeam.name} />
        )}
        {tab === 'stats' && <Stats home={match.homeStats} away={match.awayStats} homeName={match.homeTeam.name} awayName={match.awayTeam.name} />}
        {tab === 'info' && (
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

function Summary({ events, status }: { events: import('../types').MatchEvent[]; status: Match['status'] }) {
  const { t } = useLanguage();
  if (events.length === 0) {
    const key = status === 'scheduled' ? 'summary_not_started' : 'summary_no_events_yet';
    return <p className="text-gray-400 text-sm">{t(key)}</p>;
  }
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
  const { t } = useLanguage();
  if (home.starting.length === 0 && away.starting.length === 0) {
    const knownCoaches = home.coach.name !== 'Necunoscut' || away.coach.name !== 'Necunoscut';
    return (
      <p className="text-gray-400 text-sm">
        {knownCoaches
          ? t('lineups_unofficial', { home: home.coach.name, away: away.coach.name })
          : t('lineups_unavailable')}
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
  const { t } = useLanguage();
  return (
    <div>
      <h3 className="font-semibold mb-1">{title} · {lineup.formation}</h3>
      <p className="text-xs text-gray-400 mb-2">
        {t('lineups_coach')}: {lineup.coach.name} ({t('lineups_born')} {lineup.coach.birthDate}) — {lineup.coach.formerClubs.join(', ')}
        {lineup.coach.playedAsFootballer && lineup.coach.playerClubs && (
          <> · {t('lineups_former_player')}: {lineup.coach.playerClubs.join(', ')}</>
        )}
      </p>
      <p className="text-xs font-semibold text-gray-300 mt-3 mb-1">{t('lineups_starting')}</p>
      <ul className="space-y-1 text-sm">
        {lineup.starting.map((p) => <PlayerRow key={p.id} p={p} />)}
      </ul>
      <p className="text-xs font-semibold text-gray-300 mt-3 mb-1">{t('lineups_bench')}</p>
      <ul className="space-y-1 text-sm">
        {lineup.bench.map((p) => <PlayerRow key={p.id} p={p} />)}
      </ul>
      {lineup.unavailable.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-300 mt-3 mb-1">{t('lineups_unavailable_players')}</p>
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

function Stats({ home, away, homeName, awayName }: { home?: TeamStats; away?: TeamStats; homeName: string; awayName: string }) {
  const { t } = useLanguage();
  if (!home || !away) return <p className="text-gray-400 text-sm">{t('stats_unavailable')}</p>;
  const rows: [string, number, number][] = [
    [t('stats_possession'), home.possession, away.possession],
    [t('stats_shots'), home.shots, away.shots],
    [t('stats_shots_target'), home.shotsOnTarget, away.shotsOnTarget],
    [t('stats_passes'), home.passes, away.passes],
    [t('stats_corners'), home.corners, away.corners],
    [t('stats_fouls'), home.fouls, away.fouls],
    [t('stats_yellow'), home.yellowCards, away.yellowCards],
    [t('stats_red'), home.redCards, away.redCards],
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

function InfoTab({ stadium, capacity, referee, tv }: { stadium: string; capacity?: number; referee: string; tv: string[] }) {
  const { t, locale } = useLanguage();
  return (
    <div className="space-y-3 text-sm">
      <div><span className="text-gray-400">{t('info_stadium')}:</span> {stadium}</div>
      <div><span className="text-gray-400">{t('info_capacity')}:</span> {capacity ? `${capacity.toLocaleString(locale)} ${t('seats')}` : t('info_capacity_unavailable')}</div>
      <div><span className="text-gray-400">{t('info_referee')}:</span> {referee}</div>
      <div><span className="text-gray-400">{t('info_tv')}:</span> {tv.join(', ') || t('info_unknown')}</div>
    </div>
  );
}
