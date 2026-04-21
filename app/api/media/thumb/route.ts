// app/api/media/thumb/route.ts
//
// Legacy shim: redirects old ?fileId= query-param URLs to the new path-based format
// /api/media/thumb/[fileId]. All active callers have been updated to use the new
// path format; this redirect exists only for any URLs cached in browsers.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileId = String(searchParams.get("fileId") || "").trim();

  if (!fileId) {
    return NextResponse.json(
      { error: "fileId required" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const w = searchParams.get("w");
  const newPath = `/api/media/thumb/${encodeURIComponent(fileId)}${w ? `?w=${encodeURIComponent(w)}` : ""}`;
  return NextResponse.redirect(new URL(newPath, req.url), 302);
}
