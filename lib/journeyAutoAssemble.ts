// lib/journeyAutoAssemble.ts
//
// Slice 7 — the server-side runner behind /api/field-kit/journey/auto-assemble
// (CRON-triggered every 15 min via netlify/functions/journey-auto-composer.ts).
// Two jobs per run, both scoped to the live Field Kit program:
//
//   1. runAutoAssembly — build/update EVERY roster artist's JourneyDraft from
//      their own captures (lib/journeyAutoComposer, pure rules, no LLM), writing
//      straight into the private dat-journey-drafts Blobs store that Composer's
//      loadDraft() already reads. Runs while the program is live and for a grace
//      window past the end date, so the trip-end nudge always points at a real,
//      already-built card — even for an artist who never opens the app.
//
//   2. runTripEndNudge — once past the itinerary end date, push (+1 day) and
//      email (+3 days, covers the iOS-push gap) every roster artist EXCEPT those
//      whose draft has publishedCardId set (§3: the only skip condition — never
//      Composer-visit history). Each channel fires at most once per program,
//      claim-first (a dropped nudge beats duplicate spam), and the published
//      skip is re-checked at each channel's send time.

import "server-only";
import { getStore } from "@netlify/blobs";
import { clusterRoster } from "@/lib/fieldKitAccess";
import { loadProgramItinerary } from "@/lib/loadProgram";
import { allDays, resolveToday, type ProgramItinerary } from "@/lib/programItinerary";
import { spineFromItinerary } from "@/lib/composerSpine";
import { loadCapturesForProgram } from "@/lib/loadFieldKitCaptures";
import { assembleDraft } from "@/lib/journeyAutoComposer";
import { draftStorageKey, readStoredDraft, writeStoredDraft } from "@/lib/journeyDraftServer";
import { sendToSlugs, isPushConfigured } from "@/lib/webPush";
import { getOwnerEmailForAlumniId } from "@/lib/ownership";
import { sendJourneyNudgeEmail } from "@/lib/journeyNudgeEmail";
import { emailConfigured } from "@/lib/sendEmail";

// ── Timing (§4-R Q5) ──────────────────────────────────────────────────────────

/** Days past the itinerary end date the assembler keeps running (nudges land by +3). */
const ASSEMBLY_GRACE_DAYS = 7;
/** Push fires the day after the trip ends; email follows at +3 days. */
const NUDGE_PUSH_AFTER_DAYS = 1;
const NUDGE_EMAIL_AFTER_DAYS = 3;
/** Send hour: 15:00 UTC ≈ 17:00 in Slovakia / 11:00 ET — not midnight. */
const NUDGE_HOUR_UTC = 15;

const COMPOSER_PATH = "/field-kit/composer";

function endDateIso(it: ProgramItinerary): string {
  let end = "";
  for (const d of allDays(it)) if (d.fullDate && d.fullDate > end) end = d.fullDate;
  return end; // "" when no day carries a parseable date yet
}

function nudgeThreshold(endIso: string, afterDays: number): number {
  const base = Date.parse(`${endIso}T00:00:00Z`);
  return base + afterDays * 86_400_000 + NUDGE_HOUR_UTC * 3_600_000;
}

function daysPastEnd(endIso: string, now: Date): number {
  return (now.getTime() - Date.parse(`${endIso}T00:00:00Z`)) / 86_400_000;
}

// ── Nudge log (dat-journey-nudges: one small JSON per program) ────────────────

type NudgeLog = {
  pushSentAt?: string;
  pushResult?: string;
  emailSentAt?: string;
  emailResult?: string;
};

const NUDGE_STORE_NAME = "dat-journey-nudges";
const memNudgeLogs = new Map<string, NudgeLog>();

function blobsConfigured(): boolean {
  const isNetlifyRuntime = process.env.NETLIFY === "true" || !!process.env.NETLIFY_SITE_ID;
  const hasLocalCreds =
    !!process.env.NETLIFY_SITE_ID?.trim() && !!process.env.NETLIFY_AUTH_TOKEN?.trim();
  return isNetlifyRuntime || hasLocalCreds;
}

function nudgeStore() {
  const siteID = (process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "").trim();
  const token = (process.env.NETLIFY_AUTH_TOKEN || "").trim();
  if (siteID && token) return getStore({ name: NUDGE_STORE_NAME, siteID, token });
  return getStore(NUDGE_STORE_NAME);
}

async function readNudgeLog(programId: string): Promise<NudgeLog> {
  if (!blobsConfigured()) return memNudgeLogs.get(programId) ?? {};
  try {
    const v = await nudgeStore().get(programId, { type: "json" });
    return (v as NudgeLog | null) ?? {};
  } catch (err) {
    // Fail CLOSED on read errors: treat as already-sent so a flaky read can
    // never cause a duplicate blast; the claim-first write is the source of truth.
    console.error("[journey-nudge] log read failed — skipping this run:", err);
    return { pushSentAt: "read-error", emailSentAt: "read-error" };
  }
}

async function writeNudgeLog(programId: string, log: NudgeLog): Promise<void> {
  if (!blobsConfigured()) {
    memNudgeLogs.set(programId, log);
    return;
  }
  await nudgeStore().setJSON(programId, log);
}

// ── 1. Auto-assembly ─────────────────────────────────────────────────────────

export type AssemblyRunSummary = {
  ran: boolean;
  reason?: string;
  artists?: number;
  wrote?: number;
};

