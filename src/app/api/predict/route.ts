import { NextRequest, NextResponse } from "next/server";
import { getTeamStats, getHeadToHead } from "@/lib/api-football";
import { predict } from "@/lib/predictor";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const homeId = Number(searchParams.get("homeId"));
    const awayId = Number(searchParams.get("awayId"));
    const leagueId = Number(searchParams.get("leagueId"));
    const season = Number(searchParams.get("season") || new Date().getFullYear());

    if (!homeId || !awayId || !leagueId) {
      return NextResponse.json({ error: "Missing homeId, awayId, or leagueId" }, { status: 400 });
    }

    const [homeStats, awayStats, h2hRaw] = await Promise.all([
      getTeamStats(homeId, leagueId, season),
      getTeamStats(awayId, leagueId, season),
      getHeadToHead(homeId, awayId),
    ]);

    // Parse home team stats
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

    const h2hMatches = (h2hRaw || []).map((m: Record<string, unknown>) => ({
      homeGoals: (m.goals as { home: number })?.home,
      awayGoals: (m.goals as { away: number })?.away,
      homeTeamId: ((m.teams as { home: { id: number } })?.home?.id),
    }));

    const result = predict(
      parseStats(homeStats),
      parseStats(awayStats),
      h2hMatches,
      homeId
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
