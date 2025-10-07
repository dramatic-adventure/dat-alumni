// app/api/admin/flush-slug-aliases/route.ts
import { NextResponse } from "next/server";
import { invalidateSlugAliasesCache } from "@/lib/slugAliases";
import fs from "node:fs";
import path from "node:path";

// Optional: wipe local CSV fallbacks written by loadCsv()
const FALLBACKS = ["slug-forwards", "slug-map.csv"]; // add more if you want

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, error: "Dev only" }, { status: 403 });
  }

  const url = new URL(req.url);
  const deep = url.searchParams.get("deep") === "1";

  invalidateSlugAliasesCache();

  const removed: string[] = [];
  if (deep) {
    for (const f of FALLBACKS) {
      const p = path.join(process.cwd(), f);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); removed.push(f); } catch {}
      }
    }
  }

  return NextResponse.json({ ok: true, deep, removed });
}
