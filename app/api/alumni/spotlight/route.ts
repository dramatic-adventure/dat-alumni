// app/api/alumni/spotlight/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import {
  loadSpotlightsForSlug,
  appendSpotlightRow,
  deleteSpotlightRows,
  type SpotlightRow,
} from "@/lib/loadSpotlightsFromSheet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...(init ?? {}),
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...((init as any)?.headers ?? {}),
    },
  });
}

// ── GET /api/alumni/spotlight?slug=<profileSlug> ──────────────────────────────
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = (url.searchParams.get("slug") ?? "").trim();
    if (!slug) {
      return noStore({ error: "Missing slug" }, { status: 400 });
    }

    const data = await loadSpotlightsForSlug(slug);
    return noStore(data);
  } catch (err: any) {
    console.error("[spotlight GET]", err);
    return noStore({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// ── POST /api/alumni/spotlight — admin only ───────────────────────────────────
export async function POST(req: Request) {
  // Auth + admin check
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!auth.isAdmin) {
    return noStore({ error: "Admin only" }, { status: 403 });
  }

  let body: Partial<SpotlightRow> & { profileSlug?: string };
  try {
    body = await req.json();
  } catch {
    return noStore({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileSlug = (body.profileSlug ?? "").trim();
  const type = (body.type ?? "").trim();
  const title = (body.title ?? "").trim();

  if (!profileSlug) return noStore({ error: "profileSlug is required" }, { status: 400 });
  if (!type) return noStore({ error: "type is required" }, { status: 400 });
  if (!title) return noStore({ error: "title (headline) is required" }, { status: 400 });

  const row: Parameters<typeof appendSpotlightRow>[0] = {
    profileSlug,
    type,
    title,
    subtitle: (body.subtitle ?? "").trim(),
    bodyNote: (body.bodyNote ?? "").trim(),
    mediaUrls: (body.mediaUrls ?? "").trim(),
    mediaType: (body.mediaType ?? "").trim(),
    eventDate: (body.eventDate ?? "").trim(),
    evergreen: Boolean(body.evergreen),
    expirationDate: (body.expirationDate ?? "").trim(),
    ctaText: (body.ctaText ?? "").trim(),
    ctaUrl: (body.ctaUrl ?? "").trim(),
    featured: Boolean(body.featured),
    sortDate: (body.sortDate ?? "").trim() || new Date().toISOString().split("T")[0],
    tags: (body.tags ?? "").trim(),
    // Soft-delete / restore: POST with hidden:true to hide, hidden:false to restore.
    // De-dup is last-row-wins by (type + title), so the newest row decides visibility.
    hidden: Boolean(body.hidden),
  };

  try {
    await appendSpotlightRow(row);
    return noStore({ ok: true });
  } catch (err: any) {
    console.error("[spotlight POST]", err);
    return noStore({ error: err?.message ?? "Failed to save" }, { status: 500 });
  }
}

// ── DELETE /api/alumni/spotlight — permanent purge, admin only ─────────────────
export async function DELETE(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (!auth.isAdmin) {
    return noStore({ error: "Admin only" }, { status: 403 });
  }

  let body: { profileSlug?: string; kind?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return noStore({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileSlug = (body.profileSlug ?? "").trim();
  const kind = (body.kind ?? "").trim();
  const title = (body.title ?? "").trim();

  if (!profileSlug) return noStore({ error: "profileSlug is required" }, { status: 400 });
  if (kind !== "highlight" && kind !== "spotlight") {
    return noStore({ error: "kind must be 'highlight' or 'spotlight'" }, { status: 400 });
  }
  if (!title) return noStore({ error: "title is required" }, { status: 400 });

  try {
    const removed = await deleteSpotlightRows({ profileSlug, kind, title });
    return noStore({ ok: true, removed });
  } catch (err: any) {
    console.error("[spotlight DELETE]", err);
    return noStore({ error: err?.message ?? "Failed to delete" }, { status: 500 });
  }
}
