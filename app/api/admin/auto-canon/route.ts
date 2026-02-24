// app/api/admin/auto-canon/route.ts
import { NextResponse } from "next/server";
import { ensureCanonicalAlumniSlug } from "@/lib/loadAlumni";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function norm(v: string | null | undefined) {
  return (v ?? "").trim().toLowerCase();
}

/**
 * Admin auth:
 * - In production: REQUIRE ADMIN_API_KEY to be set and matched.
 * - In non-production: allow when unset (local/dev convenience).
 */
function okAdmin(req: Request) {
  const required = (process.env.ADMIN_API_KEY || "").trim();
  const isProd = process.env.NODE_ENV === "production";

  // Production must never allow writes without a configured key.
  if (isProd && !required) return false;

  // Dev convenience: if no key configured, allow.
  if (!required) return true;

  const headerName = process.env.ADMIN_HEADER_NAME || "X-Admin-Key";
  const provided = (req.headers.get(headerName) || "").trim();
  return provided === required;
}
async function run(oldSlugRaw: string | null, nextSlugRaw: string | null) {
  if (process.env.AUTO_CANONICALIZE_SLUGS !== "true") {
    return json({ ok: false, error: "AUTO_CANONICALIZE_SLUGS is not enabled" }, 403);
  }

  const oldSlug = norm(oldSlugRaw);
  const nextSlug = norm(nextSlugRaw);

  if (!oldSlug || !nextSlug) {
    return json({ ok: false, error: "Both 'old' and 'next' slugs are required" }, 400);
  }
  if (oldSlug === nextSlug) {
    // Nothing to do; treat as success / idempotent
    return json({ ok: true, old: oldSlug, next: nextSlug, updated: false });
  }

  try {
    const result = await ensureCanonicalAlumniSlug(oldSlug, nextSlug);
    // Normalize a boolean-ish indicator if your helper returns something custom
    const updated =
      typeof result === "boolean"
        ? result
        : typeof result === "object" && result
        ? true
        : true;

    return json({ ok: true, old: oldSlug, next: nextSlug, updated });
  } catch (err: any) {
    return json({ ok: false, error: String(err?.message || err) }, 500);
  }
}

export async function POST(req: Request) {
  if (!okAdmin(req)) return json({ error: "Forbidden" }, 403);
  const body = await req.json().catch(() => ({} as any));
  return run(body.old ?? null, body.next ?? null);
}

// Convenience: allow GET ?old=...&next=...
export async function GET(req: Request) {
  if (!okAdmin(req)) return json({ error: "Forbidden" }, 403);
  const { searchParams } = new URL(req.url);
  return run(searchParams.get("old"), searchParams.get("next"));
}

