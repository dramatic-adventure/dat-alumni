// scripts/setup-notification-secrets.ts
//
// One-time admin script: writes VAPID_PRIVATE_KEY, VAPID_SUBJECT, and
// CRON_SECRET into the site-wide Netlify Blobs store that
// lib/notificationSecrets.ts reads at runtime. These secrets used to live in
// the Netlify function environment, but combined with the existing GCP
// credentials they pushed the Lambda env over AWS's 4 KB limit and broke
// deploys — see CLAUDE.md.
//
// Run with:
//     npm run setup:notification-secrets
//
// Requires NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN in the environment (or
// .env.local) — locally there is no Netlify runtime to auto-inject Blobs
// credentials. Get a personal access token from
// https://app.netlify.com/user/applications and the site ID from
// Site settings → General → Site details.
//
// Input is masked as you type and is never printed, logged, or written
// anywhere except directly into the Blobs store.
//
// SAFE ROLLOUT: run this only after deploying the Blobs read path (it falls
// back to the env vars of the same name, so leaving them in Netlify env is
// harmless during rollout). Confirm a test push + the cron path still work,
// THEN delete VAPID_PRIVATE_KEY / VAPID_SUBJECT / CRON_SECRET from Netlify env.

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") }); // optional fallback

import { setNotificationSecret, SECRET_KEYS } from "../lib/notificationSecrets";

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

  console.log("DAT Field Kit — notification secrets setup");
  console.log("Values are masked as you type and are never logged.\n");

  const vapidPrivateKey = await promptMasked("VAPID_PRIVATE_KEY: ");
  const vapidSubject = await promptMasked(
    "VAPID_SUBJECT (mailto:/https:, blank = default): "
  );
  const cronSecret = await promptMasked("CRON_SECRET: ");

  if (!vapidPrivateKey || !cronSecret) {
    console.error("\nVAPID_PRIVATE_KEY and CRON_SECRET are required. Aborting — nothing written.");
    process.exit(1);
  }

  await setNotificationSecret("vapidPrivateKey", vapidPrivateKey);
  console.log(`Stored ${SECRET_KEYS.vapidPrivateKey}`);

  if (vapidSubject) {
    await setNotificationSecret("vapidSubject", vapidSubject);
    console.log(`Stored ${SECRET_KEYS.vapidSubject}`);
  } else {
    console.log(`Skipped ${SECRET_KEYS.vapidSubject} (blank — falls back to default/env)`);
  }

  await setNotificationSecret("cronSecret", cronSecret);
  console.log(`Stored ${SECRET_KEYS.cronSecret}`);

  console.log(
    "\nDone. Next: deploy if you haven't, confirm a test push + the cron path work, " +
      "then remove VAPID_PRIVATE_KEY / VAPID_SUBJECT / CRON_SECRET from Netlify env."
  );
}

main();
