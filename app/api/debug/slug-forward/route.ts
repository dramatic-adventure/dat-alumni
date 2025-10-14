import { NextResponse } from "next/server";
import { getSlugForward, loadSlugForwardMap } from "@/lib/loadAlumni";
import { loadCsv } from "@/lib/loadCsv";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const s = (searchParams.get("slug") || "").trim().toLowerCase();

  const envUrl =
    process.env.SLUGS_CSV_URL || process.env.NEXT_PUBLIC_SLUGS_CSV_URL || "";

  let csvProbe = { ok: false, len: 0, head: "" as string, error: "" as string };
  try {
    const text = await loadCsv(envUrl, "slug-map.csv");
    csvProbe = { ok: true, len: text.length, head: text.slice(0, 200), error: "" };
  } catch (e: any) {
    csvProbe = { ok: false, len: 0, head: "", error: e?.message || String(e) };
  }

  // Load the in-memory map and do a lookup
  const map = await loadSlugForwardMap();
  const mapSize = Object.keys(map).length;
  const direct = map[s] || null;
  const target = await getSlugForward(s);

  return NextResponse.json({
    input: s || "(empty)",
    envUrl,
    csvProbe,
    mapSize,
    direct,       // raw map value
    target,       // normalized forward result
  });
}
