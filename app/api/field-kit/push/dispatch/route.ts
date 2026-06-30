// app/api/field-kit/push/dispatch/route.ts
//
// POST /api/field-kit/push/dispatch — the Sheet-toggle send path. Scans the
// "Field Kit Notifications" tab for rows with notify=TRUE && sentAt empty,
// CLAIMS each by stamping sentAt first, then fans out via lib/webPush#sendToProgram.
//
// Why a route (not the work inside the Netlify function): the send path needs the
// authenticated Sheets client + web-push, which live in "server-only" modules that
// only load cleanly inside the Next runtime — not the esbuild-bundled scheduled
// function. So netlify/functions/send-notifications.ts stays a thin trigger that
// POSTs here every ~1 min. This is NOT the user gate (no session): it is authorized
// by a shared CRON_SECRET header.
//
// Idempotency / overlap safety: stamping sentAt BEFORE sending claims the row, so a
// retried or overlapping run won't re-send it. A send failure after the stamp is
// logged and not retried (a dropped push beats a duplicate spam of the roster).

import { NextResponse } from "next/server";
import { findUnsent, stampSentAt } from "@/lib/notifications";
import { sendToProgram, isPushConfigured } from "@/lib/webPush";
import { getCronSecret } from "@/lib/notificationSecrets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request, secret: string): boolean {
  const header = (req.headers.get("x-cron-secret") || "").trim();
  return header === secret;
}

export async function POST(req: Request) {
  const secret = await getCronSecret();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (!authorized(req, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isPushConfigured())) {
    return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  }

  try {
    const unsent = await findUnsent();
    const results: Array<{ id: string; programId: string; sent?: number; error?: string }> = [];

    for (const n of unsent) {
      // Claim first so an overlapping run can't double-send this row.
      const nowIso = new Date().toISOString();
      try {
        await stampSentAt(n.rowNumber, nowIso);
      } catch (e) {
        results.push({ id: n.id, programId: n.programId, error: `claim failed: ${String(e)}` });
        continue;
      }
      try {
        const r = await sendToProgram(n.programId, {
          title: n.title || "DAT Field Kit",
          body: n.body,
          link: n.link,
        });
        results.push({ id: n.id, programId: n.programId, sent: r.sent });
      } catch (e) {
        results.push({ id: n.id, programId: n.programId, error: String(e) });
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT DISPATCH ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
