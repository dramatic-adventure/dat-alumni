// app/api/alumni/journey/route.ts
//
// Dedicated route for Journey Cards — its OWN entity, NOT the spotlight route.
//
//   GET   ?slug=<profileSlug>  → that alum's live cards
//   GET   ?all=1               → every live card (archive read)
//   POST                       → artist self-publish / edit a card for their OWN
//                                profile slug only. Auth = requireAuth + the
//                                session's profile slug === target slug (via
//                                assertCanEditProfile, which is owner-OR-admin),
//                                NOT a bare isAdmin check.
//   PATCH                      → set status ("removed" | "live") + removalReason.
//                                Owner-or-admin (data is never erased — the row
//                                history is preserved, append-only). When an
//                                admin takes down a card they don't own, the
//                                artist is emailed the reason.
import "server-only";
import { NextResponse } from "next/server";
import {
  assertCanEditProfile,
  resolveSlugToAlumniId,
  getOwnerEmailForAlumniId,
  normalizeGmail,
} from "@/lib/ownership";
import {
  loadJourneyCardsForSlug,
  loadAllJourneyCards,
  loadAllJourneyCardsIncludingRemoved,
  appendJourneyCard,
  findJourneyCardRowById,
  setJourneyCardStatus,
} from "@/lib/loadJourneyCards";
import { formatProgramLabel, type JourneyCardRow } from "@/lib/journeyCard";
import { getSlugAliases } from "@/lib/slugAliases";
import { notifyJourneyTakedown } from "@/lib/notifyJourneyTakedown";

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

const str = (v: unknown) => String(v ?? "").trim();
const lc = (v: unknown) => str(v).toLowerCase();

