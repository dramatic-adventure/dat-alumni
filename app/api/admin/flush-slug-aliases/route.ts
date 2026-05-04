// app/api/admin/flush-slug-aliases/route.ts
import { NextResponse } from "next/server";
import { invalidateSlugAliasesCache } from "@/lib/slugAliases";

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, error: "Dev only" }, { status: 403 });
  }

  invalidateSlugAliasesCache();

  return NextResponse.json({ ok: true });
}
