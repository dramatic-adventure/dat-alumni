// netlify/functions/refresh-instagram-token.ts
//
// Runs on the 1st of every month and extends the Instagram long-lived access
// token by another 60 days.  The refreshed token is stored in Netlify Blobs
// so the /api/instagram-feed route picks it up automatically — no manual
// env-var update required.
//
// How it works:
//   1. Read the current token from the blob (set by a previous refresh),
//      or fall back to the INSTAGRAM_ACCESS_TOKEN env var (the one you set
//      when you first configured the integration).
//   2. Call the Instagram Graph API token-refresh endpoint.
//   3. Write the new token back to the blob.
//
// The env var is only ever used as the *seed* token.  After the first
// successful automated refresh, the blob becomes the authoritative source.
//
// If the refresh fails (bad token, revoked access, etc.) the function logs
// the error; the existing token keeps working until it expires.

import { schedule } from "@netlify/functions";
import { configGet, configSet, INSTAGRAM_TOKEN_KEY } from "../../lib/blobConfig";

type RefreshResponse = {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
};

async function doRefresh(): Promise<{ ok: boolean; expiresInDays?: number; error?: string }> {
  // Blob token takes priority; env var is the fallback seed.
  const current =
    (await configGet(INSTAGRAM_TOKEN_KEY)) ?? process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!current) {
    const msg = "No Instagram access token found in blob or env — skipping refresh.";
    console.warn("[refresh-instagram-token]", msg);
    return { ok: false, error: msg };
  }

  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${current}`;
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    const msg = `Instagram API ${res.status}: ${body}`;
    console.error("[refresh-instagram-token]", msg);
    return { ok: false, error: msg };
  }

  const data: RefreshResponse = await res.json();
  const saved = await configSet(INSTAGRAM_TOKEN_KEY, data.access_token);
  const expiresInDays = Math.round(data.expires_in / 86_400);

  if (saved) {
    console.log(
      `[refresh-instagram-token] ✓ Token refreshed — expires in ${expiresInDays} days.`
    );
    return { ok: true, expiresInDays };
  } else {
    const msg = "Token refreshed but failed to save to blob.";
    console.error("[refresh-instagram-token]", msg);
    return { ok: false, error: msg };
  }
}

const baseHandler = async () => {
  const result = await doRefresh();
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

// Runs at 09:00 UTC on the 1st of every month (~30-day cadence, well inside 60-day expiry).
export const handler = schedule("0 9 1 * *", baseHandler);
