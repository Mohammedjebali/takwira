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

export async function getTopLeagues() {
  // Top leagues IDs: PL=39, La Liga=140, Serie A=135, Bundesliga=78, Ligue 1=61, UCL=2, Europa=3
  return [
    { id: 2,   name: "UEFA Champions League", logo: "https://media.api-sports.io/football/leagues/2.png" },
    { id: 3,   name: "UEFA Europa League",    logo: "https://media.api-sports.io/football/leagues/3.png" },
    { id: 39,  name: "Premier League",        logo: "https://media.api-sports.io/football/leagues/39.png" },
    { id: 140, name: "La Liga",               logo: "https://media.api-sports.io/football/leagues/140.png" },
    { id: 135, name: "Serie A",               logo: "https://media.api-sports.io/football/leagues/135.png" },
    { id: 78,  name: "Bundesliga",            logo: "https://media.api-sports.io/football/leagues/78.png" },
    { id: 61,  name: "Ligue 1",               logo: "https://media.api-sports.io/football/leagues/61.png" },
    { id: 207, name: "Ligue Pro (Tunisia)",   logo: "https://media.api-sports.io/football/leagues/207.png" },
  ];
}
