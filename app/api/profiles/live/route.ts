// app/api/profiles/live/route.ts
import { NextResponse } from "next/server";
import { fetchCSV, rowsToObjects } from "@/utils/csv";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_PROFILE_LIVE_CSV_URL!;
  const rows = await fetchCSV(url);
  const data = rowsToObjects(rows);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}
