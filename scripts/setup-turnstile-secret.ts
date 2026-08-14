// scripts/setup-turnstile-secret.ts
//
// One-time admin script: writes TURNSTILE_SECRET_KEY into the site-wide
// Netlify Blobs store that lib/turnstile.ts reads at runtime. The secret must
// NOT become a Netlify function env var — the Lambda env bundle is against
// AWS's 4 KB limit and adding secrets there has broken deploys (see CLAUDE.md).
//
// Run with:
//     npm run setup:turnstile-secret
//
// Get the keys at https://dash.cloudflare.com/ → Turnstile → Add site
// (domain: dramaticadventure.com; widget mode: Managed). The SITE key is
// public and goes in Netlify env as NEXT_PUBLIC_TURNSTILE_SITE_KEY, scoped to
// Builds. The SECRET key is what this script stores.
//
// Requires NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN in the environment (or
// .env.local) — locally there is no Netlify runtime to auto-inject Blobs
// credentials.
//
// Input is masked as you type and is never printed, logged, or written
// anywhere except directly into the Blobs store.

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") }); // optional fallback

import { setTurnstileSecret } from "../lib/turnstile";

const KEY_LF = 10;
const KEY_CR = 13;
const KEY_EOF = 4;
const KEY_SIGINT = 3;
const KEY_BACKSPACE = 8;
const KEY_DEL = 127;

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

  console.log("DAT mailing list — Turnstile secret setup");
  console.log("Value is masked as you type and is never logged.\n");

  const secret = await promptMasked("TURNSTILE_SECRET_KEY: ");
  if (!secret) {
    console.error("\nTURNSTILE_SECRET_KEY is required. Aborting — nothing written.");
    process.exit(1);
  }

  await setTurnstileSecret(secret);
  console.log("Stored TURNSTILE_SECRET_KEY.");

  console.log(
    "\nDone. Remaining setup:\n" +
      "  1. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in Netlify env, scoped to BUILDS\n" +
      "     (Site configuration → Environment variables). It is public, not a secret.\n" +
      "  2. Redeploy so the site key is inlined into the client bundle.\n" +
      "  3. Submit each mailing-list form once and confirm rows land as 'subscribed'."
  );
}

main();
