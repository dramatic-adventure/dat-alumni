// app/api/mailing-list/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Mailing list signup endpoint.
//
// ON A CLEAN SUBMIT:
//   1. Appends a row to the "Mailing List" sheet
//   2. Sends a welcome confirmation email to the subscriber (via lib/sendEmail)
//   3. Sends a notification email to the DAT inbox (via lib/sendEmail)
//
// SPAM DEFENSES (added 2026-08 after a subscription-bombing campaign — an
// attacker submitting REAL third-party addresses so our welcome email floods
// the victims' inboxes; see the git history of MAILING-LIST-ANTISPAM-PROMPT.md)
//
//     1. Cloudflare Turnstile — THE primary control. Verified server-side via
//        lib/turnstile.ts; stops the automated submission before any email
//        exists. Skipped entirely until the keys are configured, so this
//        deploys safely first.
//     2. Origin classification — same-site browsers pass; foreign origins are
//        quarantined; MISSING origins are recorded as "no-origin", never
//        silently dropped (privacy extensions and some webviews strip Origin).
//     3. Honeypot + dwell time — cheap bot tells from the form itself.
//     4. Rate limits — per-IP and site-wide caps (in-memory, per warm
//        instance; a backstop, not the wall).
//     5. Structural checks — length, CRLF injection.
//     6. Precision scoring — dot-obfuscated Gmail addresses, disposable
//        domains, links in the name field. See lib/mailingListGuard.ts for why
//        the old "gibberish" heuristics were removed (0% catch rate on real
//        data, false positives on real international names).
//     7. Duplicate suppression — keyed on normalizeGmail so dot/plus variants
//        of one Gmail inbox can never subscribe twice. Only rows that actually
//        SUBSCRIBED count: a quarantined or rate-limited attempt never locks
//        an address out.
//
//   QUARANTINE, NOT DELETION: rejected submissions are still written to the
//   sheet with a Status and the reasons in Notes — but NO email is sent to
//   anyone. The ONE deliberate exception: rejection rows are capped per IP and
//   site-wide (REJECTION_ROWS_*), because unbounded recording would let a bot
//   flood the sheet and exhaust the service account's ~60 writes/min quota,
//   starving real signups. Beyond the cap, rejections are console.warn-only.
//
// GOOGLE SHEET SETUP:
//   Tab named exactly: "Mailing List"
//   Row 1 headers:  Timestamp | Name | Email | Source | Status | Notes
//   The tab must be ≥6 columns wide (Sheets rejects writes past the grid
//   edge). `npm run flag:mailing-list -- --write` widens it and adds headers.
// ─────────────────────────────────────────────────────────────────────────────
import "server-only";
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { sendEmail, emailConfigured } from "@/lib/sendEmail";
import { rateLimit } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  classifyOrigin,
  getClientIp,
  normalizeEmail,
  normalizeGmail,
  isStructurallyValidEmail,
  scoreSignup,
  escapeHtml,
  QUARANTINE_SCORE,
} from "@/lib/mailingListGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  email: string;
  name?: string;
  source?: string;
  /** Honeypot — bots fill this, humans leave it blank */
  website?: string;
  /** Milliseconds between form render and submit, sent by the client forms */
  dwellMs?: number;
  /** Cloudflare Turnstile response token (absent until keys are configured) */
  turnstileToken?: string | null;
};

const INBOX_EMAIL = process.env.CONTACT_INBOX_EMAIL || "hello@dramaticadventure.com";

/**
 * The sheet ID.
 *
 * The "Mailing List" tab lives on the ALUMNI sheet (ALUMNI_SHEET_ID) — that is
 * the canonical destination. GOOGLE_SHEET_ID is the original, separately-named
 * var this route was written against; it is NOT set in .env.local (and the tab
 * having stayed empty for years says production never had a working value
 * either). It is kept first as an explicit override so that if production DOES
 * set it, that keeps working unchanged.
 *
 * If both are set and they DISAGREE, the list would silently split across two
 * spreadsheets — so that case is logged loudly rather than guessed at.
 */
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const ALUMNI_SHEET_ID = process.env.ALUMNI_SHEET_ID || "";
const SHEET_ID = GOOGLE_SHEET_ID || ALUMNI_SHEET_ID;
const SHEET_TAB = "Mailing List";

