import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.API_FOOTBALL_KEY;
  return NextResponse.json({
    keyPresent: !!key,
    keyLength: key?.length || 0,
    keyPreview: key ? key.substring(0, 6) + "..." : "MISSING",
  });
}
