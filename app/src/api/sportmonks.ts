import { apiGet } from './client';
import type { Match, MatchEvent, Player, Lineup, TeamStats } from '../types';

// Mapare date brute Sportmonks -> modelul intern al aplicației.
// Notă: numele exacte ale câmpurilor pot varia ușor între planuri Sportmonks;
// codul e defensiv (optional chaining + valori implicite) ca să nu crape UI-ul
// dacă un câmp lipsește din planul tău.

const FIXTURE_INCLUDES =
  'participants;scores;venue;league;state;events.type;events.participant;' +
  'lineups.player;lineups.details;coaches;periods';

interface SportmonksFixture {
  id: number;
  starting_at: string;
  state?: { short_name?: string };
  league?: { id: number; name: string };
  venue?: { name?: string; capacity?: number };
  participants?: Array<{
    id: number;
    name: string;
    image_path?: string;
    meta?: { location?: 'home' | 'away' };
  }>;
  scores?: Array<{
    participant_id: number;
    description: string;
    score: { goals: number; participant: 'home' | 'away' };
  }>;
  events?: Array<{
    minute: number;
    type?: { name?: string };
    participant_id?: number;
    player_name?: string;
    related_player_name?: string;
  }>;
  lineups?: Array<{
    player_id: number;
    player_name: string;
    jersey_number?: number;
    participant_id: number;
    type?: { name?: string }; // "lineup" | "bench"
    position?: { name?: string };
    formation_position?: number;
  }>;
}

function emptyLineup(): Lineup {
  return {
    formation: '—',
    starting: [],
    bench: [],
    coach: { id: '', name: 'Necunoscut', birthDate: '', formerClubs: [], playedAsFootballer: false },
    unavailable: [],
  };
}

function mapPlayer(raw: { player_id: number; player_name: string; jersey_number?: number; position?: { name?: string } }): Player {
  return {
    id: String(raw.player_id),
    name: raw.player_name,
    number: raw.jersey_number ?? 0,
    position: raw.position?.name ?? '—',
    nationality: '—',
    birthDate: '—',
    photo: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(raw.player_name)}`,
    marketValue: '—', // Sportmonks nu oferă valori de piață; ar necesita un serviciu separat (ex. Transfermarkt).
    clubHistory: [],
    stats: { shots: 0, passes: 0, goals: 0, assists: 0, errors: 0 },
  };
}

function mapEventType(name?: string): MatchEvent['type'] {
  const n = (name ?? '').toLowerCase();
  if (n.includes('goal')) return 'goal';
  if (n.includes('yellow')) return 'yellow';
  if (n.includes('red')) return 'red';
  if (n.includes('substitution')) return 'sub-in';
  return 'comment';
}

export function mapFixtureToMatch(f: SportmonksFixture): Match {
  const home = f.participants?.find((p) => p.meta?.location === 'home');
  const away = f.participants?.find((p) => p.meta?.location === 'away');

  const homeScore = f.scores?.find((s) => s.score.participant === 'home' && s.description === 'CURRENT')?.score.goals ?? 0;
  const awayScore = f.scores?.find((s) => s.score.participant === 'away' && s.description === 'CURRENT')?.score.goals ?? 0;

  const events: MatchEvent[] = (f.events ?? []).map((e) => ({
    minute: e.minute,
    type: mapEventType(e.type?.name),
    team: e.participant_id === home?.id ? 'home' : 'away',
    player: e.player_name,
    assist: e.related_player_name,
    text: e.player_name
      ? `${e.type?.name ?? 'Eveniment'}: ${e.player_name}${e.related_player_name ? ` (asist: ${e.related_player_name})` : ''}`
      : e.type?.name ?? '',
  }));

  const homeLineup = emptyLineup();
  const awayLineup = emptyLineup();
  for (const l of f.lineups ?? []) {
    const target = l.participant_id === home?.id ? homeLineup : awayLineup;
    const player = mapPlayer(l);
    if (l.type?.name === 'bench') target.bench.push(player);
    else target.starting.push(player);
  }

  const zeroStats: TeamStats = { shots: 0, shotsOnTarget: 0, possession: 50, passes: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0 };

  return {
    id: String(f.id),
    competitionId: String(f.league?.id ?? ''),
    date: f.starting_at?.slice(0, 10) ?? '',
    time: f.starting_at?.slice(11, 16) ?? '',
    status: f.state?.short_name === 'LIVE' ? 'live' : f.state?.short_name === 'FT' ? 'finished' : 'scheduled',
    homeTeam: { id: String(home?.id ?? ''), name: home?.name ?? '—', logo: home?.image_path ?? '⚪' },
    awayTeam: { id: String(away?.id ?? ''), name: away?.name ?? '—', logo: away?.image_path ?? '⚪' },
    homeScore,
    awayScore,
    stadium: f.venue?.name ?? '—',
    stadiumCapacity: f.venue?.capacity ?? 0,
    referee: '—', // necesită include suplimentar 'referees' dacă planul îl oferă
    tvChannels: [], // necesită include 'tvStations' — disponibil doar pe planuri superioare
    events,
    homeLineup,
    awayLineup,
    homeStats: zeroStats,
    awayStats: zeroStats,
  };
}

export async function fetchFixturesByDate(date: string): Promise<Match[]> {
  const data = await apiGet<{ data: SportmonksFixture[] }>(
    `/fixtures/date/${date}?include=${FIXTURE_INCLUDES}`
  );
  return data.data.map(mapFixtureToMatch);
}

export async function fetchFixtureById(id: string): Promise<Match> {
  const data = await apiGet<{ data: SportmonksFixture }>(
    `/fixtures/${id}?include=${FIXTURE_INCLUDES}`
  );
  return mapFixtureToMatch(data.data);
}
