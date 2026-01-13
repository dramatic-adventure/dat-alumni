// /lib/ownership.ts
import { sheetsClient } from "@/lib/googleClients";

/** Narrow media kinds used across routes */
export type MediaKind = "headshot" | "album" | "reel" | "event";

/** Case-insensitive header lookup */
export function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

/** Simple retry helper for flaky network / Google API errors */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  tries = 3,
  baseDelayMs = 250
): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e);
      if (
        /ECONNRESET|ENOTFOUND|ETIMEDOUT|EPIPE|socket hang up|rateLimitExceeded|backendError|internalError/i.test(
          msg
        ) &&
        attempt < tries
      ) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }
  throw new Error(`${label} failed: ${lastErr?.message || String(lastErr)}`);
}

/** Normalize gmail/googlemail and strip +tag/dots for gmail */
export function normalizeGmail(raw: string) {
  const e = String(raw || "").trim().toLowerCase();
  const [user, domain] = e.split("@");
  if (!user || !domain) return e;
  const canon = domain === "googlemail.com" ? "gmail.com" : domain;
  if (canon !== "gmail.com") return `${user}@${canon}`;
  const noPlus = user.split("+")[0];
  const noDots = noPlus.replace(/\./g, "");
  return `${noDots}@gmail.com`;
}

function normId(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

/** ADMIN_EMAILS is a comma-separated list of admin addresses */
export function isAdmin(email?: string | null) {
  const raw = process.env.ADMIN_EMAILS || "";
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return !!(email && set.has(String(email).toLowerCase()));
}

/** Resolve the alumniId that "owns" an email (Live → Aliases → Changes) */
export async function resolveOwnerAlumniId(
  spreadsheetId: string,
  email: string
): Promise<string> {
  const sheets = sheetsClient();
  const nEmail = normalizeGmail(email);

  // 1) Profile-Live
  const live = await withRetry(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Profile-Live!A:ZZ",
        valueRenderOption: "UNFORMATTED_VALUE",
      }),
    "Sheets get Profile-Live"
  );
  const liveRows = live.data.values ?? [];
  if (liveRows.length > 0) {
    const [H, ...rows] = liveRows as string[][];
    const idIdx = idxOf(H, ["alumniid", "slug", "alumni id", "id"]);
    if (idIdx !== -1) {
      const emailCols: number[] = (H || [])
        .map((h: string, i: number) => ({
          h: String(h || "").trim().toLowerCase(),
          i,
        }))
        .filter(({ h }) => /(email|gmail)/.test(h))
        .map(({ i }) => i);

      for (const r of rows as string[][]) {
        const candidates = emailCols
          .map((i) => String(r[i] || ""))
          .filter(Boolean);
        const normed = new Set(candidates.map(normalizeGmail));
        if (normed.has(nEmail)) {
          return normId(r[idIdx]);
        }
      }
    }
  }

  // 2) Profile-Aliases
  try {
    const alias = await withRetry(
      () =>
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: "Profile-Aliases!A:B",
          valueRenderOption: "UNFORMATTED_VALUE",
        }),
      "Sheets get Profile-Aliases"
    );
    const aRows = alias.data.values ?? [];
    if (aRows.length > 1) {
      const [, ...rest] = aRows as string[][];
      const hit = rest.find(
        ([e, aid]) => e && aid && normalizeGmail(String(e)) === nEmail
      );
      if (hit) return normId(hit[1]);
    }
  } catch {
    /* optional sheet */
  }

  // 3) Profile-Changes (most recent)
  const chg = await withRetry(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Profile-Changes!A:ZZ",
        valueRenderOption: "UNFORMATTED_VALUE",
      }),
    "Sheets get Profile-Changes"
  );
  const chgRows = chg.data.values ?? [];
  if (chgRows.length > 1) {
    const [h, ...rows2] = chgRows as string[][];
    const emailIdx = idxOf(h, ["email", "submittedbyemail"]);
    const slugIdx = idxOf(h, ["alumniid", "slug", "alumni id", "id"]);
    if (emailIdx !== -1 && slugIdx !== -1) {
      for (let i = rows2.length - 1; i >= 0; i--) {
        const r = rows2[i] as string[];
        const e = normalizeGmail(String(r[emailIdx] || ""));
        const s = normId(r[slugIdx]);
        if (e === nEmail && s) return s;
      }
    }
  }

  return "";
}

/** Map kind -> Profile-Live asset column (shared) */
export const LIVE_ASSET_COL: Record<MediaKind, string> = {
  headshot: "currentHeadshotId",
  album: "featuredAlbumId",
  reel: "featuredReelId",
  event: "featuredEventId",
};

