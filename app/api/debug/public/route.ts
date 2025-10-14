// app/api/debug/public/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  const cwd = process.cwd();
  const p = path.join(cwd, "public", "seasons", "season-fallback.jpg");
  const exists = fs.existsSync(p);
  const dir = fs.existsSync(path.join(cwd, "public", "seasons"))
    ? fs.readdirSync(path.join(cwd, "public", "seasons"))
    : [];

  return NextResponse.json({ cwd, exists, path: p, dir });
}