export async function runAutoAssembly(
  programId: string,
  now: Date = new Date()
): Promise<AssemblyRunSummary> {
  const itinerary = await loadProgramItinerary(programId);
  if (!itinerary) return { ran: false, reason: "no itinerary" };

  const today = resolveToday(itinerary, now);
  const end = endDateIso(itinerary);
  if (today.state === "before") return { ran: false, reason: "program not started" };
  if (today.state === "after" && end && daysPastEnd(end, now) > ASSEMBLY_GRACE_DAYS) {
    return { ran: false, reason: "past assembly grace window" };
  }

  const roster = clusterRoster(programId);
  if (!roster.size) return { ran: false, reason: "empty roster" };

  const spine = spineFromItinerary(itinerary);
  const capturesByAuthor = await loadCapturesForProgram(programId);
  const meta = {
    program: itinerary.program ?? "",
    location: itinerary.location ?? "",
    country: itinerary.country ?? "",
    year: itinerary.year ?? "",
    dates: itinerary.dates ?? "",
  };

  let wrote = 0;
  for (const slug of roster) {
    const key = draftStorageKey(slug, "live", programId);
    const stored = await readStoredDraft(key);
    const { draft, changed } = assembleDraft({
      programId,
      authorSlug: slug,
      program: meta,
      spine,
      captures: capturesByAuthor.get(slug) ?? [],
      existing: stored?.draft ?? null,
      now: now.toISOString(),
    });
    if (changed) {
      await writeStoredDraft(key, { draft, serverUpdatedAt: now.toISOString() });
      wrote += 1;
    }
  }
  return { ran: true, artists: roster.size, wrote };
}

// ── 2. End-of-trip nudge ─────────────────────────────────────────────────────

export type NudgeRunSummary = {
  push: string; // what happened to the push channel this run
  email: string; // what happened to the email channel this run
};

function appBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * Roster slugs still owed a nudge: everyone EXCEPT artists whose draft has
 * publishedCardId set (§3 — the one and only skip; visit history never counts).
 */
async function unpublishedRoster(programId: string): Promise<string[]> {
  const out: string[] = [];
  for (const slug of clusterRoster(programId)) {
    const stored = await readStoredDraft(draftStorageKey(slug, "live", programId));
    if (stored?.draft?.publishedCardId) continue; // already stamped — nothing to invite
    out.push(slug);
  }
  return out;
}

export async function runTripEndNudge(
  programId: string,
  now: Date = new Date()
): Promise<NudgeRunSummary> {
  const summary: NudgeRunSummary = { push: "not due", email: "not due" };

  const itinerary = await loadProgramItinerary(programId);
  if (!itinerary) return { push: "no itinerary", email: "no itinerary" };
  const end = endDateIso(itinerary);
  if (!end) return { push: "no end date", email: "no end date" };

  const log = await readNudgeLog(programId);
  const location = itinerary.location || itinerary.country || "the field";

  // ── Push (+1 day) ──
  if (log.pushSentAt) {
    summary.push = "already sent";
  } else if (now.getTime() >= nudgeThreshold(end, NUDGE_PUSH_AFTER_DAYS)) {
    if (!(await isPushConfigured())) {
      summary.push = "push not configured — left unclaimed"; // retried next run
    } else {
      // Claim BEFORE sending so an overlapping run can't double-send.
      log.pushSentAt = now.toISOString();
      await writeNudgeLog(programId, log);
      try {
        const slugs = await unpublishedRoster(programId);
        const r = await sendToSlugs(programId, slugs, {
          title: "Your Journey Card is waiting",
          body: `We put together a Journey Card from what you captured in ${location}. Take a look — it's yours to edit or publish whenever you're ready.`,
          link: COMPOSER_PATH,
        });
        log.pushResult = `eligible=${slugs.length} sent=${r.sent} pruned=${r.pruned} failed=${r.failed}`;
      } catch (e) {
        log.pushResult = `error: ${String(e)}`;
      }
      await writeNudgeLog(programId, log);
      summary.push = log.pushResult ?? "sent";
    }
  }

  // ── Email (+3 days) ──
  if (log.emailSentAt) {
    summary.email = "already sent";
  } else if (now.getTime() >= nudgeThreshold(end, NUDGE_EMAIL_AFTER_DAYS)) {
    if (!(await emailConfigured())) {
      summary.email = "email not configured — left unclaimed";
    } else {
      log.emailSentAt = now.toISOString();
      await writeNudgeLog(programId, log);
      const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
      const composerUrl = `${appBaseUrl()}${COMPOSER_PATH}`;
      let sent = 0;
      let noAddress = 0;
      let failed = 0;
      try {
        // Skip re-checked here, independently of the push (§5c): publishing
        // between the two sends suppresses the email.
        const slugs = await unpublishedRoster(programId);
        for (const slug of slugs) {
          const email = await getOwnerEmailForAlumniId(spreadsheetId, slug).catch(() => "");
          if (!email) {
            noAddress += 1;
            continue;
          }
          const ok = await sendJourneyNudgeEmail({ toEmail: email, location, composerUrl });
          if (ok) sent += 1;
          else failed += 1;
        }
        log.emailResult = `eligible=${slugs.length} sent=${sent} noAddress=${noAddress} failed=${failed}`;
      } catch (e) {
        log.emailResult = `error: ${String(e)}`;
      }
      await writeNudgeLog(programId, log);
      summary.email = log.emailResult ?? "sent";
    }
  }

  return summary;
}
