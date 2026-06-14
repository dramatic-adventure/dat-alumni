// app/api/alumni/community-feed/route.ts
import { NextResponse } from "next/server";
import { loadProfileChanges } from "@/lib/loadProfileChanges";
import { loadProfileLiveMini } from "@/lib/loadProfileLiveMini";
import { buildCommunityFeedItems } from "@/lib/communityFeed";
import { loadAllUpcomingEvents } from "@/lib/loadEventsFromSheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function norm(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function isTrue(v: unknown) {
  return norm(v) === "true";
}

function noStoreJson(payload: any, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...(init || {}),
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...(init?.headers || {}),
    },
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const daysRaw = Number(url.searchParams.get("days") || 14);
    const limitRaw = Number(url.searchParams.get("limit") || 5);

    // Optional strict filter (UpdatesPanel can use this)
    // /api/alumni/community-feed?type=composer   OR   ?only=composer
    const type = norm(url.searchParams.get("type")); // e.g. "composer"
    const only = norm(url.searchParams.get("only"));
    const onlyComposer = type === "composer" || only === "composer";

    const days = Math.min(
      60,
      Math.max(1, Number.isFinite(daysRaw) ? daysRaw : 14)
    );

    // Allow panel to request more; still keep a hard cap
    const limit = Math.min(
      50,
      Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 5)
    );

    const [changesAll, liveById, eventRows] = await Promise.all([
      loadProfileChanges(days),
      loadProfileLiveMini(), // Record<alumniId, { name, slug, currentUpdateText, ... }>
      loadAllUpcomingEvents(),
    ]);

    // ✅ Belt-and-suspenders: never allow undone rows to enter the feed pipeline.
    const changes = (changesAll || []).filter((c: any) => !isTrue(c?.isUndone));

    // Synthesize ProfileChangeRow-shaped objects from the Events tab so that
    // buildCommunityFeedItems can surface upcoming events alongside other activity.
    // The Events tab is the canonical source; these rows use the same field name
    // ("upcomingEventTitle") that the feed scorer already recognises (kind="event").
    const syntheticEventRows = (eventRows || []).map((e) => ({
      ts: e.createdTs || e.sortDate || e.date || "",
      alumniId: e.alumniId,
      field: "upcomingEventTitle",
      before: "",
      after: e.title,
    }));

    // Merge so the feed builder sees both profile-change history and Events tab entries.
    const allChanges = [...changes, ...syntheticEventRows];

    // Broad items (whatever your builder decides)
    const built = buildCommunityFeedItems(allChanges, liveById, limit);

    const items = Array.isArray(built) ? built : [];

    // ✅ Strict filter for UpdatesPanel, if requested.
    // NOTE: If this results in [], your builder probably isn’t emitting type="composer"
    // for composer items yet (or uses a different string).
    // Normalize legacy items (builder may not set `type`)
    const normalized = items.map((it: any) => {
      const kind = norm(it?.kind);   // "current" | "fallback" | ...
      const field = norm(it?.field); // "currentupdatetext" | ...

      // Treat currentUpdateText as "composer"
      const inferredType =
        norm(it?.type) ||
        (kind === "current" && field === "currentupdatetext" ? "composer" : "");

      return inferredType ? { ...it, type: inferredType } : it;
    });

    const filtered = onlyComposer
      ? normalized.filter((it: any) => norm(it?.type) === "composer")
      : normalized;

    return noStoreJson(
      { ok: true, items: filtered, days, limit, ...(onlyComposer ? { type: "composer" } : {}) },
      { status: 200 }
    );
  } catch (e: any) {
    return noStoreJson(
      { ok: false, error: e?.message || "failed" },
      { status: 500 }
    );
  }
}
