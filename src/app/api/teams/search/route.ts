import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.API_FOOTBALL_KEY!;

// football-data.org free tier has no search — we fetch from known competitions
const COMPETITION_IDS = [2001, 2021, 2016, 2014, 2002, 2019, 2015, 2003, 2017, 2013];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();
  if (!q || q.length < 2) return NextResponse.json({ teams: [] });

  try {
    // Try to fetch teams from a few competitions and filter
    const results: { id: number; name: string; logo: string; country: string }[] = [];
    const seen = new Set<number>();

    for (const compId of COMPETITION_IDS.slice(0, 4)) {
      const res = await fetch(`${BASE_URL}/competitions/${compId}/teams`, {
        headers: { "X-Auth-Token": API_KEY },
        next: { revalidate: 86400 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const team of data.teams || []) {
        if (!seen.has(team.id) && team.name.toLowerCase().includes(q)) {
          seen.add(team.id);
          results.push({
            id: team.id,
            name: team.name,
            logo: team.crest || "",
            country: team.area?.name || "",
          });
        }
      }
      if (results.length >= 8) break;
    }

    return NextResponse.json({ teams: results.slice(0, 8) });
  } catch (err) {
    return NextResponse.json({ teams: [], error: String(err) });
  }
}
