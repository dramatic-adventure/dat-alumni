import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function postToAppsScript(payload: unknown) {
  const url = process.env.DC_UPDATES_WEBHOOK_URL;
  if (!url) throw new Error("Missing DC_UPDATES_WEBHOOK_URL");

  // Apps Script often returns 302 even when doPost succeeds.
  // We'll treat ANY 2xx/3xx as success.
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    redirect: "manual",
  });

  const status = res.status;

  // Success: 200–399 (including redirects)
  if (status >= 200 && status < 400) {
    return { ok: true, status };
  }

  // Failure: try to capture some response text for debugging
  const text = await res.text().catch(() => "");
  return { ok: false, status, text };
}

export async function POST(req: Request) {
  try {
    const secret = process.env.DC_UPDATES_SECRET;
    if (!secret) throw new Error("Missing DC_UPDATES_SECRET");

    const body = (await req.json().catch(() => ({}))) as any;

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    // ✅ accept both clubName and club (since you used both in tests)
    const clubName = String(body?.clubName || body?.club || "").trim();

    // ✅ include slug if you have it (great for analysis later)
    const clubSlug = String(body?.clubSlug || "").trim();

    // If client didn’t send pagePath, fall back to referer path
    let pagePath = String(body?.pagePath || "").trim();
    if (!pagePath) {
      const ref = req.headers.get("referer") || "";
      try {
        if (ref) pagePath = new URL(ref).pathname;
      } catch {
        // ignore
      }
    }

    const source = String(body?.source || "dc_updates_form").trim();
    const userAgent = String(body?.userAgent || req.headers.get("user-agent") || "").trim();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email" },
        { status: 400 }
      );
    }

    const payload = {
      secret,
      email,
      clubName,
      clubSlug,
      pagePath,
      source,
      userAgent,
    };

    const upstream = await postToAppsScript(payload);

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Upstream failed",
          status: upstream.status,
          // Keep this out if you don’t want to expose it:
          // debug: upstream.text?.slice(0, 200),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
