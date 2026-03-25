// app/api/profiles/live/route.ts
import { NextResponse } from "next/server";
import { fetchCSV, rowsToObjects } from "@/utils/csv";

export const runtime = "nodejs";

function norm(v: unknown) {
  return String(v ?? "").trim();
}
function normKey(v: unknown) {
  return norm(v).toLowerCase();
}

function pickAlumniId(row: any) {
  // Immutable key(s) only — NO slug fallback
  return (
    normKey(row.alumniId) ||
    normKey(row["Alumni ID"]) ||
    normKey(row["alumniId"]) ||
    normKey(row["Profile ID"]) ||
    ""
  );
}

function pickSlug(row: any) {
  return normKey(row.slug) || normKey(row["slug"]) || "";
}

function pickPreviousSlugs(row: any) {
  // supports: "Previous Slugs" as comma/space/newline separated
  const raw =
    norm(row["Previous Slugs"]) ||
    norm(row["previousSlugs"]) ||
    norm(row["previous slugs"]) ||
    "";
  if (!raw) return [];
  return raw
    .split(/[\s,]+/g)
    .map((s) => normKey(s))
    .filter(Boolean);
}

export async function GET(req: Request) {
  const url =
    process.env.PROFILE_LIVE_CSV_URL ||
    process.env.NEXT_PUBLIC_PROFILE_LIVE_CSV_URL;

  if (!url) {
    return NextResponse.json(
      { ok: false, error: "missing_profile_live_csv_url" },
      { status: 500 }
    );
  }

  const rows = await fetchCSV(url);
  const data = rowsToObjects(rows);

  const { searchParams } = new URL(req.url);
  const alumniId = normKey(searchParams.get("alumniId"));
  const slug = normKey(searchParams.get("slug"));

  let out = data;

  if (alumniId) {
    out = data.filter((row: any) => pickAlumniId(row) === alumniId);
  } else if (slug) {
    out = data.filter((row: any) => {
      const current = pickSlug(row);
      if (current === slug) return true;
      const prev = pickPreviousSlugs(row);
      return prev.includes(slug);
    });
  }

  return NextResponse.json(out, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}
