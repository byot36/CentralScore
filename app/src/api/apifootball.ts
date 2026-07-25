import { apiGet } from './client';
import type { Match } from '../types';

// API-Football (api-sports.io) — folosit pentru evenimente live (gol,
// cartonaș galben/roșu) ale echipelor favorite și pentru meciurile amicale
// (nu sunt disponibile pe football-data.org). Bugetul e limitat (100 de
// cereri/zi gratuit), deci fiecare tip de cerere e folosit cu zgârcenie.

export interface FootballEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { name: string };
  assist: { name: string | null };
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string;
}

interface FixtureSearchResult {
  fixture: { id: number; status: { short: string } };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
}

export async function findLiveFixtureByTeams(homeTeamName: string, awayTeamName: string): Promise<number | null> {
  const data = await apiGet<{ response: FixtureSearchResult[] }>('/apifootball/fixtures?live=all');
  const match = data.response.find(
    (f) =>
      f.teams.home.name.toLowerCase().includes(homeTeamName.toLowerCase().split(' ')[0]) &&
      f.teams.away.name.toLowerCase().includes(awayTeamName.toLowerCase().split(' ')[0])
  );
  return match?.fixture.id ?? null;
}

export async function fetchFixtureEvents(fixtureId: number): Promise<FootballEvent[]> {
  const data = await apiGet<{ response: FootballEvent[] }>(`/apifootball/fixtures/events?fixture=${fixtureId}`);
  return data.response;
}

interface FriendlyFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
    venue: { name: string | null };
    referee: string | null;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

function mapFriendlyStatus(short: string): Match['status'] {
  if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(short)) return 'live';
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished';
  return 'scheduled';
}

function mapFriendly(f: FriendlyFixture): Match {
  return {
    id: `af-friendly-${f.fixture.id}`,
    competitionId: 'friendlies',
    date: f.fixture.date.slice(0, 10),
    time: f.fixture.date.slice(11, 16),
    status: mapFriendlyStatus(f.fixture.status.short),
    homeTeam: { id: `af-team-${f.teams.home.id}`, name: f.teams.home.name, logo: f.teams.home.logo },
    awayTeam: { id: `af-team-${f.teams.away.id}`, name: f.teams.away.name, logo: f.teams.away.logo },
    homeScore: f.goals.home ?? 0,
    awayScore: f.goals.away ?? 0,
    stadium: f.fixture.venue.name ?? '—',
    referee: f.fixture.referee ?? '—',
    tvChannels: [],
    events: [],
    homeLineup: { formation: '—', starting: [], bench: [], coach: { id: '', name: 'Necunoscut', birthDate: '', formerClubs: [], playedAsFootballer: false }, unavailable: [] },
    awayLineup: { formation: '—', starting: [], bench: [], coach: { id: '', name: 'Necunoscut', birthDate: '', formerClubs: [], playedAsFootballer: false }, unavailable: [] },
  };
}

// Meciuri amicale internaționale — nu sunt disponibile pe football-data.org
// (planul gratuit), doar prin API-Football (liga 5 = "World - Friendlies").
// Cerem o singură dată la deschiderea aplicației (nu periodic), ca să nu
// consumăm bugetul zilnic limitat.
export async function fetchFriendliesToday(): Promise<Match[]> {
  const today = new Date().toISOString().slice(0, 10);
  const season = new Date().getFullYear();
  const data = await apiGet<{ response: FriendlyFixture[] }>(
    `/apifootball/fixtures?league=5&season=${season}&date=${today}`
  );
  return data.response.map(mapFriendly);
}

export interface TransferEntry {
  id: string;
  playerName: string;
  date: string;
  type: string | null;
  teamOut: { id: number; name: string; logo: string };
  teamIn: { id: number; name: string; logo: string };
}

interface TransferPlayerResponse {
  player: { id: number; name: string };
  update: string;
  transfers: {
    date: string;
    type: string | null;
    teams: {
      in: { id: number; name: string; logo: string };
      out: { id: number; name: string; logo: string };
    };
  }[];
}

// API-Football nu oferă un flux global "toate transferurile din lume" pe
// planul gratuit — doar transferuri per echipă (/transfers?team=ID). Pentru
// a arăta transferuri reale (nu inventate), cerem istoricul pentru un set
// fix de cluburi mari din ligile deja urmărite în app, apoi păstrăm doar
// transferurile din ultimele 30 de zile. Cererile sunt cache-uite 24h în
// localStorage ca să nu consumăm bugetul zilnic limitat (100 cereri/zi).
const TRACKED_CLUB_IDS = [
  33, 40, 42, 49, 50, 47, // Man United, Liverpool, Arsenal, Chelsea, Man City, Tottenham
  541, 529, 530, 548, // Real Madrid, Barcelona, Atletico Madrid, Real Sociedad
  505, 496, 489, // Inter, Juventus, AC Milan
  157, 165, // Bayern Munich, Borussia Dortmund
  85, 91, // PSG, Monaco
];

const TRANSFERS_CACHE_KEY = 'centralscore-transfers-cache';
const TRANSFERS_CACHE_TTL_MS = 24 * 3600_000;

export async function fetchRecentTransfers(): Promise<TransferEntry[]> {
  try {
    const cached = localStorage.getItem(TRANSFERS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as { fetchedAt: number; entries: TransferEntry[] };
      if (Date.now() - parsed.fetchedAt < TRANSFERS_CACHE_TTL_MS) return parsed.entries;
    }
  } catch {
    // cache coruptă, ignorăm și cerem din nou
  }

  const cutoff = Date.now() - 30 * 24 * 3600_000;
  const results = await Promise.all(
    TRACKED_CLUB_IDS.map((id) =>
      apiGet<{ response: TransferPlayerResponse[] }>(`/apifootball/transfers?team=${id}`).catch(() => ({ response: [] }))
    )
  );

  const entries: TransferEntry[] = [];
  for (const data of results) {
    for (const p of data.response) {
      const latest = p.transfers[0];
      if (!latest) continue;
      const ts = new Date(latest.date).getTime();
      if (isNaN(ts) || ts < cutoff) continue;
      entries.push({
        id: `${p.player.id}-${latest.date}`,
        playerName: p.player.name,
        date: latest.date,
        type: latest.type,
        teamOut: latest.teams.out,
        teamIn: latest.teams.in,
      });
    }
  }
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  try {
    localStorage.setItem(TRANSFERS_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), entries }));
  } catch {
    // localStorage plin — nu blocăm afișarea datelor
  }

  return entries;
}
