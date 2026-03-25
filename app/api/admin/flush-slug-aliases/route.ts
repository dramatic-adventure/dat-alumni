// app/api/admin/flush-slug-aliases/route.ts
import { NextResponse } from "next/server";
import { invalidateSlugAliasesCache } from "@/lib/slugAliases";
import { promises as fs } from "node:fs";
import path from "node:path";

// Optional: wipe local CSV fallbacks (dev only).
// IMPORTANT: these live under FALLBACK_DIR (default: public/fallback)
const FALLBACKS = ["slug-map.csv"];

function getFallbackDir() {
  return process.env.FALLBACK_DIR || path.join("public", "fallback");
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, error: "Dev only" }, { status: 403 });
  }

  const url = new URL(req.url);
  const deep = url.searchParams.get("deep") === "1";

  // Always flush in-memory map
  invalidateSlugAliasesCache();

  const removed: string[] = [];

  if (deep) {
    const dir = getFallbackDir();

    for (const file of FALLBACKS) {
      const p = path.join(process.cwd(), dir, file);
      try {
        await fs.unlink(p);
        removed.push(path.join(dir, file));
      } catch {
        // ignore missing / permission errors in dev
      }
    }
  }

  return NextResponse.json({ ok: true, deep, removed });
}
