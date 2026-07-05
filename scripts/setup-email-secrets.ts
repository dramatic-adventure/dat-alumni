// scripts/setup-email-secrets.ts
//
// One-time admin script: writes GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET,
// and GMAIL_OAUTH_REFRESH_TOKEN into the site-wide Netlify Blobs store that
// lib/emailSecrets.ts reads at runtime. They deliberately do NOT go into the
// Netlify function environment — the Lambda env bundle already sits near AWS's
// 4 KB limit (see CLAUDE.md and scripts/setup-notification-secrets.ts, which
// this mirrors).
//
// Run with:
//     npm run setup:email-secrets
//
// Requires NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN in the environment (or
// .env.local) — locally there is no Netlify runtime to auto-inject Blobs
// credentials. Get a personal access token from
// https://app.netlify.com/user/applications and the site ID from
// Site settings → General → Site details.
//
// Input is masked as you type and is never printed, logged, or written
// anywhere except directly into the Blobs store.

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") }); // optional fallback

import { setEmailSecret, EMAIL_SECRET_KEYS } from "../lib/emailSecrets";

// Key codes, not literal control characters, so this file stays plain text.
const KEY_LF = 10; // \n
const KEY_CR = 13; // \r
const KEY_EOF = 4; // Ctrl+D
const KEY_SIGINT = 3; // Ctrl+C
const KEY_BACKSPACE = 8; // \b
const KEY_DEL = 127; // backspace in raw mode

function promptMasked(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    const isTTY = !!stdin.isTTY;

    stdout.write(question);
    if (isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";

    const onData = (chunk: string) => {
      for (const char of chunk) {
        const code = char.charCodeAt(0);

        if (code === KEY_LF || code === KEY_CR || code === KEY_EOF) {
          if (isTTY) stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          stdout.write("\n");
          resolve(value.trim());
          return;
        }
        if (code === KEY_SIGINT) {
          stdout.write("\n");
          process.exit(1);
        }
        if (code === KEY_DEL || code === KEY_BACKSPACE) {
          if (value.length > 0) {
            value = value.slice(0, -1);
            if (isTTY) stdout.write("\b \b");
          }
          continue;
        }

        value += char;
        if (isTTY) stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}

async function main() {
  const siteID = (process.env.NETLIFY_SITE_ID || "").trim();
  const token = (process.env.NETLIFY_AUTH_TOKEN || "").trim();
  if (!siteID || !token) {
    console.error(
      "Missing NETLIFY_SITE_ID and/or NETLIFY_AUTH_TOKEN.\n" +
        "Set them (e.g. in .env.local) before running this script — locally there's\n" +
        "no Netlify runtime to auto-inject Blobs credentials."
    );
    process.exit(1);
  }

  console.log("DAT site — Gmail email secrets setup");
  console.log("Values are masked as you type and are never logged.\n");

  const clientId = await promptMasked("GMAIL_OAUTH_CLIENT_ID: ");
  const clientSecret = await promptMasked("GMAIL_OAUTH_CLIENT_SECRET: ");
  const refreshToken = await promptMasked(
    "GMAIL_OAUTH_REFRESH_TOKEN (from npm run mint:gmail-refresh-token): "
  );

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("\nAll three values are required. Aborting — nothing written.");
    process.exit(1);
  }

  await setEmailSecret("gmailClientId", clientId);
  console.log(`Stored ${EMAIL_SECRET_KEYS.gmailClientId}`);

  await setEmailSecret("gmailClientSecret", clientSecret);
  console.log(`Stored ${EMAIL_SECRET_KEYS.gmailClientSecret}`);

  await setEmailSecret("gmailRefreshToken", refreshToken);
  console.log(`Stored ${EMAIL_SECRET_KEYS.gmailRefreshToken}`);

  console.log(
    "\nDone. Make sure CONTACT_FROM_EMAIL is set in Netlify env (it's tiny and\n" +
      "non-secret, so it stays there), then deploy and send a test through the\n" +
      "contact form. Warm instances cache secrets, so a redeploy picks up changes."
  );
}

main();
