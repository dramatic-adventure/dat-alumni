// app/api/admin/slug-health/route.ts
import { NextResponse } from "next/server";
import { loadAlumni, loadVisibleAlumni, getSlugForward } from "@/lib/loadAlumni";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const inSlug = norm(searchParams.get("slug"));
  if (!inSlug) {
    return NextResponse.json({ error: "Missing ?slug=" }, { status: 400 });
  }

  // 1) Forward map
  const forward = await getSlugForward(inSlug);
  const canonical = forward || inSlug;

  // 2) Check alumni data (any + visible)
  const all = await loadAlumni();
  const vis = await loadVisibleAlumni();

  const matchAll = all.find(a => norm(a.slug) === canonical) || null;
  const matchVis = vis.find(a => norm(a.slug) === canonical) || null;

  const out = {
    input: inSlug,
    forwardTarget: forward,               // null if none
    canonicalSlug: canonical,             // where we should land
    existsInAlumni: !!matchAll,
    visibleInAlumni: !!matchVis,
    sample: matchAll ? {
      slug: matchAll.slug,
      name: matchAll.name || "",
      showOnProfile: (matchAll.showOnProfile || "").toString(),
    } : null,
    suggestions: [] as string[],
  };

  if (!matchAll) {
    out.suggestions.push(
      `Add a row in Alumni CSV with slug='${canonical}' (and at least Name, Show on Profile?=YES).`
    );
  } else if (!matchVis) {
    out.suggestions.push(
      `Set "Show on Profile?" to YES for slug='${canonical}' (or fill required fields so it isn’t filtered out).`
    );
  }

  return NextResponse.json(out);
}
