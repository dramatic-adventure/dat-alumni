// app/api/admin/invalidate/route.ts
import { NextResponse } from "next/server";
import { invalidateAlumniCaches } from "@/lib/loadAlumni";
import { requireAdmin } from "@/lib/requireAuth";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  invalidateAlumniCaches();
  return NextResponse.json({ ok: true, via: "GET" });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  invalidateAlumniCaches();
  return NextResponse.json({ ok: true, via: "POST" });
}
