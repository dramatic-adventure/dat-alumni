// app/api/field-kit/admin/company-choice/route.ts
//
// POST — admin-only Company Choice controls, gated exactly like admin/rally.
// action "post" appends a new question (one active at a time — latest wins on
// artists' Today), records a Notifications row (sentAt SET), and pushes the
// roster a "vote" nudge. action "close" stamps closedAt (+ optional announced
// outcome override); results then surface to artists per the question's
// resultsVisibility on the next LiveRefresh tick — no push on close.

import { NextResponse } from "next/server";
import { guardFieldKitAdminApi, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { postCompanyChoice, closeCompanyChoice, coerceVisibility } from "@/lib/companyChoice";
import { appendNotification, newNotificationId } from "@/lib/notifications";
import { sendToProgram } from "@/lib/webPush";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LINK = "/field-kit"; // Today home, where the Company Choice card renders

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const asId = typeof body?.asId === "string" && body.asId.trim() ? body.asId.trim() : undefined;
    const program =
      typeof body?.program === "string" && body.program.trim()
        ? body.program.trim()
        : FIELD_KIT_PROGRAM_ID;

    const access = await guardFieldKitAdminApi(program, asId);
    if (access instanceof NextResponse) return access;

    const action = String(body?.action ?? "").trim().toLowerCase();

    if (action === "post") {
      const question = String(body?.question ?? "").trim();
      const deadline = String(body?.deadline ?? "").trim();
      const resultsVisibility = coerceVisibility(body?.resultsVisibility);
      const choices = Array.isArray(body?.choices)
        ? (body!.choices as unknown[]).map((c) => String(c ?? "").trim()).filter(Boolean)
        : [];
      if (!question) return NextResponse.json({ error: "question is required" }, { status: 400 });
      if (choices.length < 2) {
        return NextResponse.json({ error: "at least two choices are required" }, { status: 400 });
      }

      const choice = await postCompanyChoice(access.programId, {
        question,
        choices,
        deadline,
        resultsVisibility,
      });

      const message = {
        title: "Company Choice — cast your vote",
        body: deadline ? `${question} Vote by ${deadline}.` : question,
        link: LINK,
      };

      await appendNotification({
        id: newNotificationId(),
        programId: access.programId,
        type: "choice",
        title: message.title,
        body: message.body,
        link: message.link,
        notify: true,
        sentAt: new Date().toISOString(),
      });

      let sent = 0;
      let total = 0;
      let sendError: string | undefined;
      try {
        const r = await sendToProgram(access.programId, message);
        sent = r.sent;
        total = r.total;
      } catch (e) {
        sendError = e instanceof Error ? e.message : String(e);
      }

      return NextResponse.json({ ok: true, choice, sent, total, ...(sendError ? { sendError } : {}) });
    }

    if (action === "close") {
      const id = String(body?.id ?? "").trim();
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      const outcome = typeof body?.outcome === "string" ? body.outcome : undefined;
      const choice = await closeCompanyChoice(access.programId, id, outcome);
      if (!choice) return NextResponse.json({ error: "Unknown question" }, { status: 404 });
      return NextResponse.json({ ok: true, choice });
    }

    return NextResponse.json({ error: "action must be post or close" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT ADMIN COMPANY CHOICE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
