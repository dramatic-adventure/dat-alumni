// app/api/field-kit/capture/[captureId]/route.ts
//
// Edit + delete for Field Kit captures (online-only; the Traces UI disables
// these actions offline).
//
//   PATCH  { bodyText?, quoteSpeaker?, visibility? }  → edit text fields
//   DELETE                                            → SOFT delete
//
// Soft delete: rows are never removed from the Field-Captures tab (row deletion
// is unsafe against concurrent appends, and keeping the row preserves the
// captureId dedup guarantee for the offline queue — a queued POST retried after
// a delete still no-ops instead of resurrecting the capture). Instead a
// `deletedAt` timestamp is stamped and every read path skips stamped rows
// (lib/loadFieldKitCaptures). Drive media is deliberately left in place —
// recoverable, and the media route still requires ownership.
//
// Trust model (same as the POST route): re-run getFieldKitAccess, derive the
// author server-side, and require the target row's authorSlug === access.slug.
// Admins may act on an impersonated member's capture via ?asId=… (the same gate
// the rest of the kit uses); acting as THEMSELVES an admin still only touches
// their own rows.
//
// Delete cascades into the author's LIVE JourneyDraft (drafts reference
// captureIds): the capture is stripped from photoCaptureIds / audioCaptureId /
// heroCaptureId, and the draft's updatedAt is bumped so a stale device copy that
// still references the deleted capture loses last-write-wins instead of
// resurrecting the reference. Cascade failure never fails the delete — the
// publish/composer read paths already tolerate dangling refs (they resolve ids
// against the loader, which no longer returns the deleted capture).
//
// Columns: `deletedAt` + `editedAt` are auto-added to the sheet header on first
// use (same resolve-by-name philosophy as the POST route).

import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { rateLimit, rateKey } from "@/lib/rateLimit";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";
import {
  draftStorageKey,
  readStoredDraft,
  writeStoredDraft,
} from "@/lib/journeyDraftServer";

export const runtime = "nodejs";

// A:P — A:N (Slice 6) + deletedAt + editedAt.
const SHEET_NAME = "Field-Captures";
const FIELD_CAPTURES_RANGE = `${SHEET_NAME}!A:P`;
const MAX_BODY_CHARS = 20_000;
const MAX_SPEAKER_CHARS = 300;

