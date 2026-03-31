import { NextRequest, NextResponse } from "next/server";
import { getMatchesByDate } from "@/lib/api-football";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
    const matches = await getMatchesByDate(date);
    return NextResponse.json({ fixtures: matches, date });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
