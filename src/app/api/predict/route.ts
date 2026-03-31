import { NextRequest, NextResponse } from "next/server";
import { predict } from "@/lib/predictor";

const BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.API_FOOTBALL_KEY!;

// All competitions available on free tier with their IDs
const COMPETITION_IDS = [2001, 2021, 2016, 2014, 2002, 2019, 2015, 2003, 2017, 2013, 2152];

async function apiFetch(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    headers: { "X-Auth-Token": API_KEY },
    next: { revalidate: 3600 }, // cache 1h — saves API calls
  });
  if (!res.ok) return null;
  return res.json();
}

async function getTeamStatsFromCompetitions(teamId: number) {
  // Try each competition to find this team's matches
  for (const compId of COMPETITION_IDS) {
    const data = await apiFetch(`competitions/${compId}/matches`);
    if (!data?.matches) continue;

    const matches = data.matches.filter((m: { homeTeam: { id: number }; awayTeam: { id: number }; status: string }) =>
      (m.homeTeam.id === teamId || m.awayTeam.id === teamId) && m.status === "FINISHED"
    );

    if (matches.length >= 5) {
      let goalsFor = 0, goalsAgainst = 0, wins = 0, draws = 0, losses = 0;
      const played = matches.length;

      for (const m of matches) {
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
        stats: {
          goalsFor: goalsFor / played,
          goalsAgainst: goalsAgainst / played,
          played, wins, draws, losses,
        },
        compMatches: data.matches,
        compId,
      };
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const homeId = Number(searchParams.get("homeId"));
    const awayId = Number(searchParams.get("awayId"));
    if (!homeId || !awayId) return NextResponse.json({ error: "Missing IDs" }, { status: 400 });

    // Get stats for both teams (run in parallel)
    const [homeResult, awayResult] = await Promise.all([
      getTeamStatsFromCompetitions(homeId),
      getTeamStatsFromCompetitions(awayId),
    ]);

    const homeStats = homeResult?.stats ?? { goalsFor: 1.2, goalsAgainst: 1.2, played: 0, wins: 0, draws: 0, losses: 0 };
    const awayStats = awayResult?.stats ?? { goalsFor: 1.0, goalsAgainst: 1.2, played: 0, wins: 0, draws: 0, losses: 0 };

    // Build H2H from the competition matches we already have
    const allMatches = homeResult?.compMatches || [];
    const h2hMatches = allMatches
      .filter((m: { homeTeam: { id: number }; awayTeam: { id: number }; score: { fullTime: { home: number | null; away: number | null } } }) =>
        (m.homeTeam.id === homeId && m.awayTeam.id === awayId) ||
        (m.homeTeam.id === awayId && m.awayTeam.id === homeId)
      )
      .slice(0, 10)
      .map((m: { homeTeam: { id: number }; score: { fullTime: { home: number | null; away: number | null } } }) => ({
        homeGoals: m.score.fullTime.home ?? 0,
        awayGoals: m.score.fullTime.away ?? 0,
        homeTeamId: m.homeTeam.id,
      }));

    const result = predict(homeStats, awayStats, h2hMatches, homeId);

    return NextResponse.json({
      ...result,
      homeGoalsAvg: homeStats.goalsFor,
      awayGoalsAvg: awayStats.goalsFor,
      h2hCount: h2hMatches.length,
      homePlayed: homeStats.played,
      awayPlayed: awayStats.played,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