/** 0-based column index → A1 letter (0 → A, 25 → Z, 26 → AA). */
function colLetter(i: number): string {
  let s = "";
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

type SheetsApi = ReturnType<typeof sheetsClient>;

type LocatedCapture = {
  header: string[];
  col: Record<
    "captureId" | "programId" | "authorSlug" | "kind" | "bodyText" | "visibility" | "quoteSpeaker" | "deletedAt" | "editedAt",
    number
  >;
  /** 1-based sheet row number of the capture. */
  rowNumber: number;
  row: string[];
};

/**
 * Load the tab, resolve columns by name (auto-adding deletedAt/editedAt headers
 * when absent), and locate the caller's capture. Returns a NextResponse on any
 * authz/lookup failure.
 */
async function locateOwnCapture(
  sheets: SheetsApi,
  spreadsheetId: string,
  captureId: string,
  authorSlug: string,
  programId: string
): Promise<LocatedCapture | NextResponse> {
  const existing = await withRetry(
    () => sheets.spreadsheets.values.get({ spreadsheetId, range: FIELD_CAPTURES_RANGE }),
    "Sheets get Field-Captures"
  );
  const rows = (existing.data.values ?? []) as string[][];
  const header = [...(rows[0] ?? [])];
  if (!header.length) throw new Error("Field-Captures has no header row");

  const col = {
    captureId: idxOf(header, ["captureid"]),
    programId: idxOf(header, ["programid"]),
    authorSlug: idxOf(header, ["authorslug"]),
    kind: idxOf(header, ["kind"]),
    bodyText: idxOf(header, ["bodytext"]),
    visibility: idxOf(header, ["visibility"]),
    quoteSpeaker: idxOf(header, ["quotespeaker"]),
    deletedAt: idxOf(header, ["deletedat"]),
    editedAt: idxOf(header, ["editedat"]),
  };
  if (col.captureId === -1 || col.authorSlug === -1 || col.programId === -1) {
    throw new Error("Field-Captures missing required headers");
  }

  // First use: append the deletedAt/editedAt header columns by name, matching
  // the POST route's resolve-by-header philosophy (no fixed positions assumed).
  const missing: Array<"deletedAt" | "editedAt"> = [];
  if (col.deletedAt === -1) missing.push("deletedAt");
  if (col.editedAt === -1) missing.push("editedAt");
  if (missing.length) {
    const start = header.length;
    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!${colLetter(start)}1`,
          valueInputOption: "RAW",
          requestBody: { values: [missing] },
        }),
      "Sheets add deletedAt/editedAt headers"
    );
    for (const name of missing) {
      const i = header.length;
      header.push(name);
      if (name === "deletedAt") col.deletedAt = i;
      else col.editedAt = i;
    }
  }

  const want = normId(captureId);
  let rowNumber = -1;
  let row: string[] = [];
  for (let r = 1; r < rows.length; r++) {
    if (normId(rows[r][col.captureId]) === want) {
      rowNumber = r + 1; // 1-based; header is row 1.
      row = rows[r];
      break;
    }
  }
  if (rowNumber === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ownership + program scope. A foreign-owned capture returns 404 (never
  // reveal that another member's captureId exists) — same stance as the media
  // route.
  if (
    normId(row[col.authorSlug]) !== normId(authorSlug) ||
    normId(row[col.programId]) !== normId(programId)
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return { header, col, rowNumber, row };
}

/** Write individual cells on one row via a single batchUpdate. */
async function updateCells(
  sheets: SheetsApi,
  spreadsheetId: string,
  rowNumber: number,
  cells: Array<{ colIndex: number; value: string }>
): Promise<void> {
  await withRetry(
    () =>
      sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "RAW",
          data: cells.map(({ colIndex, value }) => ({
            range: `${SHEET_NAME}!${colLetter(colIndex)}${rowNumber}`,
            values: [[value]],
          })),
        },
      }),
    "Sheets update Field-Captures row"
  );
}

// ── PATCH — edit bodyText / quoteSpeaker / visibility ─────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ captureId: string }> }
) {
  try {
    if (!rateLimit(rateKey(req), 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { captureId: rawId } = await params;
    const captureId = decodeURIComponent(String(rawId || "")).trim();
    if (!captureId) {
      return NextResponse.json({ error: "captureId required" }, { status: 400 });
    }

    const asId = new URL(req.url).searchParams.get("asId")?.trim() || undefined;
    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    const authorSlug = normId(access.slug);
    if (!authorSlug) {
      return NextResponse.json({ error: "No profile linked to this account" }, { status: 403 });
    }

    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const hasBodyText = typeof body.bodyText === "string";
    const hasSpeaker = typeof body.quoteSpeaker === "string";
    const hasVisibility = typeof body.visibility === "string";
    if (!hasBodyText && !hasSpeaker && !hasVisibility) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const visibility = hasVisibility ? String(body.visibility).trim().toLowerCase() : "";
    if (hasVisibility && visibility !== "card" && visibility !== "sealed") {
      return NextResponse.json({ error: "visibility must be card or sealed" }, { status: 400 });
    }

    const sheets = sheetsClient();
    const located = await locateOwnCapture(sheets, spreadsheetId, captureId, authorSlug, access.programId);
    if (located instanceof NextResponse) return located;
    const { col, rowNumber, row } = located;

    if (String(row[col.deletedAt] ?? "").trim()) {
      return NextResponse.json({ error: "This trace was deleted" }, { status: 410 });
    }

    const kind = normId(row[col.kind]);
    const cells: Array<{ colIndex: number; value: string }> = [];

    if (hasBodyText) {
      const bodyText = String(body.bodyText).trim().slice(0, MAX_BODY_CHARS);
      // Text kinds require content; for photo/voice the text is an optional
      // caption and may be cleared. Same rule as the POST route.
      const isFileKind = kind === "photo" || kind === "voice";
      if (!isFileKind && !bodyText) {
        return NextResponse.json({ error: "bodyText is required" }, { status: 400 });
      }
      if (col.bodyText === -1) throw new Error('Field-Captures missing "bodyText" header');
      cells.push({ colIndex: col.bodyText, value: bodyText });
    }

    if (hasSpeaker) {
      // Only quotes carry a speaker; ignore the field for other kinds rather
      // than failing a benign client payload.
      if (kind === "quote" && col.quoteSpeaker !== -1) {
        cells.push({
          colIndex: col.quoteSpeaker,
          value: String(body.quoteSpeaker).trim().slice(0, MAX_SPEAKER_CHARS),
        });
      }
    }

    if (hasVisibility && col.visibility !== -1) {
      cells.push({ colIndex: col.visibility, value: visibility });
    }

    if (cells.length) {
      cells.push({ colIndex: col.editedAt, value: new Date().toISOString() });
      await updateCells(sheets, spreadsheetId, rowNumber, cells);
    }

    return NextResponse.json({ ok: true, captureId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT CAPTURE PATCH ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── DELETE — soft delete + draft cascade ──────────────────────────────────────

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ captureId: string }> }
) {
  try {
    if (!rateLimit(rateKey(req), 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { captureId: rawId } = await params;
    const captureId = decodeURIComponent(String(rawId || "")).trim();
    if (!captureId) {
      return NextResponse.json({ error: "captureId required" }, { status: 400 });
    }

    const asId = new URL(req.url).searchParams.get("asId")?.trim() || undefined;
    const access = await getFieldKitAccess(FIELD_KIT_PROGRAM_ID, asId);
    if (!access.allowed) {
      const status = access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: "Forbidden" }, { status });
    }
    const authorSlug = normId(access.slug);
    if (!authorSlug) {
      return NextResponse.json({ error: "No profile linked to this account" }, { status: 403 });
    }

    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    const sheets = sheetsClient();
    const located = await locateOwnCapture(sheets, spreadsheetId, captureId, authorSlug, access.programId);
    if (located instanceof NextResponse) return located;
    const { col, rowNumber, row } = located;

    // Idempotent: deleting an already-deleted capture is a no-op success, so a
    // retried DELETE (flaky field connection) never errors.
    if (String(row[col.deletedAt] ?? "").trim()) {
      return NextResponse.json({ ok: true, captureId, alreadyDeleted: true });
    }

    await updateCells(sheets, spreadsheetId, rowNumber, [
      { colIndex: col.deletedAt, value: new Date().toISOString() },
    ]);

    // Cascade: strip the capture from the author's live draft so nothing in the
    // Composer/Publish flow points at a trace that no longer exists. Best-effort
    // — the read paths tolerate dangling refs, so a cascade failure must never
    // fail the delete itself.
    let draftUpdated = false;
    try {
      const key = draftStorageKey(authorSlug, "live", access.programId);
      const stored = await readStoredDraft(key);
      if (stored) {
        const want = normId(captureId);
        const draft = stored.draft;
        let changed = false;

        const chapters = draft.chapters.map((ch) => {
          const photoCaptureIds = ch.photoCaptureIds.filter((id) => normId(id) !== want);
          const audioHit = !!ch.audioCaptureId && normId(ch.audioCaptureId) === want;
          if (photoCaptureIds.length === ch.photoCaptureIds.length && !audioHit) return ch;
          changed = true;
          return {
            ...ch,
            photoCaptureIds,
            audioCaptureId: audioHit ? undefined : ch.audioCaptureId,
          };
        });

        const heroHit = !!draft.heroCaptureId && normId(draft.heroCaptureId) === want;
        if (heroHit) changed = true;

        if (changed) {
          // Bump updatedAt so a stale device copy still referencing the deleted
          // capture loses last-write-wins instead of resurrecting the ref.
          const now = new Date().toISOString();
          await writeStoredDraft(key, {
            draft: {
              ...draft,
              chapters,
              heroCaptureId: heroHit ? undefined : draft.heroCaptureId,
              updatedAt: now,
            },
            serverUpdatedAt: now,
          });
          draftUpdated = true;
        }
      }
    } catch (err) {
      console.error("FIELD-KIT CAPTURE DELETE: draft cascade failed:", err);
    }

    return NextResponse.json({ ok: true, captureId, draftUpdated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("FIELD-KIT CAPTURE DELETE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
