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
  kind: string; // "note" | "quote" (Slice A)
  bodyText: string;
  createdAt: string;
  dayIndex: string;
  quoteSpeaker: string;
};

const FIELD_CAPTURES_RANGE = "Field-Captures!A:L";

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
    const iSpeaker = idxOf(header, ["quotespeaker"]);
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
        quoteSpeaker: iSpeaker !== -1 ? String(row[iSpeaker] ?? "") : "",
      });
    }

    out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return out;
  }
);
