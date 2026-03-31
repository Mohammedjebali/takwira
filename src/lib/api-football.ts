// ============================================================
// football-data.org API v4
// Free tier: 10 req/min, covers 13 major competitions
// ============================================================

const BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.API_FOOTBALL_KEY!;

async function apiFetch(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    headers: { "X-Auth-Token": API_KEY },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API error ${res.status}`);
  }
  return res.json();
}

// football-data.org competition IDs
export const COMPETITIONS = {
  UCL:         2001,
  PL:          2021,
  BL1:         2002, // Bundesliga
  SA:          2019, // Serie A
  PD:          2014, // La Liga (Primera Division)
  FL1:         2015, // Ligue 1
  DED:         2003, // Eredivisie
  PPL:         2017, // Primeira Liga (Portugal)
  BSA:         2013, // Brasileirao Serie A
  ELC:         2016, // Championship
  CLI:         2152, // Copa Libertadores
};

export async function getMatchesByDate(date: string) {
  const data = await apiFetch(`matches`, { date });
  return data.matches || [];
}

export async function getMatchesForDateRange(dateFrom: string, dateTo: string) {
  const data = await apiFetch(`matches`, { dateFrom, dateTo });
  return data.matches || [];
}

export async function getCompetitionMatches(competitionId: number, matchday?: number) {
  const params: Record<string, string | number> = {};
  if (matchday) params.matchday = matchday;
  const data = await apiFetch(`competitions/${competitionId}/matches`, params);
  return data.matches || [];
}

export async function getTeam(teamId: number) {
  return apiFetch(`teams/${teamId}`);
}

export async function searchTeams(query: string) {
  // football-data.org doesn't have a search endpoint — we match from our list
  // or fetch by competition and filter
  const data = await apiFetch(`teams?name=${encodeURIComponent(query)}`);
  return data.teams || [];
}

export async function getHeadToHead(matchId: number) {
  const data = await apiFetch(`matches/${matchId}/head2head`, { limit: 10 });
  return data.matches || [];
}

export async function getH2HByTeams(team1Id: number, team2Id: number) {
  // No direct H2H by team IDs in v4 free tier — returns empty for now
  return [];
}

export async function getStandings(competitionId: number) {
  const data = await apiFetch(`competitions/${competitionId}/standings`);
  return data.standings || [];
}

export async function getTeamMatches(teamId: number, season?: number) {
  const params: Record<string, string | number> = { limit: 20 };
  if (season) params.season = season;
  const data = await apiFetch(`teams/${teamId}/matches`, params);
  return data.matches || [];
}

export interface LeagueInfo {
  id: number;
  name: string;
  logo: string;
  group: string;
  apiId: number;
}

export async function getTopLeagues(): Promise<LeagueInfo[]> {
  return [
    { id: 2001, apiId: 2001, name: "Champions League",  logo: "https://crests.football-data.org/CL.png",  group: "🏆 Europe" },
    { id: 2021, apiId: 2021, name: "Premier League",    logo: "https://crests.football-data.org/PL.png",  group: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England" },
    { id: 2016, apiId: 2016, name: "Championship",      logo: "https://crests.football-data.org/ELC.png", group: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England" },
    { id: 2014, apiId: 2014, name: "La Liga",           logo: "https://crests.football-data.org/PD.png",  group: "🇪🇸 Spain" },
    { id: 2002, apiId: 2002, name: "Bundesliga",        logo: "https://crests.football-data.org/BL1.png", group: "🇩🇪 Germany" },
    { id: 2019, apiId: 2019, name: "Serie A",           logo: "https://crests.football-data.org/SA.png",  group: "🇮🇹 Italy" },
    { id: 2015, apiId: 2015, name: "Ligue 1",           logo: "https://crests.football-data.org/FL1.png", group: "🇫🇷 France" },
    { id: 2003, apiId: 2003, name: "Eredivisie",        logo: "https://crests.football-data.org/DED.png", group: "🇳🇱 Netherlands" },
    { id: 2017, apiId: 2017, name: "Primeira Liga",     logo: "https://crests.football-data.org/PPL.png", group: "🇵🇹 Portugal" },
    { id: 2013, apiId: 2013, name: "Brasileirao Série A", logo: "https://crests.football-data.org/BSA.png", group: "🇧🇷 Brazil" },
    { id: 2152, apiId: 2152, name: "Copa Libertadores", logo: "https://crests.football-data.org/CLI.png", group: "🌎 South America" },
  ];
}
