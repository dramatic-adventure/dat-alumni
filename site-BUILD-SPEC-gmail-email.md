# Site — Production Build Spec: Gmail/Workspace Email (replaces Resend)

**Status:** Resolved with Jesse (2026-07-04) — ready to build. Hand this whole file to a fresh Claude (Fable) task as the anchoring context.
**Prepared:** 2026-07-04 · triggered while closing out the Journey Card project: `RESEND_API_KEY`/`CONTACT_FROM_EMAIL` were never actually set on Netlify, which meant every email-sending route on the site has been silently broken in production (see §1).
**Depends on:** Nothing else in flight. Touches 9 existing files; no Journey Card / Field Kit code is affected.
**Revision note (2026-07-04, same day):** the first draft of this spec recommended SMTP with a Gmail app password. Jesse correctly pushed back — app passwords aren't scopable to one protocol, so a leaked one exposes IMAP read access to the underlying mailbox, not just send. A second pass then considered Gmail API + domain-wide delegation reusing the existing Sheets/Drive service account; a research pass (§3) found, sourced directly from Google's own docs, that domain-wide delegation **cannot** be restricted to one user — it lets a service account impersonate *any* Workspace user, including super-admins, for the granted scope. Both earlier options are rejected. §3 below is the actual locked decision: a dedicated per-mailbox OAuth refresh token, which Google's own documentation recommends as the alternative to domain-wide delegation for exactly this situation.

---

## 0. First, before any code

1. Read this file in full — it's the anchoring context.
2. Read the 9 files listed in §2 that currently call Resend directly, so the new shared helper's signature covers every real usage (`replyTo`, `bcc`, HTML vs. plain text — see §5).
3. **Do not build the domain-wide-delegation or app-password versions of this — both were explicitly rejected in §3.** If you find yourself reaching for `GCP_SA_JSON` to send email, stop; that credential's job is Sheets/Drive only, and mixing its blast radius with email-sending is exactly what this revision avoids.
4. §4 has one real prerequisite that only Jesse can complete (creating/promoting a real Workspace user, and running a one-time local script to mint a refresh token) — confirm that's done before wiring the server-side send path, not after.
5. `npm run check` must pass before committing.

---

## 1. What this is (context)

Every email-sending route on the site calls `fetch("https://api.resend.com/emails")` directly — 9 independent call sites, no shared helper, several of them (`notifyJourneyTakedown.ts`, `journeyNudgeEmail.ts`) near-identical copies of the same fetch block. `RESEND_API_KEY` / `CONTACT_FROM_EMAIL` were never set on Netlify, so **all 9 have been silently non-functional in production**: the contact form 500s, email-code sign-in returns "isn't available right now," and the volunteer/partner-proposal/mailing-list/apply/ambassador forms and the two Journey Card emails all no-op or fail.

Rather than standing up a new third-party account (Resend), this sends through Jesse's existing Google Workspace domain (`dramaticadventure.com`) — but scoped tightly enough that a leaked credential can only ever send email as one dedicated mailbox, never read anyone's inbox and never impersonate anyone else at DAT. This also consolidates the 9 duplicated call sites into one shared helper while doing it.

---

## 2. The 9 call sites (unchanged from the first draft)

- `app/api/contact/route.ts`
- `app/api/auth/email-code/request/route.ts`
- `app/api/volunteer/route.ts`
- `app/api/partner-proposal/route.ts`
- `app/api/mailing-list/route.ts`
- `app/api/apply/route.ts`
- `app/api/ambassador/route.ts`
- `lib/notifyJourneyTakedown.ts`
- `lib/journeyNudgeEmail.ts`

Each currently builds its own `to`/`subject`/`text` or `html`/`replyTo`/`bcc` and fires its own Resend fetch. None of that surrounding logic (validation, rate-limiting, honeypots, non-fatal-vs-fatal handling) changes — only the actual send call moves onto the new shared helper (§5).

---

## 3. Locked decisions (resolved with Jesse, 2026-07-04 — supersedes the first draft)

