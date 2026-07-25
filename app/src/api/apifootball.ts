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

// Convertește evenimentele reale API-Football (gol/cartonaș/schimbare) în
// formatul folosit de tab-ul "Rezumat" al aplicației — pentru meciurile
// amicale, care nu au evenimente incluse deja (spre deosebire de football-data.org).
export function mapFootballEventsToMatchEvents(
  events: FootballEvent[],
  homeTeamId: number
): Match['events'] {
  return events.map((e) => {
    const isHome = e.team.id === homeTeamId;
    const minute = e.time.elapsed + (e.time.extra ?? 0);
    if (e.type === 'Goal') {
      return {
        minute,
        type: 'goal' as const,
        team: isHome ? ('home' as const) : ('away' as const),
        player: e.player.name,
        assist: e.assist.name ?? undefined,
        text: e.assist.name ? `${e.player.name} (assist: ${e.assist.name})` : e.player.name,
      };
    }
    if (e.type === 'Card') {
      return {
        minute,
        type: e.detail.toLowerCase().includes('red') ? ('red' as const) : ('yellow' as const),
        team: isHome ? ('home' as const) : ('away' as const),
        player: e.player.name,
        text: e.player.name,
      };
    }
    if (e.type === 'subst') {
      return {
        minute,
        type: 'sub-in' as const,
        team: isHome ? ('home' as const) : ('away' as const),
        player: e.player.name,
        assist: e.assist.name ?? undefined,
        text: `${e.assist.name ?? '—'} → ${e.player.name}`,
      };
    }
    return {
      minute,
      type: 'comment' as const,
      team: isHome ? ('home' as const) : ('away' as const),
      text: `${e.detail} — ${e.player.name}`,
    };
  });
}

interface FriendlyFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
    venue: { name: string | null };
    referee: string | null;
  };
  league: { name: string };
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

// Meciuri amicale — nu sunt disponibile pe football-data.org (planul
// gratuit), doar prin API-Football. Amicalele sunt împărțite pe mai multe
// ligi: 5 = "World - Friendlies" (naționale), 667 = "Club Friendlies".
// Am încercat și varianta "cere toate meciurile din lume de azi, fără
// filtru de ligă" — dar răspunsul e uriaș (mii de meciuri din toate
// competițiile) și poate depăși timeout-ul sau limita de payload, făcând
// amicalele să dispară complet din listă. Cerem deci explicit doar aceste
// două ligi cunoscute — mai rapid și mai fiabil, chiar dacă teoretic ar
// putea rata un amical dintr-o ligă foarte obscură.
// Nu cerem doar "azi" — arătăm o fereastră de 7 zile (azi + următoarele 6),
// ca amicalele viitoare (mâine, poimâine etc.) să fie vizibile din timp, nu
// doar în ziua exactă în care se joacă.
export async function fetchFriendliesToday(): Promise<Match[]> {
  const from = new Date().toISOString().slice(0, 10);
  const to = new Date(Date.now() + 6 * 24 * 3600_000).toISOString().slice(0, 10);
  const season = new Date().getFullYear();
  const [international, club] = await Promise.all([
    apiGet<{ response: FriendlyFixture[] }>(`/apifootball/fixtures?league=5&season=${season}&from=${from}&to=${to}`),
    apiGet<{ response: FriendlyFixture[] }>(`/apifootball/fixtures?league=667&season=${season}&from=${from}&to=${to}`),
  ]);
  const seen = new Set<number>();
  const combined = [...international.response, ...club.response].filter((f) => {
    if (seen.has(f.fixture.id)) return false;
    seen.add(f.fixture.id);
    return true;
  });
  return combined.map(mapFriendly);
}

export interface TransferEntry {
  id: string;
  playerId: number;
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
  33, 40, 42, 50, // Man United, Liverpool, Arsenal, Man City
  541, 529, // Real Madrid, Barcelona
  505, 489, // Inter, AC Milan
  157, // Bayern Munich
  85, // PSG
];

const TRANSFERS_CACHE_KEY = 'centralscore-transfers-cache';
const TRANSFERS_CACHE_TTL_MS = 48 * 3600_000;

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
        playerId: p.player.id,
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

export interface PlayerStats {
  season: number;
  name: string;
  photo: string;
  age: number | null;
  nationality: string | null;
  position: string | null;
  team: string | null;
  appearances: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  rating: string | null;
}

interface PlayerStatsResponse {
  player: { name: string; photo: string; age: number | null; nationality: string | null };
  statistics: {
    team: { name: string };
    games: { position: string | null; appearences: number | null; rating: string | null };
    goals: { total: number | null; assists: number | null };
    cards: { yellow: number | null; red: number | null };
  }[];
}

// Statistici reale de jucător, cerute doar la click pe un transfer — nu la
// încărcarea listei — ca să nu consumăm inutil bugetul. Sezonul curent poate
// să nu aibă încă statistici (jucătorul tocmai s-a transferat, sezonul abia
// a început), așa că încercăm și sezonul anterior înainte să renunțăm.
export async function fetchPlayerStats(playerId: number): Promise<PlayerStats | null> {
  // Cheia API-Football gratuită folosită aici are acces la statistici de
  // jucători doar pentru sezoanele 2022-2024 (confirmat de eroarea reală a
  // API-ului: "Free plans do not have access to this season, try from 2022
  // to 2024."). Sezonul curent/recent necesită un plan plătit. Afișăm deci
  // cele mai recente statistici disponibile pe planul gratuit (2024), nu
  // sezonul curent — mai bine date reale mai vechi decât date inventate.
  const apiErrors: string[] = [];
  for (const season of [2024, 2023, 2022]) {
    const data = await apiGet<{ response: PlayerStatsResponse[]; errors: unknown }>(
      `/apifootball/players?id=${playerId}&season=${season}`
    );
    // API-Football răspunde cu HTTP 200 chiar și când planul nu permite
    // cererea (ex. sezon interzis pe planul gratuit) — eroarea reală vine în
    // câmpul "errors", nu ca status HTTP, deci trebuie verificată explicit.
    if (data.errors && (Array.isArray(data.errors) ? data.errors.length : Object.keys(data.errors).length)) {
      apiErrors.push(typeof data.errors === 'object' ? JSON.stringify(data.errors) : String(data.errors));
      continue;
    }
    const entry = data.response[0];
    if (!entry) continue;
    const stat = entry.statistics.find((s) => s.games.appearences) ?? entry.statistics[0];
    if (!stat) continue;
    return {
      season,
      name: entry.player.name,
      photo: entry.player.photo,
      age: entry.player.age,
      nationality: entry.player.nationality,
      position: stat.games.position ?? null,
      team: stat.team.name ?? null,
      appearances: stat.games.appearences ?? 0,
      goals: stat.goals.total ?? 0,
      assists: stat.goals.assists ?? 0,
      yellowCards: stat.cards.yellow ?? 0,
      redCards: stat.cards.red ?? 0,
      rating: stat.games.rating ?? null,
    };
  }
  if (apiErrors.length) throw new Error(apiErrors[0]);
  return null;
}
