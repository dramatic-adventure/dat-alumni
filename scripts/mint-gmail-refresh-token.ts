// scripts/mint-gmail-refresh-token.ts
//
// One-time local script (§5a of site-BUILD-SPEC-gmail-email.md): mints the
// long-lived Gmail refresh token for the site's sending mailbox. Run once from
// a laptop, never deployed.
//
//     npm run mint:gmail-refresh-token
//
// Requires GMAIL_OAUTH_CLIENT_ID and GMAIL_OAUTH_CLIENT_SECRET in the
// environment or .env.local (from the Internal "Desktop app" OAuth client —
// see §4 of the spec). Flow:
//
//   1. Opens (or prints) a Google consent URL scoped to gmail.send ONLY.
//      Sign in as the mailbox that will do the sending (hello@ / mailer@),
//      NOT your personal account — the token is bound to whoever consents.
//   2. A temporary localhost listener catches the OAuth redirect.
//   3. The code is exchanged for tokens; the refresh token is printed once,
//      to the terminal only — never written to a file, never logged elsewhere.
//
// Copy the printed token into `npm run setup:email-secrets` (Netlify Blobs)
// and/or .env.local for local dev, then close the terminal.

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") }); // optional fallback

import http from "http";
import { exec } from "child_process";
import { google } from "googleapis";

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/gmail.send";

function arg(name: string): string {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : "";
}

async function main() {
  const clientId = arg("client-id") || (process.env.GMAIL_OAUTH_CLIENT_ID || "").trim();
  const clientSecret = arg("client-secret") || (process.env.GMAIL_OAUTH_CLIENT_SECRET || "").trim();

  if (!clientId || !clientSecret) {
    console.error(
      "Missing OAuth client credentials.\n" +
        "Set GMAIL_OAUTH_CLIENT_ID and GMAIL_OAUTH_CLIENT_SECRET in .env.local,\n" +
        "or pass --client-id=... --client-secret=... (from the Internal Desktop-app\n" +
        "OAuth client — see §4 of site-BUILD-SPEC-gmail-email.md)."
    );
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force a refresh token even if previously consented
    scope: [SCOPE],
  });

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${PORT}`);
      if (url.pathname !== "/oauth2callback") {
        res.writeHead(404).end();
        return;
      }
      const err = url.searchParams.get("error");
      const c = url.searchParams.get("code");
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        err
          ? `<p>Consent failed: ${err}. You can close this tab.</p>`
          : "<p>Consent received — return to the terminal. You can close this tab.</p>"
      );
      server.close();
      if (err || !c) reject(new Error(`OAuth consent failed: ${err || "no code returned"}`));
      else resolve(c);
    });
    server.listen(PORT, () => {
      console.log("Waiting for consent…\n");
      console.log("IMPORTANT: sign in as the SENDING mailbox (hello@ / mailer@), not your personal account.\n");
      console.log(`If a browser didn't open, visit:\n\n${authUrl}\n`);
      if (process.platform === "darwin") {
        exec(`open "${authUrl}"`, () => {});
      }
    });
    server.on("error", reject);
  });

  const { tokens } = await oauth2.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      "No refresh token in the response. Re-run — the prompt=consent flag should force one.\n" +
        "If it persists, revoke the app's access from the mailbox's Google Account\n" +
        "(Security → Third-party access) and try again."
    );
    process.exit(1);
  }

  console.log("Refresh token (copy it now — it is not saved anywhere):\n");
  console.log(tokens.refresh_token);
  console.log(
    "\nNext: run `npm run setup:email-secrets` to store it (with the client ID/secret)\n" +
      "in the Netlify Blobs store, and optionally add all three to .env.local for local dev."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