- **Rejected: SMTP app password on Jesse's personal account.** Not scopable to send-only; the same password authenticates IMAP, so a leak exposes inbox-read access to Jesse's real day-to-day mailbox. Jesse's words: *"I don't want anyone logging into my personal gmail account."*
- **Rejected: Gmail API + domain-wide delegation reusing the existing Sheets/Drive service account.** Jesse asked directly, *"will it be just for hello?"* — researched against Google's own IAM and Workspace Admin documentation, and the answer is no: domain-wide delegation authorizes a (client ID, scope) pair with no user/group/OU restriction possible at Google's side. A service account granted `gmail.send` via DWD can impersonate **any** user in the Workspace, including super-admins — scopes limit what data it can touch, not who it can pretend to be. Reusing the Sheets/Drive service account would also merge two unrelated blast radii onto one leakable key. Google's own "best practices for service accounts" doc lists *avoiding* domain-wide delegation as its first recommendation, in favor of the option below.
- **Locked: a dedicated Workspace mailbox + one-time OAuth 2.0 consent → long-lived refresh token, scoped to `gmail.send` only.** This is the option Google's own docs point to as the DWD alternative. The refresh token is cryptographically bound to one specific mailbox — if it leaks, the only thing it can ever do is send email as that one address. It's independently revocable (from that mailbox's own Google Account security settings, or by the Workspace admin) without touching anything else, including the unrelated Sheets/Drive service account.
- **`hello@dramaticadventure.com` must become a real (licensed) Workspace user, not remain an alias of Jesse's account.** The OAuth consent has to be completed while logged in as the mailbox that will do the sending — you can't consent "as an alias." Jesse should set up mail forwarding from the new `hello@` user to his personal inbox (a normal Workspace per-user setting) so he keeps seeing everything that arrives there, matching today's behavior. *(If Jesse would rather not spend a Workspace seat converting `hello@` into a real user, the fallback is a small dedicated mailbox, e.g. `mailer@dramaticadventure.com`, configured with `hello@` as its Gmail "Send mail as" identity, and `CONTACT_FROM_EMAIL` set to `hello@dramaticadventure.com` while the OAuth consent/refresh-token is bound to `mailer@`. Either way works with the code in §5 unchanged — this is Jesse's call on the day, not something to decide in code.)*
- **OAuth client registered as Internal.** The GCP project's OAuth consent screen should be set to "Internal" user type (Workspace-only) so this never goes through Google's public app-verification review — it's only ever used by DAT's own server, authenticated by DAT's own mailbox.

---

## 4. Prerequisite (Jesse does this once, outside of code, before §5 is wired)

1. In the Workspace Admin Console, either promote `hello@dramaticadventure.com` to a real user, or create a small dedicated user (e.g. `mailer@dramaticadventure.com`) — per §3's fallback note. Set up forwarding to Jesse's personal inbox if using a new dedicated address so nothing currently landing in his inbox stops arriving there.
2. In the Google Cloud project already used for `GCP_SA_JSON` (or a separate lightweight project if preferred — doesn't matter functionally, only the refresh token's scope matters for blast radius): enable the Gmail API, set the OAuth consent screen to Internal, and create an OAuth 2.0 Client ID of type **Desktop app** (needed for the loopback-redirect flow below; Google retired the old out-of-band/manual-code flow in 2022).
3. Run a small one-time local script (built in §5, run once from a laptop, never deployed) that: opens the Google consent URL scoped to `https://www.googleapis.com/auth/gmail.send`, signed in as the mailbox from step 1; spins up a temporary `http://localhost:PORT` listener to catch the redirect; exchanges the returned code for tokens; prints the refresh token once, to the terminal, for Jesse to copy — never written to a file, never logged anywhere persistent.
4. Add three vars to Netlify: `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET` (from step 2), `GMAIL_OAUTH_REFRESH_TOKEN` (from step 3). `CONTACT_FROM_EMAIL` stays as the visible from-address (`hello@dramaticadventure.com` either way, per §3).

---

## 5. Design

### 5a. One-time local script: `scripts/mint-gmail-refresh-token.ts` (run locally, never deployed, never committed with real values)

Uses `googleapis`'s `google.auth.OAuth2` with a loopback redirect (`http://localhost:53682/oauth2callback` or similar), requests `access_type: "offline"` + `prompt: "consent"` (forces a refresh token even on repeat runs), and prints the refresh token to stdout only. Delete or gitignore this script's output; it holds no secret itself (client ID/secret are passed as CLI args or env at run time, not hardcoded).

### 5b. `lib/sendEmail.ts` (new, server-side shared helper)

- Auth: `google.auth.OAuth2(clientId, clientSecret)` with `setCredentials({ refresh_token: GMAIL_OAUTH_REFRESH_TOKEN })`. The `googleapis` client library handles access-token refresh automatically from there — no manual token-refresh logic to write.
- Message construction: use `mailcomposer` (already part of the nodemailer ecosystem, or standalone) to build a proper RFC822 MIME message from `{ from, to, subject, text, html, replyTo, bcc }` — this preserves every field the 9 call sites currently use, same as the SMTP draft would have.
- Send: base64url-encode the composed MIME message and call `gmail.users.messages.send({ userId: "me", requestBody: { raw } })` via `googleapis`'s Gmail API client, authenticated with the OAuth2 client from above.
- Same public shape as the earlier SMTP draft (`sendEmail(opts)` returning `{ ok, error? }`, plus `emailConfigured()` checking all three new env vars are present) — so the per-route diffs in §5c are identical regardless of which transport draft this replaced.

