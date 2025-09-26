// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { driveClient, sheetsClient } from "@/lib/googleClients";
import { getFolderIdForKind, MediaKind } from "@/lib/profileFolders";
import { PassThrough } from "stream";

function bufferToStream(buf: Buffer) {
  const s = new PassThrough();
  s.end(buf);
  return s;
}



type UploadPayload = {
  alumniId: string;
  kind: MediaKind; // "headshot" | "album" | "reel" | "event"
  name: string;
  mimeType: string;
  buffer: Buffer;
  collectionId?: string;
  collectionTitle?: string;
  isFeatured?: string; // "TRUE"/"FALSE" optional
  sortIndex?: string;  // optional
  note?: string;       // optional
  uploadedByEmail?: string; // optional
};

async function readUploadPayload(req: Request): Promise<UploadPayload> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Missing file (form field 'file')");
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    const alumniId = String(form.get("alumniId") || "").trim();
    const kind = String(form.get("kind") || "").trim() as MediaKind;

    return {
      alumniId,
      kind,
      name: String(form.get("name") || file.name || "upload"),
      mimeType: file.type || "application/octet-stream",
      buffer,
      collectionId: String(form.get("collectionId") || ""),
      collectionTitle: String(form.get("collectionTitle") || ""),
      isFeatured: String(form.get("isFeatured") || ""),
      sortIndex: String(form.get("sortIndex") || ""),
      note: String(form.get("note") || ""),
      uploadedByEmail: String(form.get("uploadedByEmail") || ""),
    };
  } else {
    const body = (await req.json()) as any;
    if (!body?.data) throw new Error("Missing 'data' (base64) in JSON body");
    const base64: string = String(body.data).split(",").pop()!;
    const buffer = Buffer.from(base64, "base64");
    return {
      alumniId: String(body.alumniId || "").trim(),
      kind: String(body.kind || "").trim() as MediaKind,
      name: String(body.name || "upload"),
      mimeType: String(body.mimeType || "application/octet-stream"),
      buffer,
      collectionId: String(body.collectionId || ""),
      collectionTitle: String(body.collectionTitle || ""),
      isFeatured: String(body.isFeatured || ""),
      sortIndex: String(body.sortIndex || ""),
      note: String(body.note || ""),
      uploadedByEmail: String(body.uploadedByEmail || ""),
    };
  }
}

export async function POST(req: Request) {
  try {
    const {
      alumniId,
      kind,
      name,
      mimeType,
      buffer,
      collectionId,
      collectionTitle,
      isFeatured,
      sortIndex,
      note,
      uploadedByEmail,
    } = await readUploadPayload(req);

    if (!alumniId) return NextResponse.json({ error: "alumniId is required" }, { status: 400 });
    if (!["headshot", "album", "reel", "event"].includes(kind))
      return NextResponse.json({ error: "kind must be one of headshot|album|reel|event" }, { status: 400 });

    // 1) Upload the file to Drive
    const parentFolderId = getFolderIdForKind(kind);
    const drive = driveClient();
    const createRes = await drive.files.create({
  requestBody: { name, parents: [parentFolderId] },
  media: { mimeType, body: bufferToStream(buffer) },
  fields: "id",
  supportsAllDrives: true, 
});
    const fileId = createRes.data.id!;
    const nowIso = new Date().toISOString();

    // 2) Append row to Profile-Media
    // Expected headers (A..L):
    // alumniId, kind, collectionId, collectionTitle, fileId, externalUrl, uploadedByEmail, uploadedAt, isCurrent, isFeatured, sortIndex, note
    const sheets = sheetsClient();
    const spreadsheetId = process.env.ALUMNI_SHEET_ID!;
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Profile-Media!A:L",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          alumniId,
          kind,
          collectionId ?? "",
          collectionTitle ?? "",
          fileId,
          "", // externalUrl (optional)
          uploadedByEmail ?? "",
          nowIso,
          kind === "headshot" ? "TRUE" : "", // mark current headshot by default
          isFeatured ?? "",
          sortIndex ?? "",
          note ?? "",
        ]],
      },
    });

    // 3) If headshot: flip previous current and update pointer in Profile-Live
    if (kind === "headshot") {
      const media = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Profile-Media!A:L",
      });
      const mRows = media.data.values ?? [];
      const [mh, ...rows] = mRows;
      if (mh) {
        const idxAid = mh.indexOf("alumniId");
        const idxKind = mh.indexOf("kind");
        const idxCur  = mh.indexOf("isCurrent");
        // flip previous TRUE to FALSE (exclude the last appended row)
        for (let i = 0; i < rows.length - 1; i++) {
          const row = rows[i] as string[];
          if (row[idxAid] === alumniId && row[idxKind] === "headshot" && row[idxCur] === "TRUE") {
            row[idxCur] = "FALSE";
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `Profile-Media!A${i + 2}:L${i + 2}`, // +2 for header + 1-index
              valueInputOption: "RAW",
              requestBody: { values: [row] },
            });
            break;
          }
        }
      }

      // Update currentHeadshotId + status in Profile-Live
      const live = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Profile-Live!A:Z",
      });
      const lRows = live.data.values ?? [];
      const lh = lRows[0] ?? [];
      const idIdx = lh.indexOf("alumniId");
      const headIdx = lh.indexOf("currentHeadshotId");
      const statusIdx = lh.indexOf("status");
      const updatedIdx = lh.indexOf("updatedAt");
      if (idIdx === -1) throw new Error(`Profile-Live missing "alumniId" header`);
      if (headIdx === -1) throw new Error(`Profile-Live missing "currentHeadshotId" header`);

      // find row
      let rowIndex = -1;
      for (let i = 1; i < lRows.length; i++) {
        const r = lRows[i];
        if (r[idIdx] === alumniId) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        // create new row
        const newRow: string[] = Array(lh.length).fill("");
        newRow[idIdx] = alumniId;
        newRow[headIdx] = fileId;
        if (statusIdx !== -1) newRow[statusIdx] = "pending";
        if (updatedIdx !== -1) newRow[updatedIdx] = nowIso;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Profile-Live!A${lRows.length + 1}:Z${lRows.length + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [newRow] },
        });
      } else {
        const row = lRows[rowIndex] as string[];
        row[headIdx] = fileId;
        if (statusIdx !== -1) row[statusIdx] = "pending";
        if (updatedIdx !== -1) row[updatedIdx] = nowIso;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Profile-Live!A${rowIndex + 1}:Z${rowIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [row] },
        });
      }
    }

    return NextResponse.json({ fileId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("UPLOAD ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
