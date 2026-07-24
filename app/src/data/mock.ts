import type { Competition, Match, MatchEvent, Player, Coach } from '../types';

export const competitions: Competition[] = [
  { id: 'ucl', name: 'UEFA Champions League', country: 'Europa', logo: '🏆', featured: true },
  { id: 'uel', name: 'UEFA Europa League', country: 'Europa', logo: '🥈', featured: true },
  { id: 'uecl', name: 'UEFA Conference League', country: 'Europa', logo: '🥉', featured: true },
  { id: 'euro', name: 'Campionatul EURO', country: 'Europa', logo: '🇪🇺', featured: true },
  { id: 'wc', name: 'Cupa Mondială', country: 'Mondial', logo: '🌍', featured: true },
  { id: 'nations', name: 'UEFA Nations League', country: 'Europa', logo: '🎖️', featured: true },
  { id: 'epl', name: 'Premier League', country: 'Anglia', logo: '🏴', featured: true },
  { id: 'laliga', name: 'La Liga', country: 'Spania', logo: '🇪🇸', featured: true },
  { id: 'seriea', name: 'Serie A', country: 'Italia', logo: '🇮🇹', featured: true },
  { id: 'bundesliga', name: 'Bundesliga', country: 'Germania', logo: '🇩🇪', featured: true },
  { id: 'ligue1', name: 'Ligue 1', country: 'Franța', logo: '🇫🇷', featured: true },
  { id: 'liga1ro', name: 'Superliga României', country: 'România', logo: '🇷🇴', featured: true },
  { id: 'liga2ro', name: 'Liga a 2-a a României', country: 'România', logo: '🇷🇴', featured: true },
  { id: 'superliga-dk', name: 'Superliga (Danemarca)', country: 'Danemarca', logo: '🇩🇰', featured: true, sportmonksId: 271 },
  { id: 'premiership-sco', name: 'Premiership (Scoția)', country: 'Scoția', logo: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', featured: true, sportmonksId: 501 },
];

function player(
  id: string, name: string, number: number, position: string, nationality: string,
  birthDate: string, marketValue: string, clubHistory: string[], nationalTeam?: string,
  outReason?: string
): Player {
  return {
    id, name, number, position, nationality, birthDate,
    photo: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
    marketValue, nationalTeam, clubHistory, outReason,
    stats: {
      shots: Math.floor(Math.random() * 6),
      passes: 20 + Math.floor(Math.random() * 60),
      goals: Math.floor(Math.random() * 2),
      assists: Math.floor(Math.random() * 2),
      errors: Math.floor(Math.random() * 2),
    },
  };
}

function coach(name: string, birthDate: string, formerClubs: string[], playedAsFootballer: boolean, playerClubs?: string[]): Coach {
  return { id: name, name, birthDate, formerClubs, playedAsFootballer, playerClubs };
}

const realMadridStarting: Player[] = [
  player('rm-1', 'Thibaut Courtois', 1, 'Portar', 'Belgia', '11.05.1992', '€25M', ['Genk', 'Chelsea', 'Atlético Madrid', 'Real Madrid'], 'Belgia'),
  player('rm-2', 'Dani Carvajal', 2, 'Fundaș dreapta', 'Spania', '11.01.1992', '€12M', ['Real Madrid', 'Bayer Leverkusen'], 'Spania'),
  player('rm-3', 'Éder Militão', 3, 'Fundaș central', 'Brazilia', '18.01.1998', '€40M', ['São Paulo', 'Porto', 'Real Madrid'], 'Brazilia'),
  player('rm-4', 'Antonio Rüdiger', 22, 'Fundaș central', 'Germania', '03.03.1993', '€20M', ['Stuttgart', 'Roma', 'Chelsea', 'Real Madrid'], 'Germania'),
  player('rm-5', 'Ferland Mendy', 23, 'Fundaș stânga', 'Franța', '08.06.1995', '€18M', ['Le Havre', 'Lyon', 'Real Madrid'], 'Franța'),
  player('rm-6', 'Jude Bellingham', 5, 'Mijlocaș ofensiv', 'Anglia', '29.06.2003', '€180M', ['Birmingham', 'Borussia Dortmund', 'Real Madrid'], 'Anglia'),
  player('rm-7', 'Federico Valverde', 15, 'Mijlocaș central', 'Uruguay', '22.07.1998', '€110M', ['Peñarol', 'Real Madrid'], 'Uruguay'),
  player('rm-8', 'Aurélien Tchouaméni', 18, 'Mijlocaș defensiv', 'Franța', '27.01.2000', '€80M', ['Bordeaux', 'Monaco', 'Real Madrid'], 'Franța'),
  player('rm-9', 'Vinícius Júnior', 7, 'Extremă stânga', 'Brazilia', '12.07.2000', '€200M', ['Flamengo', 'Real Madrid'], 'Brazilia'),
  player('rm-10', 'Kylian Mbappé', 9, 'Atacant', 'Franța', '20.12.1998', '€180M', ['Monaco', 'PSG', 'Real Madrid'], 'Franța'),
  player('rm-11', 'Rodrygo', 11, 'Extremă dreapta', 'Brazilia', '09.01.2001', '€100M', ['Santos', 'Real Madrid'], 'Brazilia'),
];

const realMadridBench: Player[] = [
  player('rm-12', 'Andriy Lunin', 13, 'Portar', 'Ucraina', '11.02.1999', '€15M', ['Zorya', 'Real Madrid'], 'Ucraina'),
  player('rm-13', 'Brahim Díaz', 21, 'Mijlocaș ofensiv', 'Maroc', '03.08.1999', '€45M', ['Manchester City', 'AC Milan', 'Real Madrid'], 'Maroc'),
  player('rm-14', 'Endrick', 16, 'Atacant', 'Brazilia', '21.07.2006', '€35M', ['Palmeiras', 'Real Madrid'], 'Brazilia'),
];

const realMadridUnavailable: Player[] = [
  { ...player('rm-15', 'David Alaba', 4, 'Fundaș central', 'Austria', '24.06.1992', '€8M', ['Bayern München', 'Real Madrid'], 'Austria'), outReason: 'Accidentare la genunchi' },
];

const athleticStarting: Player[] = [
  player('ac-1', 'Unai Simón', 1, 'Portar', 'Spania', '11.06.1997', '€22M', ['Athletic Bilbao'], 'Spania'),
  player('ac-2', 'Óscar de Marcos', 17, 'Fundaș dreapta', 'Spania', '14.04.1989', '€2M', ['Athletic Bilbao']),
  player('ac-3', 'Aitor Paredes', 24, 'Fundaș central', 'Spania', '13.02.2000', '€10M', ['Athletic Bilbao']),
  player('ac-4', 'Dani Vivian', 15, 'Fundaș central', 'Spania', '05.07.1999', '€30M', ['Athletic Bilbao'], 'Spania'),
  player('ac-5', 'Yuri Berchiche', 22, 'Fundaș stânga', 'Spania', '10.02.1990', '€3M', ['Real Sociedad', 'PSG', 'Athletic Bilbao']),
  player('ac-6', 'Mikel Jauregizar', 6, 'Mijlocaș defensiv', 'Spania', '28.02.2002', '€25M', ['Athletic Bilbao']),
  player('ac-7', 'Óscar de Marcos', 8, 'Mijlocaș', 'Spania', '22.04.1991', '€4M', ['Athletic Bilbao']),
  player('ac-8', 'Mikel Vesga', 21, 'Mijlocaș', 'Spania', '02.02.1994', '€6M', ['Athletic Bilbao']),
  player('ac-9', 'Nico Williams', 11, 'Extremă stânga', 'Spania', '12.07.2002', '€90M', ['Athletic Bilbao'], 'Spania'),
  player('ac-10', 'Gorka Guruzeta', 20, 'Atacant', 'Spania', '20.01.1995', '€18M', ['Amorebieta', 'Athletic Bilbao']),
  player('ac-11', 'Iñaki Williams', 9, 'Extremă dreapta', 'Ghana', '15.06.1994', '€15M', ['Athletic Bilbao'], 'Ghana'),
];

const athleticBench: Player[] = [
  player('ac-12', 'Julen Agirrezabala', 13, 'Portar', 'Spania', '26.02.2000', '€8M', ['Athletic Bilbao']),
  player('ac-13', 'Álex Berenguer', 7, 'Extremă', 'Spania', '04.07.1995', '€12M', ['Osasuna', 'Torino', 'Athletic Bilbao']),
];

const athleticUnavailable: Player[] = [
  { ...player('ac-14', 'Ander Herrera', 23, 'Mijlocaș', 'Spania', '14.08.1989', '€3M', ['Zaragoza', 'Athletic Bilbao', 'Manchester United', 'PSG', 'Athletic Bilbao']), outReason: 'Suspendat (cartonaș roșu)' },
];

const carloAncelotti = coach('Carlo Ancelotti', '10.06.1959', ['Reggiana', 'Parma', 'Juventus', 'AC Milan', 'Chelsea', 'PSG', 'Real Madrid', 'Bayern München', 'Napoli', 'Everton', 'Real Madrid'], true, ['Parma', 'Roma', 'AC Milan']);
const ernestoValverde = coach('Ernesto Valverde', '09.02.1964', ['Athletic Bilbao', 'Espanyol', 'Olympiacos', 'Valencia', 'Villarreal', 'Barcelona', 'Athletic Bilbao'], true, ['Athletic Bilbao', 'Barcelona', 'Espanyol']);

export const matches: Match[] = [
  {
    id: 'm1',
    competitionId: 'ucl',
    date: '2026-07-24',
    time: '21:45',
    status: 'live',
    minute: 67,
    homeTeam: { id: 't1', name: 'Real Madrid', logo: '⚪' },
    awayTeam: { id: 't2', name: 'Athletic Club', logo: '🔴' },
    homeScore: 2,
    awayScore: 1,
    stadium: 'Santiago Bernabéu',
    stadiumCapacity: 81044,
    referee: 'Slavko Vinčić (Slovenia)',
    tvChannels: ['Digi Sport 1', 'Prima Sport 1'],
    manOfTheMatch: 'Jude Bellingham',
    events: ([
      { minute: 12, type: 'goal', team: 'away', player: 'Gorka Guruzeta', text: 'GOL! Gorka Guruzeta înscrie pentru Athletic Club după un contraatac rapid.' },
      { minute: 8, type: 'comment', team: 'home', text: 'Real Madrid are un sut pe poartă respins de portar.' },
      { minute: 24, type: 'comment', team: 'away', text: 'Corner pentru Athletic Club, execută Nico Williams.' },
      { minute: 41, type: 'goal', team: 'home', player: 'Jude Bellingham', assist: 'Vinícius Júnior', text: 'GOL! Bellingham egalează, asistat de Vinícius Júnior.' },
      { minute: 51, type: 'goal', team: 'home', player: 'Kylian Mbappé', assist: 'Rodrygo', text: 'GOL! Mbappé aduce Real Madrid în avantaj, pasă de gol Rodrygo.' },
      { minute: 55, type: 'yellow', team: 'away', player: 'Mikel Jauregizar', text: 'Cartonaș galben pentru Jauregizar în urma unui fault dur.' },
      { minute: 60, type: 'sub-out', team: 'home', player: 'Rodrygo', text: 'Rodrygo iese, intră Brahim Díaz.' },
      { minute: 60, type: 'sub-in', team: 'home', player: 'Brahim Díaz', text: '' },
      { minute: 64, type: 'comment', team: 'home', text: 'Real Madrid controlează posesia, 63% în acest moment.' },
    ] as MatchEvent[]).sort((a, b) => a.minute - b.minute),
    homeLineup: { formation: '4-3-3', starting: realMadridStarting, bench: realMadridBench, coach: carloAncelotti, unavailable: realMadridUnavailable },
    awayLineup: { formation: '4-4-2', starting: athleticStarting, bench: athleticBench, coach: ernestoValverde, unavailable: athleticUnavailable },
    homeStats: { shots: 14, shotsOnTarget: 7, possession: 61, passes: 512, corners: 6, fouls: 8, yellowCards: 1, redCards: 0 },
    awayStats: { shots: 8, shotsOnTarget: 3, possession: 39, passes: 331, corners: 3, fouls: 11, yellowCards: 2, redCards: 0 },
  },
  {
    id: 'm2',
    competitionId: 'liga1ro',
    date: '2026-07-24',
    time: '20:00',
    status: 'scheduled',
    homeTeam: { id: 't3', name: 'FCSB', logo: '🔴' },
    awayTeam: { id: 't4', name: 'CFR Cluj', logo: '⚪' },
    homeScore: 0,
    awayScore: 0,
    stadium: 'Arena Națională',
    stadiumCapacity: 55600,
    referee: 'István Kovács',
    tvChannels: ['Prima Sport 1', 'Digi Sport 2'],
    events: [],
    homeLineup: { formation: '4-2-3-1', starting: [], bench: [], coach: coach('Elias Charalambous', '20.04.1978', ['APOEL', 'FCSB'], false), unavailable: [] },
    awayLineup: { formation: '4-3-3', starting: [], bench: [], coach: coach('Andrea Mandorlini', '13.11.1960', ['Chievo', 'Verona', 'CFR Cluj'], true, ['Cittadella', 'Verona']), unavailable: [] },
    homeStats: { shots: 0, shotsOnTarget: 0, possession: 50, passes: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0 },
    awayStats: { shots: 0, shotsOnTarget: 0, possession: 50, passes: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0 },
  },
];