if (GOOGLE_SHEET_ID && ALUMNI_SHEET_ID && GOOGLE_SHEET_ID !== ALUMNI_SHEET_ID) {
  console.warn(
    `[mailing-list] GOOGLE_SHEET_ID (${GOOGLE_SHEET_ID}) differs from ALUMNI_SHEET_ID ` +
      `(${ALUMNI_SHEET_ID}). Writing to GOOGLE_SHEET_ID. If the "Mailing List" tab ` +
      `lives on the alumni sheet, unset GOOGLE_SHEET_ID so both agree.`
  );
}

/** A form filled faster than this was not filled by a person. */
const MIN_DWELL_MS = 1500;

/* ── Rate limits ────────────────────────────────────────────────────────────
 * In-memory fixed windows, per warm Lambda instance — a bot hammering the
 * endpoint hits a warm instance and gets stopped; Turnstile is the real wall.
 * (A fixed window allows a ~2× burst across the boundary; acceptable for a
 * backstop and much simpler than a sliding window.)
 *
 * Tuned for a real-world edge case: at a live event, an entire audience shares
 * one venue-wifi IP. Over-limit requests are RECORDED (capped) rather than
 * dropped, so a genuine post-show rush is reviewable, never lost.
 */
const PER_IP_HOURLY = 8;
const PER_IP_DAILY = 20;
// Per warm instance, so this is approximate. Generous on purpose: beyond it,
// signups land as reviewable "rate-limited" rows instead of subscribing.
const SITE_WIDE_DAILY = 200;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/* Caps on REJECTION rows (quarantined / rate-limited / no-origin). This is the
 * §4.3 fix: without a cap, every over-limit request costs a Sheets append —
 * junk fills the sheet and the service account's ~60 writes/min quota starves
 * genuine signups. Beyond these, rejections are logged, not recorded. */
const REJECTION_ROWS_PER_IP_DAILY = 5;
const REJECTION_ROWS_SITE_DAILY = 150;

/* ── Duplicate suppression ──────────────────────────────────────────────────
 * Cache the existing address list briefly so we don't read the whole sheet on
 * every request. 5 minutes is plenty at signup volumes.
 *
 * Only rows whose Status is empty (legacy) or "subscribed" count as existing:
 * a quarantined or rate-limited row must never permanently lock its address
 * out of subscribing (§4.6).
 */
const DUP_CACHE_MS = 5 * 60 * 1000;
const SUBSCRIBED_STATUSES = new Set(["", "subscribed"]);
const g = globalThis as unknown as {
  __datMailingListEmails?: { at: number; set: Set<string> };
};

