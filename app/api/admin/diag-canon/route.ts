// app/api/admin/diag-canon/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  return NextResponse.json({
    ok: true,
    path: "/api/admin/diag-canon",
    query: Object.fromEntries(url.searchParams.entries()),
  });
}
