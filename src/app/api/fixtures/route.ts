import { NextRequest, NextResponse } from "next/server";
import { getMatchesByDate } from "@/lib/api-football";

function getParisDate(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Paris" }).format(new Date());
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || getParisDate();
    const matches = await getMatchesByDate(date);
    return NextResponse.json({ fixtures: matches, date });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
