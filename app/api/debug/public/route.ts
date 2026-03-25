// app/api/debug/public/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // ✅ Never expose debug endpoints in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  // keep whatever you want here in dev only
  const cwd = process.cwd();
  return NextResponse.json(
    { ok: true, cwd },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}