/** Flip featured/current flags in Profile-Media for an existing fileId */
export async function featureExistingInMedia(
  spreadsheetId: string,
  alumniId: string,
  kind: MediaKind,
  fileId: string
) {
  const sheets = sheetsClient();
  const media = await withRetry(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Profile-Media!A:L",
      }),
    "Sheets get Profile-Media"
  );

  const mRows = media.data.values ?? [];
  const [mh, ...rows] = mRows as string[][];
  if (!mh) throw new Error("Profile-Media has no header");

  // Case-insensitive header mapping (supports alumniId vs alumniid, etc.)
  const mhLower = mh.map((h) => String(h || "").trim().toLowerCase());
  const idxAid = mhLower.indexOf("alumniid");
  const idxKind = mhLower.indexOf("kind");
  const idxFile = mhLower.indexOf("fileid");
  const idxIsCur = mhLower.indexOf("iscurrent");
  const idxIsFeat = mhLower.indexOf("isfeatured");

  if (idxAid === -1 || idxKind === -1 || idxFile === -1) {
    throw new Error("Profile-Media is missing required columns");
  }

  const flagColIdx = kind === "headshot" ? idxIsCur : idxIsFeat;
  if (flagColIdx === -1) {
    throw new Error("Profile-Media missing featured/current flag columns");
  }

  const aid = normId(alumniId);
  const targetRowIndices: number[] = [];
  let targetIndex: number | null = null;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] as string[];
    if (normId(r[idxAid]) === aid && String(r[idxKind] || "") === kind) {
      targetRowIndices.push(i);
      if (String(r[idxFile] || "") === fileId) targetIndex = i;
    }
  }

  if (targetIndex == null) throw new Error("fileId not found for this alumni/kind");

  const data: { range: string; values: string[][] }[] = [];

  const selected = rows[targetIndex] as string[];
  while (selected.length < mh.length) selected.push("");
  selected[flagColIdx] = "TRUE";
  data.push({
    range: `Profile-Media!A${targetIndex + 2}:L${targetIndex + 2}`,
    values: [selected],
  });

  for (const i of targetRowIndices) {
    if (i === targetIndex) continue;
    const row = rows[i] as string[];
    while (row.length < mh.length) row.push("");
    if (row[flagColIdx] === "TRUE") {
      row[flagColIdx] = "FALSE";
      data.push({ range: `Profile-Media!A${i + 2}:L${i + 2}`, values: [row] });
    }
  }

  if (data.length) {
    await withRetry(
      () =>
        sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: { data, valueInputOption: "RAW" },
        }),
      "Sheets batchUpdate Profile-Media (feature existing)"
    );
  }
}

/** Set the pointer in Profile-Live to the selected file (needs_review + lastChangeType="media") */
export async function setLivePointer(
  spreadsheetId: string,
  alumniId: string,
  kind: MediaKind,
  fileId: string,
  nowIso: string
): Promise<string> {
  const sheets = sheetsClient();
  const live = await withRetry(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Profile-Live!A:ZZ",
      }),
    "Sheets get Profile-Live (pointer)"
  );

  const rows = live.data.values ?? [];
  const header = (rows[0] ?? []) as string[];

  const idIdx = idxOf(header, ["alumniid", "slug", "alumni id", "id"]);
  if (idIdx === -1) throw new Error(`Profile-Live missing "alumniId" header`);

  const statusIdx = idxOf(header, ["status"]);
  const updatedIdx = idxOf(header, ["updatedat", "updated at"]);
  const lastChangeIdx = idxOf(header, ["lastchangetype"]);

  const colName = LIVE_ASSET_COL[kind];
  const assetIdx = idxOf(header, [colName]);

  const aid = normId(alumniId);

  let rowIndex = rows.findIndex(
    (r: string[], i: number) => i > 0 && normId(r[idIdx]) === aid
  );

  if (rowIndex === -1) {
    rowIndex = rows.length;
    const newRow: string[] = Array(header.length).fill("");

    newRow[idIdx] = aid;
    if (assetIdx !== -1) newRow[assetIdx] = fileId;
    if (statusIdx !== -1) newRow[statusIdx] = "needs_review";
    if (updatedIdx !== -1) newRow[updatedIdx] = nowIso;
    if (lastChangeIdx !== -1) newRow[lastChangeIdx] = "media";

    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Profile-Live!A${rowIndex + 1}:ZZ${rowIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [newRow] },
        }),
      "Sheets update Profile-Live (create & set pointer)"
    );
  } else {
    const row = [...((rows[rowIndex] as string[]) ?? [])] as string[];
    while (row.length < header.length) row.push("");

    if (assetIdx !== -1) row[assetIdx] = fileId;
    if (statusIdx !== -1) row[statusIdx] = "needs_review";
    if (updatedIdx !== -1) row[updatedIdx] = nowIso;
    if (lastChangeIdx !== -1) row[lastChangeIdx] = "media";

    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Profile-Live!A${rowIndex + 1}:ZZ${rowIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [row] },
        }),
      "Sheets update Profile-Live (set pointer)"
    );
  }

  return colName;
}
