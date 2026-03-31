import { NextRequest, NextResponse } from "next/server";
import { predict } from "@/lib/predictor";

const BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.API_FOOTBALL_KEY!;

async function apiFetch(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    headers: { "X-Auth-Token": API_KEY },
    next: { revalidate: 600 },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API error ${res.status}`);
  }
  return res.json();
}

function parseStats(matches: Array<{
  homeTeam: { id: number };
  awayTeam: { id: number };
  score: { fullTime: { home: number | null; away: number | null } };
  status: string;
}>, teamId: number) {
  const finished = matches.filter((m) => m.status === "FINISHED");
  let goalsFor = 0, goalsAgainst = 0, wins = 0, draws = 0, losses = 0;
  const played = finished.length;
  for (const m of finished) {
    const isHome = m.homeTeam.id === teamId;
    const scored = isHome ? (m.score.fullTime.home ?? 0) : (m.score.fullTime.away ?? 0);
    const conceded = isHome ? (m.score.fullTime.away ?? 0) : (m.score.fullTime.home ?? 0);
    goalsFor += scored;
    goalsAgainst += conceded;
    if (scored > conceded) wins++;
    else if (scored === conceded) draws++;
    else losses++;
  }
  return {
    goalsFor: played > 0 ? goalsFor / played : 1.2,
    goalsAgainst: played > 0 ? goalsAgainst / played : 1.2,
    played, wins, draws, losses,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const homeId = Number(searchParams.get("homeId"));
    const awayId = Number(searchParams.get("awayId"));
    if (!homeId || !awayId) return NextResponse.json({ error: "Missing IDs" }, { status: 400 });

    const season = new Date().getFullYear();

    const [homeData, awayData] = await Promise.all([
      apiFetch(`teams/${homeId}/matches`, { season, limit: 30 }),
      apiFetch(`teams/${awayId}/matches`, { season, limit: 30 }),
    ]);

    const homeMatches = homeData.matches || [];
    const awayMatches = awayData.matches || [];

    const h2hMatches = homeMatches
      .filter((m: { homeTeam: { id: number }; awayTeam: { id: number }; status: string }) =>
        m.status === "FINISHED" &&
        ((m.homeTeam.id === homeId && m.awayTeam.id === awayId) ||
         (m.homeTeam.id === awayId && m.awayTeam.id === homeId))
      )
      .slice(0, 10)
      .map((m: { homeTeam: { id: number }; score: { fullTime: { home: number | null; away: number | null } } }) => ({
        homeGoals: m.score.fullTime.home ?? 0,
        awayGoals: m.score.fullTime.away ?? 0,
        homeTeamId: m.homeTeam.id,
      }));

    const homeStats = parseStats(homeMatches, homeId);
    const awayStats = parseStats(awayMatches, awayId);
    const result = predict(homeStats, awayStats, h2hMatches, homeId);

    return NextResponse.json({
      ...result,
      homeGoalsAvg: homeStats.goalsFor,
      awayGoalsAvg: awayStats.goalsFor,
      h2hCount: h2hMatches.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
