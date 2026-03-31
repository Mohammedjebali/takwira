import { NextRequest, NextResponse } from "next/server";
import { predict } from "@/lib/predictor";

const BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = process.env.API_FOOTBALL_KEY!;

async function apiFetch(endpoint: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    headers: { "x-apisports-key": API_KEY },
    next: { revalidate: 600 },
  });
  const data = await res.json();
  return data.response;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const homeId = Number(searchParams.get("homeId"));
    const awayId = Number(searchParams.get("awayId"));
    if (!homeId || !awayId) return NextResponse.json({ error: "Missing team IDs" }, { status: 400 });

    const season = new Date().getFullYear();

    // Get last matches for each team to figure out their common league
    // Free plan doesn't support `last` param — use season instead
    const [homeFixtures, awayFixtures, h2hRaw] = await Promise.all([
      apiFetch("fixtures", { team: homeId, season }),
      apiFetch("fixtures", { team: awayId, season }),
      apiFetch("fixtures/headtohead", { h2h: `${homeId}-${awayId}` }),
    ]);

    // Find a common league ID from recent fixtures
    const homeLeagues = new Set((homeFixtures || []).map((f: { league: { id: number } }) => f.league.id));
    const awayLeagues = new Set((awayFixtures || []).map((f: { league: { id: number } }) => f.league.id));
    const commonLeague = [...homeLeagues].find((id) => awayLeagues.has(id));
    const leagueId = commonLeague || (homeFixtures?.[0]?.league?.id) || 39;

    // Get team stats
    const [homeStats, awayStats] = await Promise.all([
      apiFetch("teams/statistics", { team: homeId, league: leagueId, season }),
      apiFetch("teams/statistics", { team: awayId, league: leagueId, season }),
    ]);

    const parseStats = (stats: Record<string, unknown>) => {
      const goals = stats?.goals as { for?: { average?: { total?: string | number } }; against?: { average?: { total?: string | number } } } | undefined;
      const fixt = stats?.fixtures as { played?: { total?: number }; wins?: { total?: number }; draws?: { total?: number }; loses?: { total?: number } } | undefined;
      return {
        goalsFor: parseFloat(String(goals?.for?.average?.total || "1.2")) || 1.2,
        goalsAgainst: parseFloat(String(goals?.against?.average?.total || "1.2")) || 1.2,
        played: fixt?.played?.total || 0,
        wins: fixt?.wins?.total || 0,
        draws: fixt?.draws?.total || 0,
        losses: fixt?.loses?.total || 0,
      };
    };

    const h2hMatches = (h2hRaw || []).slice(0, 10).map((m: Record<string, unknown>) => ({
      homeGoals: (m.goals as { home: number })?.home,
      awayGoals: (m.goals as { away: number })?.away,
      homeTeamId: (m.teams as { home: { id: number } })?.home?.id,
    }));

    // Recent form (last 5 finished matches)
    const getForm = (fixtures: Array<{ fixture: { status: { short: string } }; teams: { home: { id: number }; away: { id: number } }; goals: { home: number; away: number } }>, teamId: number) => {
      const FINISHED = ["FT", "AET", "PEN"];
      const finished = (fixtures || []).filter((f) => FINISHED.includes(f.fixture.status.short));
      return finished.slice(-5).map((f) => {
        const isHome = f.teams.home.id === teamId;
        const scored = isHome ? f.goals.home : f.goals.away;
        const conceded = isHome ? f.goals.away : f.goals.home;
        if (scored > conceded) return "W";
        if (scored === conceded) return "D";
        return "L";
      });
    };

    const homeForm = getForm(homeFixtures, homeId);
    const awayForm = getForm(awayFixtures, awayId);

    const result = predict(parseStats(homeStats), parseStats(awayStats), h2hMatches, homeId);

    return NextResponse.json({
      ...result,
      homeForm,
      awayForm,
      leagueId,
      season,
      h2hCount: h2hMatches.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