/** Build a stable, readable card id from its facts plus a uniqueness suffix. */
function makeJourneyCardId(parts: { profileSlug: string; program: string; country: string; year: string }): string {
  const base = [parts.profileSlug, parts.program, parts.country, parts.year]
    .map((s) => str(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("-");
  const suffix = Date.now().toString(36);
  return `${base ? base + "-" : ""}${suffix}`;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("all")) {
      return noStore({ cards: await loadAllJourneyCards() });
    }
    const slug = str(url.searchParams.get("slug"));
    if (!slug) return noStore({ error: "Missing slug" }, { status: 400 });
    const aliases = await getSlugAliases(slug).catch(() => undefined);

    // Management read: live + removed for one slug, gated to owner-or-admin.
    if (url.searchParams.get("includeRemoved")) {
      const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
      const alumniId = spreadsheetId ? await resolveSlugToAlumniId(spreadsheetId, slug) : "";
      if (!alumniId) return noStore({ error: "Profile not found" }, { status: 404 });
      const auth = await assertCanEditProfile(req, alumniId);
      if (!auth.ok) return auth.response;

      const aliasSet = new Set<string>([lc(slug)]);
      if (aliases) for (const a of aliases) aliasSet.add(lc(a));
      const all = await loadAllJourneyCardsIncludingRemoved();
      const cards = all.filter((c) => aliasSet.has(lc(c.profileSlug)));
      return noStore({ cards });
    }

    return noStore({ cards: await loadJourneyCardsForSlug(slug, aliases) });
  } catch (err: any) {
    console.error("[journey GET]", err);
    return noStore({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// ── POST — artist self-publish / edit (owner-or-admin, own slug only) ──────────
export async function POST(req: Request) {
  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return noStore({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileSlug = lc(body.profileSlug);
  if (!profileSlug) return noStore({ error: "profileSlug is required" }, { status: 400 });

  const title = str(body.title);
  const program = str(body.program);
  if (!title && !program) {
    return noStore({ error: "A title or program is required" }, { status: 400 });
  }

  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
  if (!spreadsheetId) {
    return noStore({ error: "Server misconfigured: ALUMNI_SHEET_ID missing" }, { status: 500 });
  }

  // Map the target profile slug → its stable alumniId, then authorize ownership.
  const alumniId = await resolveSlugToAlumniId(spreadsheetId, profileSlug);
  if (!alumniId) return noStore({ error: "Profile not found" }, { status: 404 });

  const auth = await assertCanEditProfile(req, alumniId);
  if (!auth.ok) return auth.response;

  // Editing an existing card: keep its id + createdAt, and refuse if the id
  // belongs to a different profile (prevents cross-profile edits via id spoof).
  const incomingId = str(body.id);
  let existing: JourneyCardRow | null = null;
  if (incomingId) {
    existing = await findJourneyCardRowById(incomingId);
    if (existing && lc(existing.profileSlug) !== profileSlug) {
      return noStore({ error: "Card belongs to a different profile" }, { status: 403 });
    }
  }

  const country = str(body.country) || str(body.location);
  const year = str(body.year);
  const nowIso = new Date().toISOString();
  const today = nowIso.split("T")[0];

  const id = existing?.id || incomingId || makeJourneyCardId({ profileSlug, program, country, year });

  const row: JourneyCardRow = {
    id,
    profileSlug,
    programId: str(body.programId) || existing?.programId || "",
    program,
    location: str(body.location),
    country,
    year,
    title,
    primaryRole: str(body.primaryRole),
    pullQuote: str(body.pullQuote),
    heroUrl: str(body.heroUrl),
    accent: lc(body.accent) || existing?.accent || "teal",
    dates: str(body.dates),
    body: str(body.body),
    mediaUrls: str(body.mediaUrls),
    ctaText: str(body.ctaText),
    ctaUrl: str(body.ctaUrl),
    featured: Boolean(body.featured ?? existing?.featured ?? false),
    sortDate: str(body.sortDate) || existing?.sortDate || today,
    status: "live",
    removalReason: "",
    createdAt: existing?.createdAt || nowIso,
  };

  try {
    await appendJourneyCard(row);
    return noStore({ ok: true, id });
  } catch (err: any) {
    console.error("[journey POST]", err);
    return noStore({ error: err?.message ?? "Failed to save" }, { status: 500 });
  }
}

// ── PATCH — takedown / restore (owner-or-admin) ────────────────────────────────
export async function PATCH(req: Request) {
  let body: { id?: string; status?: string; removalReason?: string };
  try {
    body = await req.json();
  } catch {
    return noStore({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = str(body.id);
  const status = lc(body.status);
  if (!id) return noStore({ error: "id is required" }, { status: 400 });
  if (status !== "removed" && status !== "live") {
    return noStore({ error: "status must be 'removed' or 'live'" }, { status: 400 });
  }

  const existing = await findJourneyCardRowById(id);
  if (!existing) return noStore({ error: "Card not found" }, { status: 404 });

  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
  if (!spreadsheetId) {
    return noStore({ error: "Server misconfigured: ALUMNI_SHEET_ID missing" }, { status: 500 });
  }

  const alumniId = await resolveSlugToAlumniId(spreadsheetId, existing.profileSlug);
  if (!alumniId) return noStore({ error: "Profile not found" }, { status: 404 });

  const auth = await assertCanEditProfile(req, alumniId);
  if (!auth.ok) return auth.response;

  const removalReason = status === "removed" ? str(body.removalReason) : "";

  try {
    const ok = await setJourneyCardStatus({ id, status, removalReason });
    if (!ok) return noStore({ error: "Card not found" }, { status: 404 });

    // Notify the artist only when an admin takes down a card they don't own.
    let notified = false;
    if (status === "removed") {
      const ownerEmail = await getOwnerEmailForAlumniId(spreadsheetId, alumniId).catch(() => "");
      const actorIsOwner =
        !!ownerEmail && normalizeGmail(ownerEmail) === normalizeGmail(auth.email);
      if (ownerEmail && !actorIsOwner) {
        const cardLabel =
          existing.title ||
          formatProgramLabel({ program: existing.program, location: existing.country || existing.location, year: existing.year });
        notified = await notifyJourneyTakedown({
          toEmail: ownerEmail,
          artistName: "",
          cardLabel,
          reason: removalReason,
        });
      }
    }

    return noStore({ ok: true, status, notified });
  } catch (err: any) {
    console.error("[journey PATCH]", err);
    return noStore({ error: err?.message ?? "Failed to update" }, { status: 500 });
  }
}
