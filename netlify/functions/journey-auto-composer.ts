import { schedule } from "@netlify/functions";
import { getCronSecret } from "../../lib/notificationSecrets";

// Slice 7 (Auto-Composer) — scheduled trigger for the journey auto-assembler +
// end-of-trip nudge. Mirrors send-notifications.ts: the real work (Sheets reads,
// draft-store writes, web-push, Gmail email) lives behind the Next route
// /api/field-kit/journey/auto-assemble, because that logic imports "server-only"
// modules that don't load cleanly in the esbuild-bundled function. This stays a
// thin trigger: every 15 min it POSTs the route with the shared CRON_SECRET.
// The route is idempotent (unchanged drafts are skipped; the nudge log claims
// each channel before sending), so an occasional overlap or retry is safe.

function baseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    process.env.URL || // Netlify: canonical site URL
    process.env.DEPLOY_PRIME_URL || // Netlify: deploy-specific URL
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

const baseHandler = async () => {
  const secret = await getCronSecret();
  if (!secret) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, skipped: "CRON_SECRET unset" }) };
  }

  try {
    const res = await fetch(`${baseUrl()}/api/field-kit/journey/auto-assemble`, {
      method: "POST",
      headers: { "x-cron-secret": secret },
    });
    const body = await res.text();
    return { statusCode: 200, body: JSON.stringify({ ok: res.ok, status: res.status, body }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: String(e) }) };
  }
};

// Every 15 minutes (UTC).
export const handler = schedule("*/15 * * * *", baseHandler);
