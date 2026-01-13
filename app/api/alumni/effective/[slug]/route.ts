// app/api/alumni/effective/[slug]/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, string>;

const MEDIA_URL = process.env.NEXT_PUBLIC_PROFILE_MEDIA_CSV_URL || "";

function lower(x: unknown) {
  return String(x ?? "").toLowerCase();
}

function truthy(x: unknown) {
  return ["true", "1", "yes", "y", "on", "✓", "checked"].includes(lower(x).trim());
}

function toIntMaybe(x: unknown) {
  const n = parseInt(String(x ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

function swr() {
  return { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" };
}

function nocache() {
  return { "Cache-Control": "no-store" };
}

/**
 * Build an absolute origin from the incoming request.
 * Prevents Node fetch() from failing on relative URLs.
 */
function getOrigin(req: Request) {
  const u = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (proto && host) return `${proto}://${host}`;
  return u.origin;
}

/**
 * Match key for rows that might be alumniId or slug.
 */
function keyOf(r: Row) {
  return lower(r.alumniId || r["alumni id"] || r.id || r.slug).trim();
}

/**
 * Pick a "featured" fileId for a given kind, for this alumni.
 * Priority:
 *  1) isCurrent/isFeatured true (depending on kind)
 *  2) lowest sortIndex (if numeric)
 *  3) latest uploadedAt (lex compare works on ISO)
 */
function pickFeaturedFileId(mediaRows: Row[], target: string, kind: string) {
  const k = kind.toLowerCase();
  const t = lower(target).trim();
  if (!t) return "";

  const candidates = mediaRows
    .filter((m) => keyOf(m) === t && lower(m.kind).trim() === k)
    .filter((m) => {
      if (k === "headshot") return truthy(m.isCurrent);
      return truthy(m.isFeatured);
    });

  if (!candidates.length) return "";

  candidates.sort((a, b) => {
    const ai = toIntMaybe(a.sortIndex);
    const bi = toIntMaybe(b.sortIndex);

    if (ai != null && bi != null && ai !== bi) return ai - bi;
    if (ai != null && bi == null) return -1;
    if (ai == null && bi != null) return 1;

    const au = String(a.uploadedAt || "");
    const bu = String(b.uploadedAt || "");
    if (au && bu && au !== bu) return au > bu ? -1 : 1; // newest first
    return 0;
  });

  return String(candidates[0].fileId || "").trim();
}

/**
 * Fetch JSON with hard no-store.
 */
async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.headers || {}),
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    (err as any).status = res.status;
    (err as any).detail = text.slice(0, 400);
    throw err;
  }

  return res.json();
}

/**
 * Tiny CSV parser (no dependencies) for Media CSV short-term.
 */
function parseCsvSimple(text: string): Row[] {
  const lines = String(text || "").split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];

  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const headers = split(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows: Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = split(lines[i]).map((c) => c.replace(/^"|"$/g, ""));
    const row: Row = {};
    for (let j = 0; j < headers.length; j++) row[headers[j] || String(j)] = cells[j] ?? "";
    rows.push(row);
  }

  return rows;
}

async function fetchCsvAsRows(url: string): Promise<Row[]> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "text/csv, text/plain; q=0.9, */*; q=0.8" },
  });
  if (!res.ok) return [];
  const text = await res.text().catch(() => "");
  return parseCsvSimple(text);
}

/**
 * Normalize status label:
 * - pending => needs_review
 */
function normalizeStatus(raw: unknown) {
  const s = String(raw ?? "").trim();
  if (s.toLowerCase() === "pending") return "needs_review";
  return s;
}

