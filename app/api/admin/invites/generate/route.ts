// app/api/admin/invites/generate/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAuth";
import { generateInvites } from "@/lib/invites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://stories.dramaticadventure.com"
  ).replace(/\/$/, "");
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const requests: { alumniId: string; alumniName: string }[] = Array.isArray(body)
    ? body
    : Array.isArray(body?.alumni)
    ? body.alumni
    : [];

  if (requests.length === 0) {
    return NextResponse.json(
      { error: "Provide an array of { alumniId, alumniName } objects" },
      { status: 400 }
    );
  }

  try {
    const results = await generateInvites(requests, siteUrl());
    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error("[invites/generate]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate invites" },
      { status: 500 }
    );
  }
}
