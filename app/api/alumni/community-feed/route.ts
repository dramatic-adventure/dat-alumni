// app/api/alumni/community-feed/route.ts
import { NextResponse } from "next/server";
import { loadProfileChanges } from "@/lib/loadProfileChanges";
import { loadProfileLiveMini } from "@/lib/loadProfileLiveMini";
import { buildCommunityFeedItems } from "@/lib/communityFeed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function norm(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function isTrue(v: unknown) {
  return norm(v) === "true";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const daysRaw = Number(url.searchParams.get("days") || 14);
    const limitRaw = Number(url.searchParams.get("limit") || 5);

    const days = Math.min(
      60,
      Math.max(1, Number.isFinite(daysRaw) ? daysRaw : 14)
    );
    const limit = Math.min(
      20,
      Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 5)
    );

    const [changesAll, liveById] = await Promise.all([
      loadProfileChanges(days),
      loadProfileLiveMini(), // Record<alumniId, { name, slug, currentUpdateText, upcomingEventTitle, storyTitle, ... }>
    ]);

    // ✅ Belt-and-suspenders: never allow undone rows to enter the feed pipeline.
    const changes = (changesAll || []).filter((c: any) => !isTrue(c?.isUndone));

    const items = buildCommunityFeedItems(changes, liveById, limit);

    // Explicit no-store (dynamic should already do this, but this makes it unambiguous)
    return NextResponse.json(
      { ok: true, items, days, limit },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "failed" },
      { status: 500 }
    );
  }
}
