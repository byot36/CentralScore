import { apiGet } from './client';
import type { Match, TeamStats } from '../types';

// football-data.org (plan gratuit) — acoperă Premier League, La Liga, Serie A,
// Bundesliga, Ligue 1, Champions League, Cupa Mondială, EURO. Nu oferă
// aliniații/evenimente minut-cu-minut pe planul gratuit — doar scor și status.
export const FOOTBALL_DATA_COMPETITION_IDS: Record<string, number> = {
  epl: 2021,
  laliga: 2014,
  seriea: 2019,
  bundesliga: 2002,
  ligue1: 2015,
  ucl: 2001,
  wc: 2000,
  euro: 2018,
};

interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  competition: { id: number; name: string };
  homeTeam: { id: number; name: string; crest?: string };
  awayTeam: { id: number; name: string; crest?: string };
  score: { fullTime: { home: number | null; away: number | null } };
  venue?: string;
  referees?: Array<{ name: string }>;
}

function mapStatus(status: string): Match['status'] {
  if (status === 'IN_PLAY' || status === 'PAUSED' || status === 'LIVE') return 'live';
  if (status === 'FINISHED') return 'finished';
  return 'scheduled';
}

function mapFDMatch(m: FDMatch): Match {
  const zeroStats: TeamStats = { shots: 0, shotsOnTarget: 0, possession: 50, passes: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0 };
  return {
    id: `fd-${m.id}`,
    competitionId: String(m.competition.id),
    date: m.utcDate.slice(0, 10),
    time: m.utcDate.slice(11, 16),
    status: mapStatus(m.status),
    homeTeam: { id: `fd-team-${m.homeTeam.id}`, name: m.homeTeam.name, logo: m.homeTeam.crest ?? '⚪' },
    awayTeam: { id: `fd-team-${m.awayTeam.id}`, name: m.awayTeam.name, logo: m.awayTeam.crest ?? '⚪' },
    homeScore: m.score.fullTime.home ?? 0,
    awayScore: m.score.fullTime.away ?? 0,
    stadium: m.venue ?? '—',
    stadiumCapacity: 0,
    referee: m.referees?.[0]?.name ?? '—',
    tvChannels: [],
    events: [],
    homeLineup: { formation: '—', starting: [], bench: [], coach: { id: '', name: 'Necunoscut', birthDate: '', formerClubs: [], playedAsFootballer: false }, unavailable: [] },
    awayLineup: { formation: '—', starting: [], bench: [], coach: { id: '', name: 'Necunoscut', birthDate: '', formerClubs: [], playedAsFootballer: false }, unavailable: [] },
    homeStats: zeroStats,
    awayStats: zeroStats,
  };
}

export async function fetchFootballDataMatchById(id: string): Promise<Match> {
  const numericId = id.replace(/^fd-/, '');
  // GET /v4/matches/{id} întoarce meciul direct la nivelul rădăcină, nu împachetat.
  const data = await apiGet<FDMatch>(`/footballdata/matches/${numericId}`);
  return mapFDMatch(data);
}

export async function fetchFootballDataMatchesByDate(date: string): Promise<Match[]> {
  const competitionIds = Object.values(FOOTBALL_DATA_COMPETITION_IDS).join(',');
  const data = await apiGet<{ matches: FDMatch[] }>(
    `/footballdata/matches?dateFrom=${date}&dateTo=${date}&competitions=${competitionIds}`
  );
  return data.matches.map(mapFDMatch);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Când nu sunt meciuri azi (pauză de sezon etc.), arătăm în schimb următoarele
// meciuri programate din fiecare competiție, ca ecranul să nu rămână gol.
// /v4/matches limitează intervalul dateFrom/dateTo la 10 zile, deci interogăm
// fiecare competiție separat (fără filtru de dată = tot sezonul curent).
// Cererile se fac una câte una, cu pauză între ele — planul gratuit
// football-data.org permite doar ~10 cereri/minut (partajate între toți
// utilizatorii aplicației, prin același Worker); cererile simultane pentru
// toate cele 8 competiții loveau frecvent limita (eroare 429), iar ligile
// care eșuau dispăreau din listă.
export async function fetchAllSeasonMatches(): Promise<Match[]> {
  const all: Match[] = [];
  for (const id of Object.values(FOOTBALL_DATA_COMPETITION_IDS)) {
    try {
      const data = await apiGet<{ matches: FDMatch[] }>(`/footballdata/competitions/${id}/matches`);
      all.push(...data.matches.map(mapFDMatch));
    } catch {
      // o competiție eșuată nu trebuie să blocheze restul — continuăm
    }
    await delay(6500);
  }
  return all;
}
