// app/api/admin/seed-instagram-token/route.ts
//
// One-time (or rare-use) admin endpoint to seed the Instagram long-lived
// access token into the dat-config Netlify Blob.
//
// Why this exists: Netlify env vars share a 4KB cap (AWS Lambda limit) and
// adding the IG token tips total env over. /api/instagram-feed and
// netlify/functions/refresh-instagram-token both prefer the blob over the
// env var, so seeding the blob skips the env-var problem entirely. After
// seeding, the monthly refresh function rotates the token automatically.
//
// Usage (curl):
//   curl -X POST https://YOUR_SITE/api/admin/seed-instagram-token \
//     -H "x-admin-key: $ADMIN_API_KEY" \
//     -H "content-type: application/json" \
//     -d '{"token":"IGAAGm..."}'
//
// To overwrite an existing blob value, pass `"force": true`.

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { configGet, configSet, INSTAGRAM_TOKEN_KEY } from "@/lib/blobConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    if (!auth.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const force = body?.force === true;

    if (!token) {
      return NextResponse.json(
        { error: "token (string) is required in JSON body" },
        { status: 400 }
      );
    }

    // Light sanity check — IG long-lived tokens are well over 50 chars.
    if (token.length < 50) {
      return NextResponse.json(
        { error: "token appears too short to be a valid IG access token" },
        { status: 400 }
      );
    }

    const existing = await configGet(INSTAGRAM_TOKEN_KEY);
    if (existing && !force) {
      return NextResponse.json(
        {
          ok: false,
          action: "skipped",
          reason:
            "Token already exists in blob. Pass {\"force\": true} to overwrite.",
        },
        { status: 409 }
      );
    }

    const saved = await configSet(INSTAGRAM_TOKEN_KEY, token);
    if (!saved) {
      return NextResponse.json(
        { error: "Failed to write token to blob" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      action: existing ? "overwrote" : "seeded",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
