// app/api/admin/forward-slug/route.ts
import { NextResponse, NextRequest } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAuth } from "@/lib/requireAuth";
import { getSlugForward, ensureCanonicalAlumniSlug } from "@/lib/loadAlumni";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";

const envTrue = (v: string | undefined | null, dflt = true) =>
  (v ?? String(dflt)).trim().toLowerCase() === "true";

const AUTO_CANON = envTrue(process.env.AUTO_CANONICALIZE_SLUGS, true);

/** Admin helper: comma-separated list in env (case-insensitive) */
function isAdminEmail(email: string | undefined | null) {
  const raw = process.env.ADMIN_EMAILS || "";
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return !!(email && set.has(String(email).toLowerCase()));
}

function normalizeSlug(s: unknown): string {
  return String(s || "").trim().toLowerCase();
}

/**
 * GET: read-only resolver used by middleware
 * - ?slug=<incoming>
 * - returns { input, target }
 * - if a forward exists and AUTO_CANONICALIZE_SLUGS=true, kicks off ensureCanonicalAlumniSlug(incoming, target)
 */
export async function GET(req: NextRequest) {
  try {
    const slug = normalizeSlug(req.nextUrl.searchParams.get("slug"));
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const target = (await getSlugForward(slug)) || null;

    // Fire-and-forget auto-canon: if there's a forward, try to update the sheet row
    if (AUTO_CANON && target && target !== slug) {
      ensureCanonicalAlumniSlug(slug, target).catch(() => {});
    }

    const res = NextResponse.json({ input: slug, target });
    res.headers.set("x-slug-in", slug);
    res.headers.set("x-slug-target", target || "");
    res.headers.set("x-slug-action", target && target !== slug ? "redirect" : "pass");
    if (AUTO_CANON && target && target !== slug) res.headers.set("x-autocanon", "queued");
    return res;
  } catch (e: any) {
    if (DEBUG) console.error("forward-slug GET error:", e?.message || e);
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}

/**
 * POST: admin writer to append a mapping into Profile-Slugs
 * body: { fromSlug, toSlug }
 * - Idempotent: no-op if the latest effective mapping already equals the resolved final target
 * - Collapses chains: writes fromSlug -> ultimateTarget to avoid multi-hop
 */
export async function POST(req: Request) {
  try {
    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    // 1) Auth: allow header override OR signed-in admin
    const adminHeaderName = process.env.ADMIN_HEADER_NAME || "X-Admin-Key";
    const adminKey = req.headers.get(adminHeaderName);
    const headerOk = !!adminKey && adminKey === process.env.ADMIN_API_KEY;

    let actorEmail = "";
    if (!headerOk) {
      const auth = await requireAuth(req);
      if (!auth.ok) return auth.response;
      actorEmail = auth.email || "";
      if (!isAdminEmail(actorEmail)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 2) Parse & validate inputs
    const body = await req.json().catch(() => ({} as any));
    const fromRaw = body?.fromSlug;
    const toRaw = body?.toSlug;

    const from = normalizeSlug(fromRaw);
    const to = normalizeSlug(toRaw);

    if (!from || !to) {
      return NextResponse.json({ error: "fromSlug and toSlug are required" }, { status: 400 });
    }
    if (from === to) {
      return NextResponse.json({ error: "fromSlug and toSlug cannot be the same" }, { status: 400 });
    }

    const sheets = sheetsClient();

    // 3) Ensure header exists on Profile-Slugs (A:C)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Profile-Slugs!A1:C1",
      valueInputOption: "RAW",
      requestBody: { values: [["fromSlug", "toSlug", "createdAt"]] },
    });

    // 4) Read existing mappings to build latest forward map
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Slugs!A:C",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const rows = ((existing.data.values || []) as string[][]).slice(1);

    const forward = new Map<string, string>(); // from -> to (last one wins)
    for (const [f, t] of rows) {
      const ff = normalizeSlug(f);
      const tt = normalizeSlug(t);
      if (ff && tt) forward.set(ff, tt);
    }

    // Helper: follow map to ultimate target (with cycle guard)
    const resolveFinal = (start: string): string => {
      const seen = new Set<string>();
      let cur = start;
      while (forward.has(cur)) {
        if (seen.has(cur)) break; // safety
        seen.add(cur);
        cur = forward.get(cur)!;
      }
      return cur;
    };

    // 5) Resolve final chain for both input and desired target
    const finalFromTarget = resolveFinal(from);
    const finalDesiredTarget = resolveFinal(to);

    // Cycle prevention: if finalDesiredTarget ultimately points back to `from`
    if (finalDesiredTarget === from) {
      return NextResponse.json({ error: "Mapping would create a cycle" }, { status: 400 });
    }

    // Idempotency: if current effective mapping already equals desired final target, no-op
    if (forward.get(from) === finalDesiredTarget || finalFromTarget === finalDesiredTarget) {
      return NextResponse.json({
        ok: true,
        fromSlug: from,
        toSlug: finalDesiredTarget,
        createdAt: null,
        actor: actorEmail || "api-key",
        updated: false,
        note: "No change (already forwards to the same final target)",
      });
    }

    // 6) Append collapsed mapping (from -> ultimate target)
    const nowIso = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Profile-Slugs!A:C",
      valueInputOption: "RAW",
      requestBody: { values: [[from, finalDesiredTarget, nowIso]] },
    });

    return NextResponse.json({
      ok: true,
      fromSlug: from,
      toSlug: finalDesiredTarget,
      createdAt: nowIso,
      actor: actorEmail || "api-key",
      updated: true,
    });
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error("forward-slug POST error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
