const BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = process.env.API_FOOTBALL_KEY!;

async function apiFetch(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": API_KEY },
    next: { revalidate: 300 }, // cache 5 min
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.response;
}

export async function getFixturesByDate(date: string) {
  return apiFetch("fixtures", { date, timezone: "Europe/Paris" });
}

export async function getFixtureById(id: number) {
  const res = await apiFetch("fixtures", { id });
  return res[0];
}

export async function getTeamStats(teamId: number, leagueId: number, season: number) {
  const res = await apiFetch("teams/statistics", {
    team: teamId,
    league: leagueId,
    season,
  });
  return res;
}

export async function getHeadToHead(team1: number, team2: number) {
  return apiFetch("fixtures/headtohead", { h2h: `${team1}-${team2}`, last: 10 });
}

export async function getStandings(leagueId: number, season: number) {
  return apiFetch("standings", { league: leagueId, season });
}

export interface LeagueGroup {
  group: string;
  leagues: { id: number; name: string; logo: string }[];
}

export async function getTopLeagues() {
  return [
    // Europe - Cups
    { id: 2,   name: "Champions League",  logo: "https://media.api-sports.io/football/leagues/2.png",   group: "🏆 Europe" },
    { id: 3,   name: "Europa League",     logo: "https://media.api-sports.io/football/leagues/3.png",   group: "🏆 Europe" },
    { id: 848, name: "Conference League", logo: "https://media.api-sports.io/football/leagues/848.png", group: "🏆 Europe" },
    // England
    { id: 39,  name: "Premier League",    logo: "https://media.api-sports.io/football/leagues/39.png",  group: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England" },
    { id: 40,  name: "Championship",      logo: "https://media.api-sports.io/football/leagues/40.png",  group: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England" },
    { id: 41,  name: "League One",        logo: "https://media.api-sports.io/football/leagues/41.png",  group: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England" },
    { id: 42,  name: "League Two",        logo: "https://media.api-sports.io/football/leagues/42.png",  group: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England" },
    // Spain
    { id: 140, name: "La Liga",           logo: "https://media.api-sports.io/football/leagues/140.png", group: "🇪🇸 Spain" },
    { id: 141, name: "La Liga 2",         logo: "https://media.api-sports.io/football/leagues/141.png", group: "🇪🇸 Spain" },
    // Germany
    { id: 78,  name: "Bundesliga",        logo: "https://media.api-sports.io/football/leagues/78.png",  group: "🇩🇪 Germany" },
    { id: 79,  name: "2. Bundesliga",     logo: "https://media.api-sports.io/football/leagues/79.png",  group: "🇩🇪 Germany" },
    { id: 80,  name: "3. Liga",           logo: "https://media.api-sports.io/football/leagues/80.png",  group: "🇩🇪 Germany" },
    // Italy
    { id: 135, name: "Serie A",           logo: "https://media.api-sports.io/football/leagues/135.png", group: "🇮🇹 Italy" },
    { id: 136, name: "Serie B",           logo: "https://media.api-sports.io/football/leagues/136.png", group: "🇮🇹 Italy" },
    { id: 137, name: "Serie C",           logo: "https://media.api-sports.io/football/leagues/137.png", group: "🇮🇹 Italy" },
    // France
    { id: 61,  name: "Ligue 1",           logo: "https://media.api-sports.io/football/leagues/61.png",  group: "🇫🇷 France" },
    { id: 62,  name: "Ligue 2",           logo: "https://media.api-sports.io/football/leagues/62.png",  group: "🇫🇷 France" },
    // Turkey
    { id: 203, name: "Süper Lig",         logo: "https://media.api-sports.io/football/leagues/203.png", group: "🇹🇷 Turkey" },
    { id: 204, name: "1. Lig",            logo: "https://media.api-sports.io/football/leagues/204.png", group: "🇹🇷 Turkey" },
    // Netherlands
    { id: 88,  name: "Eredivisie",        logo: "https://media.api-sports.io/football/leagues/88.png",  group: "🇳🇱 Netherlands" },
    { id: 89,  name: "Eerste Divisie",    logo: "https://media.api-sports.io/football/leagues/89.png",  group: "🇳🇱 Netherlands" },
    // Belgium
    { id: 144, name: "First Division A",  logo: "https://media.api-sports.io/football/leagues/144.png", group: "🇧🇪 Belgium" },
    { id: 145, name: "First Division B",  logo: "https://media.api-sports.io/football/leagues/145.png", group: "🇧🇪 Belgium" },
    // Saudi Arabia
    { id: 307, name: "Pro League",        logo: "https://media.api-sports.io/football/leagues/307.png", group: "🇸🇦 Saudi Arabia" },
    // Brazil
    { id: 71,  name: "Série A",           logo: "https://media.api-sports.io/football/leagues/71.png",  group: "🇧🇷 Brazil" },
    { id: 72,  name: "Série B",           logo: "https://media.api-sports.io/football/leagues/72.png",  group: "🇧🇷 Brazil" },
    { id: 75,  name: "Série C",           logo: "https://media.api-sports.io/football/leagues/75.png",  group: "🇧🇷 Brazil" },
    // Argentina
    { id: 128, name: "Liga Profesional",  logo: "https://media.api-sports.io/football/leagues/128.png", group: "🇦🇷 Argentina" },
    { id: 131, name: "Primera Nacional",  logo: "https://media.api-sports.io/football/leagues/131.png", group: "🇦🇷 Argentina" },
    // Tunisia
    { id: 207, name: "Ligue Pro",         logo: "https://media.api-sports.io/football/leagues/207.png", group: "🇹🇳 Tunisia" },
    { id: 208, name: "Ligue 2",           logo: "https://media.api-sports.io/football/leagues/208.png", group: "🇹🇳 Tunisia" },
  ];
}
