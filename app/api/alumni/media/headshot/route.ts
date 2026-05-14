// app/api/alumni/media/headshot/route.ts
//
// DELETE /api/alumni/media/headshot?alumniId=xxx&fileId=yyy
//
// Deletes a non-original headshot:
//   1. Auth + ownership check (admin can delete any; alumni can only delete their own)
//   2. Rejects if isOriginal = TRUE in Profile-Media
//   3. Deletes the file from Google Drive
//   4. Removes the row from Profile-Media via deleteDimension
//   5. If the deleted headshot was current: promotes the next most-recent fileId-based
//      headshot to current in Profile-Media + Profile-Live, or clears the pointer
//   6. Purges the Netlify CDN cache tag for the file (non-fatal)

import { NextResponse } from "next/server";
import { sheetsClient, driveClient } from "@/lib/googleClients";
import {
  assertCanEditProfile,
  withRetry,
  idxOf,
  featureExistingInMedia,
  setLivePointer,
} from "@/lib/ownership";

export const runtime = "nodejs";

const NETLIFY_SITE_ID = "8603a44e-f01e-4346-ba86-19d457889e5a";
const NETLIFY_PURGE_URL = "https://api.netlify.com/api/v1/purge";

function truthyCell(v: unknown): boolean {
  if (v === true) return true;
  if (v === false || v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "1" || s === "y";
}

async function purgeCdnCache(fileId: string) {
  const token = process.env.NETLIFY_PERSONAL_ACCESS_TOKEN;
  if (!token) return;
  try {
    await fetch(NETLIFY_PURGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ site_id: NETLIFY_SITE_ID, cache_tags: [`headshot-${fileId}`] }),
    });
  } catch {
    // non-fatal
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const alumniId = String(searchParams.get("alumniId") || "").trim().toLowerCase();
  const fileId = String(searchParams.get("fileId") || "").trim();

  if (!alumniId) {
    return NextResponse.json({ error: "alumniId required" }, { status: 400 });
  }
  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  // 1. Auth + ownership check
  const auth = await assertCanEditProfile(req, alumniId);
  if (!auth.ok) return auth.response;

  const spreadsheetId = process.env.ALUMNI_SHEET_ID;
  if (!spreadsheetId) {
    return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
  }

  const sheets = sheetsClient();
  const drive = driveClient();

  // 2. Read all Profile-Media rows (include isOriginal column M)
  const mediaResp = await withRetry(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Profile-Media!A:M",
        valueRenderOption: "UNFORMATTED_VALUE",
      }),
    "Sheets get Profile-Media"
  );

  const mRows = (mediaResp.data.values ?? []) as any[][];
  if (mRows.length === 0) {
    return NextResponse.json({ error: "Profile-Media is empty" }, { status: 404 });
  }

  const header = mRows[0] as string[];
  const rows = mRows.slice(1);

  const idxAid = idxOf(header, ["alumniid", "alumni id", "alumni_id"]);
  const idxKind = idxOf(header, ["kind"]);
  const idxFile = idxOf(header, ["fileid", "file id"]);
  const idxIsCur = idxOf(header, ["iscurrent"]);
  const idxUploadedAt = idxOf(header, ["uploadedat", "uploaded at"]);
  const idxIsOriginal = idxOf(header, ["isoriginal", "is original"]);

  if (idxAid === -1 || idxKind === -1 || idxFile === -1) {
    return NextResponse.json(
      { error: "Profile-Media missing required columns" },
      { status: 500 }
    );
  }

  // 3. Find the target headshot row
  let targetIndex: number | null = null;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] as string[];
    if (
      String(r[idxAid] || "").trim().toLowerCase() === alumniId &&
      String(r[idxKind] || "").trim() === "headshot" &&
      String(r[idxFile] || "").trim() === fileId
    ) {
      targetIndex = i;
      break;
    }
  }

  if (targetIndex === null) {
    return NextResponse.json({ error: "Headshot not found" }, { status: 404 });
  }

  const targetRow = rows[targetIndex] as string[];

  // 4. Reject deletion of original headshots
  if (idxIsOriginal !== -1 && truthyCell(targetRow[idxIsOriginal])) {
    return NextResponse.json(
      { error: "Original headshots cannot be deleted" },
      { status: 403 }
    );
  }

  const wasCurrentRow =
    idxIsCur !== -1 && String(targetRow[idxIsCur] || "").toUpperCase() === "TRUE";

  // Find the next most-recent fileId-based headshot for this alumni (before deleting)
  // so we can promote it if needed
  let nextCandidateFileId = "";
  if (wasCurrentRow && idxUploadedAt !== -1) {
    const candidates = rows
      .filter((r, i) => {
        if (i === targetIndex) return false;
        return (
          String((r as string[])[idxAid] || "").trim().toLowerCase() === alumniId &&
          String((r as string[])[idxKind] || "").trim() === "headshot" &&
          String((r as string[])[idxFile] || "").trim()
        );
      })
      .map((r) => r as string[]);

    candidates.sort((a, b) => {
      const ta = Date.parse(String(a[idxUploadedAt] || "")) || 0;
      const tb = Date.parse(String(b[idxUploadedAt] || "")) || 0;
      return tb - ta; // newest first
    });

    nextCandidateFileId = candidates.length > 0
      ? String(candidates[0][idxFile] || "").trim()
      : "";
  }

  // 5. Delete from Google Drive (non-fatal if already gone)
  try {
    await withRetry(
      () => (drive.files.delete as any)({ fileId, supportsAllDrives: true }),
      `Drive delete ${fileId}`
    );
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (!/not found|404/i.test(msg)) throw e;
    // File already gone from Drive — continue with sheet cleanup
  }

  // 6. Get Profile-Media sheet ID for the deleteDimension request
  const spreadsheetInfo = await withRetry(
    () =>
      sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties",
      }),
    "Sheets get spreadsheet info"
  );
  const mediaSheet = spreadsheetInfo.data.sheets?.find(
    (s) => s.properties?.title === "Profile-Media"
  );
  const sheetId = mediaSheet?.properties?.sheetId;
  if (sheetId == null) {
    return NextResponse.json(
      { error: "Could not locate Profile-Media sheet" },
      { status: 500 }
    );
  }

  // 7. Delete the row (targetIndex in rows[] → sheet row = targetIndex + 2, 1-based)
  // deleteDimension uses 0-based indices; row 0 = header, first data row = 1
  await withRetry(
    () =>
      sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: targetIndex! + 1, // +1 to skip header
                  endIndex: targetIndex! + 2,
                },
              },
            },
          ],
        },
      }),
    "Sheets deleteDimension Profile-Media row"
  );

  // 8. If the deleted row was current, promote the next headshot
  const nowIso = new Date().toISOString();
  let newCurrentFileId = "";

  if (wasCurrentRow) {
    if (nextCandidateFileId) {
      newCurrentFileId = nextCandidateFileId;
      // featureExistingInMedia re-reads the sheet fresh (after deletion) and
      // sets isCurrent=TRUE on the next candidate, clearing all others
      await featureExistingInMedia(spreadsheetId, alumniId, "headshot", nextCandidateFileId);
      await setLivePointer(spreadsheetId, alumniId, "headshot", nextCandidateFileId, nowIso);
    } else {
      // No file-backed headshots remain — clear the Profile-Live pointer
      await setLivePointer(spreadsheetId, alumniId, "headshot", "", nowIso);
    }
  }

  // 9. Purge CDN cache (non-fatal)
  await purgeCdnCache(fileId);

  return NextResponse.json({ ok: true, deleted: fileId, newCurrentFileId });
}
