// app/api/admin/flush-slug-aliases/route.ts
import { NextResponse } from "next/server";
import { invalidateSlugAliasesCache } from "@/lib/slugAliases";
import { requireAdmin } from "@/lib/requireAuth";

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, error: "Dev only" }, { status: 403 });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  invalidateSlugAliasesCache();

  return NextResponse.json({ ok: true });
}