export async function GET(req: Request, ctx: { params: { slug: string } }) {
  try {
    const incoming = lower(ctx.params.slug).trim();
    if (!incoming) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: nocache() });
    }

    const url = new URL(req.url);
    const wantJson = url.searchParams.get("json") === "1"; // debug helper
    const wantRedirect = url.searchParams.get("redirect") === "1"; // canonical redirect helper

    const origin = getOrigin(req);

    // Authoritative canonicalization + Live profile data
    const lookupUrl = new URL("/api/alumni/lookup", origin);
    lookupUrl.searchParams.set("alumniId", incoming);

    const base: any = await fetchJson(lookupUrl.toString(), {
      headers: {
        "x-debug": req.headers.get("x-debug") || "",
        "x-admin-token": req.headers.get("x-admin-token") || "",
      },
    });

    const canonical = lower(base?.canonicalSlug || incoming).trim();

const redirectedFrom =
  lower(base?.redirectedFrom || "").trim() ||
  (canonical && canonical !== incoming ? incoming : "");

const hasRedirect = Boolean(canonical && incoming && canonical !== incoming);


    // Optional redirect mode (useful for browser hits)
    if (wantRedirect && canonical && canonical !== incoming) {
      return NextResponse.redirect(new URL(`/alumni/${canonical}`, origin), 308);
    }

    // Build merged row in the old "effective" shape (string dictionary)
    const merged: Row = {
      ...(Object.fromEntries(
        Object.entries(base || {}).map(([k, v]) => [k, v == null ? "" : String(v)])
      ) as Row),

      canonicalSlug: canonical || incoming,
      ...(hasRedirect ? { redirectedFrom, redirectTo: canonical } : {}),

      // Normalize status semantics for clients
      status: normalizeStatus(base?.status),
    };

    // Media enrichment (short-term CSV) — safe if unset
    if (MEDIA_URL) {
      const mediaRows = await fetchCsvAsRows(MEDIA_URL);

      const mediaHeadshotId =
        pickFeaturedFileId(mediaRows, canonical, "headshot") ||
        pickFeaturedFileId(mediaRows, incoming, "headshot") ||
        String(merged.currentHeadshotId || "").trim();

      if (mediaHeadshotId) {
        merged.headshotUrl = `/media/${mediaHeadshotId}`;
        merged.currentHeadshotId = mediaHeadshotId;
      }

      const mediaFeaturedAlbumId =
        String(merged.featuredAlbumId || "").trim() ||
        pickFeaturedFileId(mediaRows, canonical, "album") ||
        pickFeaturedFileId(mediaRows, incoming, "album");

      if (mediaFeaturedAlbumId) {
        merged.featuredAlbumUrl = `/media/${mediaFeaturedAlbumId}`;
        merged.featuredAlbumId = mediaFeaturedAlbumId;
      }

      const mediaFeaturedReelId =
        String(merged.featuredReelId || "").trim() ||
        pickFeaturedFileId(mediaRows, canonical, "reel") ||
        pickFeaturedFileId(mediaRows, incoming, "reel");

      if (mediaFeaturedReelId) {
        merged.featuredReelUrl = `/media/${mediaFeaturedReelId}`;
        merged.featuredReelId = mediaFeaturedReelId;
      }

      const mediaFeaturedEventId =
        String(merged.featuredEventId || "").trim() ||
        pickFeaturedFileId(mediaRows, canonical, "event") ||
        pickFeaturedFileId(mediaRows, incoming, "event");

      if (mediaFeaturedEventId) {
        merged.featuredEventUrl = `/media/${mediaFeaturedEventId}`;
        merged.featuredEventId = mediaFeaturedEventId;
      }
    }

    // json=1 doesn’t change output; it just guarantees no redirects (already true)
    if (wantJson) {
      // no-op
    }

    return NextResponse.json(merged, {
      headers: {
        ...swr(),
        "Content-Type": "application/json",
        ...(hasRedirect ? { "X-Canonical-Slug": canonical } : {}),
      },
    });
  } catch (e: any) {
    const status = Number(e?.status) || 500;
    const detail = String(e?.detail || e?.message || e || "");

    if (status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: nocache() });
    }

    console.error("effective-profile error:", detail);
    return NextResponse.json(
      { error: "Server error", detail: detail.slice(0, 400) },
      { status: 500, headers: nocache() }
    );
  }
}