async function existingEmails(): Promise<Set<string>> {
  const cached = g.__datMailingListEmails;
  if (cached && Date.now() - cached.at < DUP_CACHE_MS) return cached.set;

  const set = new Set<string>();
  if (!SHEET_ID) return set;

  try {
    const sheets = sheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!C:E`, // C = Email, E = Status
    });
    for (const row of res.data.values ?? []) {
      const email = normalizeEmail(row?.[0]);
      const status = normalizeEmail(row?.[2]);
      if (!email || !SUBSCRIBED_STATUSES.has(status)) continue;
      // Store the CANONICAL form: Gmail ignores dots and +tags, and the
      // bombing campaign cycles dot patterns specifically to defeat dedupe.
      set.add(normalizeGmail(email));
    }
  } catch (err) {
    // A failed read must never block a signup — fall through with an empty set.
    console.error("[mailing-list] duplicate-check read failed:", err);
    return set;
  }

  g.__datMailingListEmails = { at: Date.now(), set };
  return set;
}

/**
 * Append one row. `countsAsSubscribed` controls whether the address joins the
 * in-memory dedupe cache — rejection rows must NOT (§4.6).
 */
async function appendRow(values: string[], countsAsSubscribed: boolean): Promise<void> {
  if (!SHEET_ID) {
    console.error(
      "[mailing-list] No sheet ID configured (GOOGLE_SHEET_ID / ALUMNI_SHEET_ID) — signup NOT recorded"
    );
    return;
  }
  const addToCache = () => {
    if (!countsAsSubscribed) return;
    const cached = g.__datMailingListEmails;
    const email = normalizeEmail(values[2]);
    if (cached && email) cached.set.add(normalizeGmail(email));
  };
  try {
    const sheets = sheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A:F`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });
    addToCache();
  } catch (err) {
    // The 4-column fallback exists for ONE failure mode: a tab that predates
    // the Status/Notes columns, where Sheets rejects a 6-column write with
    // "exceeds grid limits". Any other error (quota, timeout) must NOT retry —
    // a timed-out append may already have committed, and a blind retry writes
    // a duplicate row or silently strips the quarantine status (§4.5).
    const msg = err instanceof Error ? err.message : String(err);
    if (!/exceeds grid limits/i.test(msg)) {
      console.error("[mailing-list] Google Sheets write error — row lost:", err);
      return;
    }
    console.warn(
      "[mailing-list] tab is still 4 columns wide — falling back to A:D. " +
        "Run: npm run flag:mailing-list -- --write to widen it."
    );
    try {
      const sheets = sheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_TAB}!A:D`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [values.slice(0, 4)] },
      });
      addToCache();
    } catch (err2) {
      console.error("[mailing-list] fallback write ALSO failed — row lost:", err2);
    }
  }
}

/** Bots get a 200 with no hint about which check caught them. */
function silentOk() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, name, source, website, dwellMs, turnstileToken } = body;

  const emailTrim = normalizeEmail(email);
  const nameTrim = String(name ?? "").trim().slice(0, 100);
  const sourceTrim = String(source ?? "events-page").trim().slice(0, 60);
  const ip = getClientIp(req);
  const timestamp = new Date().toISOString();

  /**
   * Record a rejected submission for review — capped so a bot can't turn the
   * rejection path into unbounded Sheets writes. Past the cap it's log-only:
   * that is the one deliberate, visible exception to "every rejection records
   * a row".
   */
  const recordRejection = async (status: string, note: string) => {
    const withinCaps =
      rateLimit(`ml:rec:ip:${ip}`, REJECTION_ROWS_PER_IP_DAILY, DAY_MS) &&
      rateLimit("ml:rec:site:d", REJECTION_ROWS_SITE_DAILY, DAY_MS);
    if (!withinCaps) {
      console.warn(
        `[mailing-list] rejection NOT recorded (cap reached) ip=${ip} status=${status} note=${note} email=${emailTrim}`
      );
      return;
    }
    await appendRow([timestamp, nameTrim, emailTrim, sourceTrim, status, note], false);
  };

  // ── 1. Origin ──────────────────────────────────────────────────────────────
  // Foreign origin: not one of our forms — quarantine. MISSING origin is NOT
  // proof of a bot (privacy extensions, sandboxed webviews, proxy browsers
  // strip it), so those are recorded under their own status for review.
  const originInfo = classifyOrigin(req);
  if (originInfo.verdict === "foreign") {
    console.warn(`[mailing-list] blocked: foreign origin "${originInfo.origin}"`);
    await recordRejection("quarantined", `origin: foreign (${originInfo.origin})`);
    return silentOk();
  }
  if (originInfo.verdict === "missing") {
    console.warn("[mailing-list] no browser origin — recording for review");
    await recordRejection("no-origin", "no browser Origin header — review before mailing");
    return silentOk();
  }

  // ── 2. Honeypot ────────────────────────────────────────────────────────────
  if (website) {
    console.warn("[mailing-list] blocked: honeypot filled");
    await recordRejection("quarantined", "honeypot filled");
    return silentOk();
  }

  // ── 3. Dwell time ──────────────────────────────────────────────────────────
  // Only enforced when the client actually sent it, so an older cached bundle
  // without the field keeps working.
  if (typeof dwellMs === "number" && dwellMs >= 0 && dwellMs < MIN_DWELL_MS) {
    console.warn(`[mailing-list] blocked: submitted in ${dwellMs}ms`);
    await recordRejection("quarantined", `form submitted in ${dwellMs}ms`);
    return silentOk();
  }

  // ── 4. Structural validation ───────────────────────────────────────────────
  // This one returns a real error and records nothing: a human with a typo is
  // TOLD, which is better than a review row.
  if (!isStructurallyValidEmail(emailTrim)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 422 }
    );
  }

  // ── 5. Rate limits ─────────────────────────────────────────────────────────
  const overLimit =
    !rateLimit(`ml:ip:h:${ip}`, PER_IP_HOURLY, HOUR_MS) ||
    !rateLimit(`ml:ip:d:${ip}`, PER_IP_DAILY, DAY_MS) ||
    !rateLimit("ml:site:d", SITE_WIDE_DAILY, DAY_MS);

  // Over the limit? Record it (capped), send nothing. A burst is *usually* a
  // bot, but it can also be a genuine crowd on shared wifi — the row keeps it
  // reviewable, and the address is NOT locked out of subscribing later.
  if (overLimit) {
    console.warn(`[mailing-list] rate limited (ip=${ip})`);
    await recordRejection("rate-limited", "burst from one IP — review before mailing");
    return silentOk();
  }

  // ── 6. Turnstile ───────────────────────────────────────────────────────────
  // Skipped until the secret is configured (lib/turnstile.ts). Once it is:
  // no token or a rejected token = automation, quarantined. If Cloudflare
  // itself is unreachable we fail OPEN with a note — an outage must not
  // swallow real signups; the remaining checks still apply.
  const softNotes: string[] = [];
  const turnstile = await verifyTurnstileToken(turnstileToken ?? undefined, ip);
  if (turnstile.outcome === "fail") {
    console.warn(`[mailing-list] turnstile rejected (${turnstile.reason}) ip=${ip}`);
    await recordRejection("quarantined", `turnstile: ${turnstile.reason}`);
    return silentOk();
  }
  if (turnstile.outcome === "unavailable") {
    softNotes.push("turnstile verify unavailable");
  }

  // ── 7. Duplicate suppression ───────────────────────────────────────────────
  // Already subscribed? Show them the success state, but don't write a second
  // row and don't send a second welcome. Compared canonically (dot/plus
  // variants collapse); we STORE what they typed — never rewrite someone's
  // own address in the record.
  const known = await existingEmails();
  if (known.has(normalizeGmail(emailTrim))) {
    return NextResponse.json({ ok: true });
  }

  // ── 8. Precision scoring ───────────────────────────────────────────────────
  const { score, reasons } = scoreSignup({ email: emailTrim, name: nameTrim });
  if (score >= QUARANTINE_SCORE) {
    console.warn(
      `[mailing-list] quarantined ${emailTrim} (score ${score}): ${reasons.join("; ")}`
    );
    await recordRejection("quarantined", reasons.join("; "));
    return silentOk();
  }

  // ── Clean signup ───────────────────────────────────────────────────────────
  await appendRow(
    [timestamp, nameTrim, emailTrim, sourceTrim, "subscribed", softNotes.join("; ")],
    true
  );

  if (!(await emailConfigured())) {
    console.warn("[mailing-list] email not configured — skipping emails");
    return NextResponse.json({ ok: true });
  }

  // Everything interpolated below is escaped: these strings came from a
  // stranger on the internet and end up rendered in your inbox.
  const safeName = escapeHtml(nameTrim);
  const safeEmail = escapeHtml(emailTrim);
  const safeSource = escapeHtml(sourceTrim);
  const greeting = nameTrim ? `Hi ${escapeHtml(nameTrim.split(" ")[0])},` : "Hello,";

  // Welcome email → subscriber
  const welcomeHtml = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #fdf9f1; border: 1px solid #e5d8c0; border-radius: 14px; overflow: hidden;">
      <div style="background: #241123; padding: 2rem 2.5rem;">
        <p style="margin: 0 0 0.4rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.28em; color: rgba(255,204,0,0.7);">Dramatic Adventure Theatre</p>
        <h1 style="margin: 0; font-size: 1.6rem; color: #FFCC00; line-height: 1.2;">You're on the list.</h1>
      </div>
      <div style="padding: 2rem 2.5rem;">
        <p style="margin: 0 0 1rem; font-size: 1rem; color: #241123; line-height: 1.65;">${greeting}</p>
        <p style="margin: 0 0 1rem; font-size: 1rem; color: #241123; line-height: 1.65;">
          Thanks for signing up. You'll hear from us first when we announce new events, productions, and ways to get involved — from Edinburgh to Ecuador and beyond.
        </p>
        <p style="margin: 0 0 1.75rem; font-size: 1rem; color: #241123; line-height: 1.65;">
          In the meantime, explore what's coming up:
        </p>
        <a href="https://stories.dramaticadventure.com/events"
           style="display: inline-block; padding: 0.85rem 1.75rem; background: #F23359; color: #fff; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.12em; text-transform: uppercase;">
          See Upcoming Events →
        </a>
        <p style="margin: 2rem 0 0; font-size: 0.82rem; color: rgba(36,17,35,0.5); line-height: 1.6;">
          You're receiving this because you signed up at dramaticadventure.com.
          To unsubscribe, reply with "unsubscribe" and we'll take care of it immediately.
        </p>
      </div>
    </div>
  `;

  // Notification email → DAT inbox
  const notifyHtml = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #F23359; color: #fff; padding: 1.5rem 2rem; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.3rem; letter-spacing: 0.04em;">New Mailing List Signup</h1>
        <p style="margin: 0.3rem 0 0; opacity: 0.85; font-size: 0.85rem;">via ${safeSource}</p>
      </div>
      <div style="background: #fdf9f1; border: 1px solid #e5d8c0; border-top: 0; border-radius: 0 0 12px 12px; padding: 1.75rem 2rem;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          ${nameTrim ? `<tr>
            <td style="padding: 0.5rem 0; color: #F23359; font-weight: 700; width: 36%;">Name</td>
            <td style="padding: 0.5rem 0; color: #241123;">${safeName}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 0.5rem 0; color: #F23359; font-weight: 700; width: 36%;">Email</td>
            <td style="padding: 0.5rem 0; color: #241123;"><a href="mailto:${safeEmail}" style="color: #2493A9;">${safeEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #F23359; font-weight: 700;">Source</td>
            <td style="padding: 0.5rem 0; color: #241123;">${safeSource}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #F23359; font-weight: 700;">Time</td>
            <td style="padding: 0.5rem 0; color: #241123;">${escapeHtml(timestamp)}</td>
          </tr>
        </table>
        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #e5d8c0;">
          <a href="mailto:${safeEmail}" style="display: inline-block; padding: 0.65rem 1.25rem; background: #F23359; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase;">
            Reply to ${safeName || safeEmail} →
          </a>
        </div>
      </div>
    </div>
  `;

  // Fire both emails in parallel — a failed send never fails the request
  const results = await Promise.all([
    sendEmail({
      to: emailTrim,
      subject: "You're on the DAT list. 🎭",
      html: welcomeHtml,
    }),
    sendEmail({
      to: INBOX_EMAIL,
      replyTo: emailTrim,
      subject: `📬 New mailing list signup: ${nameTrim || emailTrim}`,
      html: notifyHtml,
    }),
  ]);
  for (const r of results) {
    if (!r.ok) {
      console.error("[mailing-list] send error:", r.error);
    }
  }

  return NextResponse.json({ ok: true });
}
