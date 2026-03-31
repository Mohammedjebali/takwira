import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://v3.football.api-sports.io";
const API_KEY = process.env.API_FOOTBALL_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q || q.length < 2) return NextResponse.json({ teams: [] });

  const res = await fetch(`${BASE_URL}/teams?search=${encodeURIComponent(q)}`, {
    headers: { "x-apisports-key": API_KEY },
    next: { revalidate: 3600 },
  });
  const data = await res.json();
  const teams = (data.response || []).slice(0, 8).map((t: {
    team: { id: number; name: string; logo: string; country: string };
    venue: { city: string };
  }) => ({
    id: t.team.id,
    name: t.team.name,
    logo: t.team.logo,
    country: t.team.country,
    city: t.venue?.city,
  }));
  return NextResponse.json({ teams });
}
