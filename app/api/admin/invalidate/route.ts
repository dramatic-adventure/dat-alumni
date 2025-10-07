// app/api/admin/invalidate/route.ts
import { NextResponse } from "next/server";
import { invalidateAlumniCaches } from "@/lib/loadAlumni";

export async function GET() {
  invalidateAlumniCaches();
  return NextResponse.json({ ok: true, via: "GET" });
}

export async function POST() {
  invalidateAlumniCaches();
  return NextResponse.json({ ok: true, via: "POST" });
}
