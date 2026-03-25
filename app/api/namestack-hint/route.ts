// app/api/namestack-hint/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";          // reliable process.env in dev & Netlify
export const dynamic = "force-dynamic";

function noStoreJson(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...(init || {}),
    headers: { "Cache-Control": "no-store" },
  });
}

const TIMEOUT_MS = 2500;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // --- diagnostics ---
  if (url.searchParams.get("diag") === "1") {
    return noStoreJson({
      ok: true,
      hasUrl: !!process.env.NAMESTACK_GAS_URL,
      hasToken: !!process.env.NAMESTACK_TOKEN,
      gasUrlSample: process.env.NAMESTACK_GAS_URL?.slice(0, 40) ?? null,
      runtime: "nodejs",
    });
  }
  // -------------------

  const key = url.searchParams.get("key") || "";
  if (!key || key.length > 1024) return noStoreJson({ ok: false }, { status: 400 });

  const GAS_URL = process.env.NAMESTACK_GAS_URL;
  const TOKEN   = process.env.NAMESTACK_TOKEN;

  // Graceful no-op if not configured
  if (!GAS_URL || !TOKEN) return noStoreJson({ ok: true, data: null });

  try {
    const u = `${GAS_URL}?key=${encodeURIComponent(key)}&token=${encodeURIComponent(TOKEN)}`;
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(u, { signal: controller.signal, cache: "no-store", redirect: "follow" });
    clearTimeout(to);

    // Optional: raw passthrough for debugging
    if (url.searchParams.get("raw") === "1") {
      const txt = await res.text();
      return new NextResponse(txt, {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": res.headers.get("content-type") || "application/json",
        },
        status: res.status,
      });
    }

    if (!res.ok) return noStoreJson({ ok: true, data: null });
    const js = await res.json().catch(() => null);
    return noStoreJson({ ok: true, data: js?.data ?? null });
  } catch {
    return noStoreJson({ ok: true, data: null });
  }
}

export async function POST(req: NextRequest) {
  const GAS_URL = process.env.NAMESTACK_GAS_URL;
  const TOKEN   = process.env.NAMESTACK_TOKEN;

  const body = (await req.json().catch(() => null)) as any;
  const data = body?.data;
  const key  = body?.key as string;

  const sane =
    typeof key === "string" &&
    key.length > 0 &&
    key.length <= 1024 &&
    data &&
    [data.fSize, data.lSize, data.y1, data.y2, data.svgH].every((n: number) => Number.isFinite(n) && Math.abs(n) < 1e6);

  if (!sane) return noStoreJson({ ok: false }, { status: 400 });

  if (!GAS_URL || !TOKEN) return noStoreJson({ ok: true }); // no-op if not configured

  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      body: JSON.stringify({ key, data, token: TOKEN }),
    });
    clearTimeout(to);

    if (!res.ok) return noStoreJson({ ok: true });
    return noStoreJson({ ok: true });
  } catch {
    return noStoreJson({ ok: true });
  }
}
