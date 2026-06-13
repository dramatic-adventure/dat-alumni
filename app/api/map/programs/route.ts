// app/api/map/programs/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { programMap } from "@/lib/programMap";
import { productionMap } from "@/lib/productionMap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(payload: unknown) {
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function dedupeSorted(values: Iterable<unknown>): string[] {
  const seen = new Map<string, string>(); // lowercased key → display value
  for (const raw of values) {
    const v = String(raw ?? "").trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (!seen.has(k)) seen.set(k, v);
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

// GET /api/map/programs → { programs: string[], productions: string[] }
// programs = distinct DAT program types (programMap.program)
// productions = distinct show titles (productionMap.title)
export async function GET() {
  const programs = dedupeSorted(Object.values(programMap).map((p) => p.program));
  const productions = dedupeSorted(Object.values(productionMap).map((p) => p.title));
  return noStore({ programs, productions });
}
