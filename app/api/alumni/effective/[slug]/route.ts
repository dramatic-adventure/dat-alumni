// app/api/alumni/effective/[slug]/route.ts
import { NextResponse } from "next/server";
import { fetchCSV, rowsToObjects } from "@/utils/csv";

export const runtime = "nodejs"; // Node runtime for fetch/cache

type Row = Record<string, string>;

const ALUMNI_URL = process.env.NEXT_PUBLIC_ALUMNI_CSV_URL || "";
const LIVE_URL   = process.env.NEXT_PUBLIC_PROFILE_LIVE_CSV_URL || "";
const MEDIA_URL  = process.env.NEXT_PUBLIC_PROFILE_MEDIA_CSV_URL || "";

function keyOf(r: Row) {
  return (r.alumniId || r.slug || "").toLowerCase();
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    if (!ALUMNI_URL || !LIVE_URL || !MEDIA_URL) {
      return NextResponse.json(
        { error: "Server misconfigured: missing CSV URLs" },
        { status: 500, headers: nocache() }
      );
    }

    const { slug } = params;
    const target = (slug || "").toLowerCase();

    // 1) Fetch all three in parallel (cached 60s by fetchCSV)
    const [baseRows, liveRows, mediaRows] = await Promise.all([
      fetchCSV(ALUMNI_URL).then(rowsToObjects<Row>),
      fetchCSV(LIVE_URL).then(rowsToObjects<Row>),
      fetchCSV(MEDIA_URL).then(rowsToObjects<Row>),
    ]);

    const base = baseRows.find((r) => keyOf(r) === target);
    if (!base) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: nocache() });
    }

    // 2) Overlay Live (pick only the fields we care about)
    const live = liveRows.find((r) => keyOf(r) === target);
    const merged: Row = {
      ...base,
      status: live?.status ?? base.status,
      currentHeadshotId: live?.currentHeadshotId ?? base.currentHeadshotId,
      updatedAt: live?.updatedAt ?? base.updatedAt,
    };

    // 3) Resolve current headshot from Media
    const mediaHeadshot =
      mediaRows.find(
        (m) =>
          keyOf(m) === target &&
          (m.kind || "").toLowerCase() === "headshot" &&
          (m.isCurrent || "").toLowerCase() === "true"
      ) || (merged.currentHeadshotId ? { fileId: merged.currentHeadshotId } as Row : null);

    if (mediaHeadshot?.fileId) {
      // Serve privately via your proxy
      merged.headshotUrl = `/media/${mediaHeadshot.fileId}`;
    }

    return NextResponse.json(merged, {
      headers: { ...swr(), "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("effective-profile error:", e?.message || e);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: nocache() });
  }
}

function swr() {
  return { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" };
}
function nocache() {
  return { "Cache-Control": "no-store" };
}
