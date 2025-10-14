// app/api/admin/diag-loadcsv/route.ts
import { NextResponse } from "next/server";
import { loadCsv } from "@/lib/loadCsv";

export const runtime = "nodejs"; // SA fallback + fetch timeouts rely on Node APIs

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const url = searchParams.get("url") || "";
  const fallback = searchParams.get("fallback") || "diag.csv";

  // Options (all optional)
  // ?noStore=1  -> force no-store + cache-buster (useful for Sheets)
  // ?revalidate=60 -> ISR seconds (ignored if noStore=1)
  // ?cacheBust=1 -> force cache-buster even if not noStore
  const noStore = ["1", "true", "yes"].includes(
    (searchParams.get("noStore") || "").toLowerCase()
  );
  const rv = searchParams.get("revalidate");
  const revalidate = rv ? Number(rv) : undefined;
  const cacheBust = ["1", "true", "yes"].includes(
    (searchParams.get("cacheBust") || "").toLowerCase()
  );

  if (!url) {
    return NextResponse.json(
      { ok: false, error: "Missing ?url=" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const text = await loadCsv(url, fallback, { noStore, revalidate, cacheBust });

    // Return raw CSV text for easy eyeballing in browser/curl
    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-LoadCsv-NoStore": String(noStore),
        "X-LoadCsv-Revalidate": String(revalidate ?? ""),
        "X-LoadCsv-CacheBust": String(cacheBust),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
