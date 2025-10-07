// app/api/admin/diag-aliases/route.ts
import { NextResponse } from "next/server";
import { getSlugAliases, normSlug } from "@/lib/slugAliases";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = normSlug(searchParams.get("slug") || "");
  if (!slug) return NextResponse.json({ ok: false, error: "slug required" }, { status: 400 });

  try {
    const aliases = await getSlugAliases(slug);
    return NextResponse.json({
      ok: true,
      slug,
      aliasCount: aliases.size,
      aliases: Array.from(aliases.values()).sort(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, slug, error: e?.message || String(e) }, { status: 500 });
  }
}
