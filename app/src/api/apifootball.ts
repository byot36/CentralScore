import { apiGet } from './client';

// API-Football (api-sports.io) — folosit DOAR pentru evenimente live (gol,
// cartonaș galben/roșu) ale echipelor favorite, ca să nu irosim bugetul zilnic
// de 100 de cereri gratuite. Nu se folosește pentru lista principală de meciuri.

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