```ts
import "server-only";
import { google } from "googleapis";
import MailComposer from "nodemailer/lib/mail-composer";

const CLIENT_ID = process.env.GMAIL_OAUTH_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GMAIL_OAUTH_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.GMAIL_OAUTH_REFRESH_TOKEN || "";
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "";

export function emailConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN && FROM_EMAIL);
}

function gmailClient() {
  const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: REFRESH_TOKEN });
  return google.gmail({ version: "v1", auth: oauth2 });
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  bcc?: string | string[];
}): Promise<{ ok: boolean; error?: string }> {
  if (!emailConfigured()) {
    return { ok: false, error: "Email not configured (GMAIL_OAUTH_* / CONTACT_FROM_EMAIL)" };
  }
  try {
    const mail = new MailComposer({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      replyTo: opts.replyTo,
      bcc: opts.bcc,
    });
    const message = await mail.compile().build();
    const raw = message.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    await gmailClient().users.messages.send({ userId: "me", requestBody: { raw } });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
```

### 5c. Per-route changes — unchanged from the first draft's plan

Each of the 9 files: delete its local Resend consts/fetch block; import `sendEmail`/`emailConfigured` from `@/lib/sendEmail`; call it with the same values it already builds. Where a route checks `if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL)`, swap for `if (!emailConfigured())` — same branch, new source of truth.

### 5d. Env vars

- **New:** `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, `GMAIL_OAUTH_REFRESH_TOKEN` (all secret; mark accordingly in Netlify).
- **Unchanged:** `CONTACT_FROM_EMAIL`, `CONTACT_INBOX_EMAIL`.
- **Retired:** `RESEND_API_KEY`.
- **Never introduced:** any Gmail app password, any domain-wide delegation grant on `GCP_SA_JSON`. If either shows up in a diff, that's a regression against this spec's locked decision (§3) — stop and re-read §3.

### 5e. Why this is safe on Netlify

Same as the first draft: all 9 routes already declare `export const runtime = "nodejs"`, so a real `googleapis`/HTTPS-based Gmail API call works exactly as it would on any Node server — nothing here depends on raw sockets (unlike the rejected SMTP draft), so this is if anything simpler to run on serverless than the app-password version would have been.

---

## 6. Build sequence

1. `npm install googleapis` (already likely present given `lib/googleClients.ts`'s existing Sheets/Drive usage — confirm, don't duplicate) `nodemailer` (for `mail-composer` only — confirm whether pulling in the whole package for one submodule is acceptable, or vendor a smaller MIME-builder if Jesse prefers a lighter dependency).
2. Build `scripts/mint-gmail-refresh-token.ts` (§5a) first — Jesse needs to run this before anything else can be tested end to end.
3. Confirm with Jesse that §4's prerequisites (real mailbox, OAuth client, minted refresh token, three new Netlify vars) are done before writing §5b — there's nothing to test against otherwise.
4. Build `lib/sendEmail.ts` (§5b).
5. Rewire the 9 call sites (§5c), one at a time, diffing each against its current Resend behavior before moving to the next.
6. Update `journey-card-AUDIT.md` and `field-kit-BUILD-SPEC-slice7.md` §4-R Q5's Resend mentions with a short pointer to this spec.
7. Verification (§7).

---

## 7. Verification (required final step)

- `npm run check` clean.
- Manual send test through at least two of the nine paths: the contact form (tests `replyTo` + optional `bcc`) and email-code sign-in (tests the "not configured" 500 branch still fires correctly if the env vars are temporarily unset, then succeeds once set).
- Confirm `notifyJourneyTakedown` / `journeyNudgeEmail` still return `false` (not throw) when `emailConfigured()` is false.
- Confirm the actual email arrives with `From: hello@dramaticadventure.com`, correct subject/body, and a working Reply-To.
- Grep the repo for `RESEND`, `api.resend.com`, and `domain-wide` / `DWD` — should return zero hits in code (doc mentions of the rejected approaches, kept for history, are fine).
- Confirm `GCP_SA_JSON` was not touched, and no new scope/delegation was added to it anywhere.

---

## 8. Guardrails

- CLAUDE.md: no changes until 95% confidence — §3 is fully resolved; the one remaining action item (§4) is Jesse's, not a code question.
- `npm run check` before committing.
- Don't change validation/rate-limiting/business logic in any of the 9 routes — only the send mechanism.
- Don't touch Journey Card / Field Kit logic beyond `notifyJourneyTakedown.ts` and `journeyNudgeEmail.ts`'s send call itself.
- **Do not implement domain-wide delegation or an app password anywhere in this work, even as a "temporary" or "simpler" fallback** — both were explicitly rejected in §3 after direct research, not just skipped for convenience.
- All three new OAuth secrets are real secrets — Netlify env vars marked secret, never in a committed file.
