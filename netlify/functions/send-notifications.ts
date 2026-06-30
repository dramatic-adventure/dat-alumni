import { schedule } from "@netlify/functions";

// Slice 3 (Notifications) — scheduled trigger for the Sheet-toggle send path.
// Mirrors refresh-fallbacks.ts (a scheduled @netlify/functions handler), but the
// real work (authenticated Sheets read/stamp + web-push) lives behind the Next
// route /api/field-kit/push/dispatch, because that logic imports "server-only"
// modules that don't load cleanly in the esbuild-bundled function. So this stays a
// thin trigger: every minute it POSTs the dispatch route with the shared
// CRON_SECRET. The route is idempotent (claims rows by stamping sentAt), so an
// occasional overlap or retry is safe.

function baseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    process.env.URL || // Netlify: canonical site URL
    process.env.DEPLOY_PRIME_URL || // Netlify: deploy-specific URL
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

const baseHandler = async () => {
  const secret = String(process.env.CRON_SECRET || "").trim();
  if (!secret) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, skipped: "CRON_SECRET unset" }) };
  }

  try {
    const res = await fetch(`${baseUrl()}/api/field-kit/push/dispatch`, {
      method: "POST",
      headers: { "x-cron-secret": secret },
    });
    const body = await res.text();
    return { statusCode: 200, body: JSON.stringify({ ok: res.ok, status: res.status, body }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};

// Every minute (UTC).
export const handler = schedule("* * * * *", baseHandler);
