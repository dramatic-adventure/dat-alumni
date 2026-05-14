// app/api/admin/purge-headshot/route.ts
//
// Admin endpoint to purge a specific headshot from Netlify's CDN cache by
// cache tag. Call this after manually deleting an image from Google Drive so
// the CDN stops serving the stale cached copy.
//
// POST /api/admin/purge-headshot
// Body: { "fileId": "<Google Drive file ID>" }
//
// Requires: admin auth + NETLIFY_PERSONAL_ACCESS_TOKEN env var set in Netlify dashboard.
//
// The site_id below matches the dat-alumni Netlify site.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAuth";

const NETLIFY_SITE_ID = "8603a44e-f01e-4346-ba86-19d457889e5a";
const NETLIFY_PURGE_URL = "https://api.netlify.com/api/v1/purge";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // --- Auth guard ---
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  // --- Parse body ---
  let fileId: string | undefined;
  try {
    const body = await req.json();
    fileId = typeof body?.fileId === "string" ? body.fileId.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!fileId) {
    return NextResponse.json(
      { error: "fileId is required in the request body" },
      { status: 400 }
    );
  }

  // --- Netlify personal access token ---
  const token = process.env.NETLIFY_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    console.error("[purge-headshot] NETLIFY_PERSONAL_ACCESS_TOKEN is not set");
    return NextResponse.json(
      { error: "Server misconfiguration: missing Netlify token" },
      { status: 500 }
    );
  }

  // --- Call Netlify Purge API ---
  const cacheTag = `headshot-${fileId}`;
  const purgeRes = await fetch(NETLIFY_PURGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      site_id: NETLIFY_SITE_ID,
      cache_tags: [cacheTag],
    }),
  });

  if (!purgeRes.ok) {
    const text = await purgeRes.text().catch(() => "");
    console.error(
      `[purge-headshot] Netlify purge failed ${purgeRes.status}: ${text}`
    );
    return NextResponse.json(
      { error: `Netlify purge failed: ${purgeRes.status}`, detail: text },
      { status: 502 }
    );
  }

  console.log(
    `[purge-headshot] Purged cache tag "${cacheTag}" for fileId "${fileId}" (user: ${auth.email})`
  );

  return NextResponse.json({
    ok: true,
    purged: cacheTag,
    fileId,
  });
}
