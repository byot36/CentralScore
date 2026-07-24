// ID-urile numerice ale ligilor din Sportmonks diferă de ID-urile interne
// folosite în această aplicație (ex: 'ucl', 'epl'). Completează valorile de
// mai jos cu ID-urile reale din contul tău Sportmonks — le găsești apelând
// GET /leagues (prin Worker-ul tău) sau în documentația Sportmonks, secțiunea
// "League IDs" (disponibilitatea depinde de planul tău).
//
// Exemplu: dacă /leagues arată că "Premier League" are id: 8, pune 'epl': 8.
export const SPORTMONKS_LEAGUE_IDS: Record<string, number | undefined> = {
  ucl: undefined,
  uel: undefined,
  uecl: undefined,
  euro: undefined,
  wc: undefined,
  nations: undefined,
  epl: undefined,
  laliga: undefined,
  seriea: undefined,
  bundesliga: undefined,
  ligue1: undefined,
  liga1ro: undefined,
  liga2ro: undefined,
};
