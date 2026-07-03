// lib/loadFieldKitCaptures.ts
//
// Read side of the Field Kit "Capture" feature (Slice A). Loads a member's own
// captures from the Field-Captures tab, LIVE — deliberately NOT through the
// Netlify Blobs fallback / refresh-fallbacks path, so a note a member just saved
// shows up on their Traces screen instantly. Request-memoized via React cache().
//
// Strictly author-scoped: callers MUST pass the authorSlug resolved server-side
// from the session (never from a URL), and we filter to programId + author here
// as defense in depth — each member sees only their own captures.

import "server-only";
import { cache } from "react";
import { sheetsClient } from "@/lib/googleClients";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";

export type FieldCapture = {
  captureId: string;
  programId: string;
  authorSlug: string;
  kind: string; // "note" | "quote" | "photo" | "voice"
  bodyText: string;
  createdAt: string;
  dayIndex: string;
  /** Itinerary chapter anchor (Slice 6); "" on pre-slice-6 rows. */
  chapterId: string;
  /** "card" | "sealed" (Slice 6); blank cells normalize to "card". */
  visibility: "card" | "sealed";
  quoteSpeaker: string;
  driveFileId: string; // photo only; empty for note/quote
  mimeType: string; // photo only; empty for note/quote
};

const FIELD_CAPTURES_RANGE = "Field-Captures!A:N"; // A:N since Slice 6

/** A member's own captures for one program, newest first. Never throws. */
export const loadCapturesForAuthor = cache(
  async (programId: string, authorSlug: string): Promise<FieldCapture[]> => {
    const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
    const wantProgram = normId(programId);
    const wantAuthor = normId(authorSlug);
    if (!spreadsheetId || !wantProgram || !wantAuthor) return [];

    const sheets = sheetsClient();
    const res = await withRetry(
      () => sheets.spreadsheets.values.get({ spreadsheetId, range: FIELD_CAPTURES_RANGE }),
      "Sheets get Field-Captures"
    );
    const rows = (res.data.values ?? []) as string[][];
    if (rows.length < 2) return [];

    const header = rows[0] ?? [];
    const iId = idxOf(header, ["captureid"]);
    const iProg = idxOf(header, ["programid"]);
    const iAuthor = idxOf(header, ["authorslug"]);
    const iKind = idxOf(header, ["kind"]);
    const iBody = idxOf(header, ["bodytext"]);
    const iCreated = idxOf(header, ["createdat"]);
    const iDay = idxOf(header, ["dayindex"]);
    const iChapter = idxOf(header, ["chapterid"]);
    const iVisibility = idxOf(header, ["visibility"]);
    const iSpeaker = idxOf(header, ["quotespeaker"]);
    const iDriveFile = idxOf(header, ["drivefileid"]);
    const iMime = idxOf(header, ["mimetype"]);
    if ([iId, iProg, iAuthor, iKind, iBody, iCreated].some((i) => i === -1)) return [];

    const out: FieldCapture[] = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (normId(row[iProg]) !== wantProgram) continue;
      if (normId(row[iAuthor]) !== wantAuthor) continue;
      out.push({
        captureId: String(row[iId] ?? ""),
        programId: String(row[iProg] ?? ""),
        authorSlug: String(row[iAuthor] ?? ""),
        kind: String(row[iKind] ?? ""),
        bodyText: String(row[iBody] ?? ""),
        createdAt: String(row[iCreated] ?? ""),
        dayIndex: iDay !== -1 ? String(row[iDay] ?? "") : "",
        chapterId: iChapter !== -1 ? String(row[iChapter] ?? "").trim() : "",
        visibility:
          iVisibility !== -1 && String(row[iVisibility] ?? "").trim().toLowerCase() === "sealed"
            ? "sealed"
            : "card",
        quoteSpeaker: iSpeaker !== -1 ? String(row[iSpeaker] ?? "") : "",
        driveFileId: iDriveFile !== -1 ? String(row[iDriveFile] ?? "") : "",
        mimeType: iMime !== -1 ? String(row[iMime] ?? "") : "",
      });
    }

    out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return out;
  }
);
