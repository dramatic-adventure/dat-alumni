// app/api/admin/diag-canon/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.json({
    ok: true,
    path: "/api/admin/diag-canon",
    query: Object.fromEntries(url.searchParams.entries()),
  });
}
