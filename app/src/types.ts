export interface Team {
  id: string;
  name: string;
  logo: string;
}

export interface Competition {
  id: string;
  name: string;
  country: string;
  logo: string;
  featured: boolean;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  nationality: string;
  birthDate: string;
  photo: string;
  marketValue: string;
  nationalTeam?: string;
  clubHistory: string[];
  stats: {
    shots: number;
    passes: number;
    goals: number;
    assists: number;
    errors: number;
  };
  outReason?: string;
}

export interface Coach {
  id: string;
  name: string;
  birthDate: string;
  formerClubs: string[];
  playedAsFootballer: boolean;
  playerClubs?: string[];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow' | 'red' | 'sub-in' | 'sub-out' | 'comment';
  team: 'home' | 'away';
  player?: string;
  assist?: string;
  text: string;
}

export interface Lineup {
  formation: string;
  starting: Player[];
  bench: Player[];
  coach: Coach;
  unavailable: Player[];
}

export interface TeamStats {
  shots: number;
  shotsOnTarget: number;
  possession: number;
  passes: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
}

export interface Match {
  id: string;
  competitionId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'finished';
  minute?: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  stadium: string;
  stadiumCapacity: number;
  referee: string;
  tvChannels: string[];
  manOfTheMatch?: string;
  events: MatchEvent[];
  homeLineup: Lineup;
  awayLineup: Lineup;
  homeStats: TeamStats;
  awayStats: TeamStats;
}
