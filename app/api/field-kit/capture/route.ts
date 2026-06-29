// app/api/field-kit/capture/route.ts
//
// Field Kit "Capture" — Slice A (text-only note/quote, online). Appends one row
// to the Field-Captures tab in the ALUMNI_SHEET_ID workbook.
//
// Trust model (defense in depth — never trust the layout/middleware for a direct
// API hit): this route re-runs the SAME access resolver the pages use, derives
// BOTH programId and authorSlug server-side, and ignores any programId/authorSlug
// sent in the body. The kit is multi-program, so programId comes from the
// verified access record — never a constant.
//
// Idempotency: the client mints a ULID captureId; we scan column A for it and
// no-op if it already landed, so a retried POST never double-writes.
//
// Slice B (deferred): media (photo/voice) → driveFileId + mimeType; voice cap
// 5 min / 25 MB enforced client + server. Those columns stay empty here.

import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getFieldKitAccess } from "@/lib/fieldKitAccess";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";

export const runtime = "nodejs";

const FIELD_CAPTURES_RANGE = "Field-Captures!A:L";
const VALID_KINDS = new Set(["note", "quote"]);

export async function POST(req: Request) {
  try {
    if (!rateLimit(rateKey(req), 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Same gate the pages use. Signed-out → 401, not on this roster → 403.
    const access = await getFieldKitAccess();
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }

    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    // Author + program are ALWAYS server-derived. Author is the owned slug the
    // access record already resolved; program from the verified access record
    // (multi-program).
    const authorSlug = normId(access.slug);
    if (!authorSlug) {
      return NextResponse.json({ error: "No profile linked to this account" }, { status: 403 });
    }
    const programId = access.programId;

    const body = (await req.json().catch(() => null)) as {
      captureId?: unknown;
      kind?: unknown;
      bodyText?: unknown;
      createdAt?: unknown;
      dayIndex?: unknown;
      quoteSpeaker?: unknown;
    } | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const captureId = String(body.captureId ?? "").trim();
    const kind = String(body.kind ?? "").trim().toLowerCase();
    const bodyText = String(body.bodyText ?? "").trim();
    const createdAt = String(body.createdAt ?? "").trim() || new Date().toISOString();
    const dayIndex = String(body.dayIndex ?? "").trim();
    const quoteSpeaker = String(body.quoteSpeaker ?? "").trim();

    if (!captureId) return NextResponse.json({ error: "captureId is required" }, { status: 400 });
    if (!VALID_KINDS.has(kind)) {
      return NextResponse.json({ error: "kind must be note or quote" }, { status: 400 });
    }
    if (!bodyText) return NextResponse.json({ error: "bodyText is required" }, { status: 400 });

    const sheets = sheetsClient();

    // Read header + existing rows once: resolve columns by NAME and scan column A
    // for the captureId so a retry is idempotent.
    const existing = await withRetry(
      () => sheets.spreadsheets.values.get({ spreadsheetId, range: FIELD_CAPTURES_RANGE }),
      "Sheets get Field-Captures"
    );
    const rows = (existing.data.values ?? []) as string[][];
    const header = rows[0] ?? [];
    if (!header.length) throw new Error("Field-Captures has no header row");

    const col = {
      captureId: idxOf(header, ["captureid"]),
      programId: idxOf(header, ["programid"]),
      authorSlug: idxOf(header, ["authorslug"]),
      kind: idxOf(header, ["kind"]),
      bodyText: idxOf(header, ["bodytext"]),
      createdAt: idxOf(header, ["createdat"]),
      syncState: idxOf(header, ["syncstate"]),
      serverReceivedAt: idxOf(header, ["serverreceivedat"]),
      dayIndex: idxOf(header, ["dayindex"]),
      quoteSpeaker: idxOf(header, ["quotespeaker"]),
    };
    if (col.captureId === -1) throw new Error('Field-Captures missing "captureId" header');

    const want = normId(captureId);
    const deduped = rows.slice(1).some((r) => normId(r[col.captureId]) === want);
    if (deduped) return NextResponse.json({ ok: true, captureId, deduped: true });

    const nowIso = new Date().toISOString();
    const newRow: string[] = Array(header.length).fill("");
    const put = (i: number, v: string) => {
      if (i !== -1) newRow[i] = v;
    };
    put(col.captureId, captureId);
    put(col.programId, programId);
    put(col.authorSlug, authorSlug);
    put(col.kind, kind);
    put(col.bodyText, bodyText);
    put(col.createdAt, createdAt);
    put(col.serverReceivedAt, nowIso); // server-stamped
    put(col.syncState, "synced"); // server-only field
    put(col.dayIndex, dayIndex);
    put(col.quoteSpeaker, quoteSpeaker); // only sent for quotes; empty for notes
    // driveFileId + mimeType intentionally left empty for Slice A (text-only).

    await withRetry(
      () =>
        sheets.spreadsheets.values.append({
          spreadsheetId,
          range: FIELD_CAPTURES_RANGE,
          valueInputOption: "RAW",
          requestBody: { values: [newRow] },
        }),
      "Sheets append Field-Captures"
    );

    return NextResponse.json({ ok: true, captureId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT CAPTURE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
