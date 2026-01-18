// /app/api/alumni/save/route.ts
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAuth } from "@/lib/requireAuth";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** case-insensitive header lookup */
function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

function normId(x: unknown) {
  return String(x ?? "").trim().toLowerCase();
}

/** Normalize gmail/googlemail and strip +tag/dots for gmail */
function normalizeGmail(raw: string) {
  const e = String(raw || "").trim().toLowerCase();
  const [user, domain] = e.split("@");
  if (!user || !domain) return e;

  const canonDomain = domain === "googlemail.com" ? "gmail.com" : domain;
  if (canonDomain !== "gmail.com") return `${user}@${canonDomain}`;

  const noPlus = user.split("+")[0];
  const noDots = noPlus.replace(/\./g, "");
  return `${noDots}@gmail.com`;
}

function isAdmin(email: string | undefined | null) {
  const raw = process.env.ADMIN_EMAILS || "";
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return !!(email && set.has(String(email).toLowerCase()));
}

/** Ensure Profile-Slugs sheet has a header row */
async function ensureSlugsSheetHeader(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string
) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Slugs!A:C",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const vals = res.data.values ?? [];
    if (vals.length === 0 || (vals[0] || []).length < 3) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Profile-Slugs!A1:C1",
        valueInputOption: "RAW",
        requestBody: { values: [["fromSlug", "toSlug", "createdAt"]] },
      });
    }
  } catch {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Profile-Slugs!A1:C1",
      valueInputOption: "RAW",
      requestBody: { values: [["fromSlug", "toSlug", "createdAt"]] },
    });
  }
}

/**
 * Resolve stable alumniId (owner) from an incoming key that might be:
 * - stable alumniId (preferred)
 * - current slug
 */
function resolveStableAlumniIdForEdit(opts: {
  header: any[];
  rows: any[][];
  incoming: string;
}) {
  const { header, rows, incoming } = opts;
  const key = normId(incoming);
  if (!key) return "";

  const idIdx = idxOf(header as string[], ["alumniid", "alumni id", "id"]);
  const slugIdx = idxOf(header as string[], ["slug"]);
  if (idIdx === -1) return "";

  const byId = rows.find((r) => normId(r?.[idIdx]) === key);
  if (byId) return normId(byId[idIdx]);

  if (slugIdx !== -1) {
    const bySlug = rows.find((r) => normId(r?.[slugIdx]) === key);
    if (bySlug) return normId(bySlug[idIdx]);
  }

  // Unknown — return key (admin-only creation path)
  return key;
}

/** Resolve the alumniId that "owns" an email (Live → Aliases → Changes) */
async function resolveOwnerAlumniId(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  email: string
): Promise<string> {
  const nEmail = normalizeGmail(email);

  // 1) Profile-Live
  const live = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Profile-Live!A:ZZ",
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const liveRows = live.data.values ?? [];
  if (liveRows.length > 0) {
    const [H, ...rows] = liveRows as any[][];
    const idIdx = idxOf(H, ["alumniid", "alumni id", "id"]);
    const emailIdx = idxOf(H, ["email"]);
    if (idIdx !== -1 && emailIdx !== -1) {
      for (const r of rows) {
        const e = normalizeGmail(String(r[emailIdx] || ""));
        if (e && e === nEmail) return normId(r[idIdx]);
      }
    }
  }

  // 2) Profile-Aliases (optional)
  try {
    const alias = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Aliases!A:B",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const aRows = alias.data.values ?? [];
    if (aRows.length > 1) {
      const [, ...rest] = aRows;
      const hit = rest.find(
        ([e, aid]) => e && aid && normalizeGmail(String(e)) === nEmail
      );
      if (hit) return normId(hit[1]);
    }
  } catch {
    // optional
  }

  // 3) Profile-Changes (most recent)
  const chg = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Profile-Changes!A:ZZ",
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const chgRows = chg.data.values ?? [];
  if (chgRows.length > 1) {
    const [h, ...rows2] = chgRows as any[][];
    const emailIdx = idxOf(h, ["email"]);
    const idIdx = idxOf(h, ["alumniid", "alumni id", "id"]);
    if (emailIdx !== -1 && idIdx !== -1) {
      for (let i = rows2.length - 1; i >= 0; i--) {
        const r = rows2[i];
        const e = normalizeGmail(String(r[emailIdx] || ""));
        const id = normId(r[idIdx]);
        if (e === nEmail && id) return id;
      }
    }
  }

  return "";
}

function isStableIdField(k: string) {
  const kk = k.trim().toLowerCase();
  return kk === "alumniid" || kk === "alumni id" || kk === "id";
}

function isServerControlledField(k: string) {
  const kk = k.trim().toLowerCase();
  return kk === "updatedat" || kk === "updated at";
}

function isAdminOnlyField(k: string) {
  const kk = k.trim().toLowerCase();
  return kk === "ispublic" || kk === "is public" || kk === "status";
}

/** Ensure Profile-Aliases sheet has header row */
async function ensureAliasesHeader(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string
) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Aliases!A:B",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const vals = res.data.values ?? [];
    if (vals.length === 0 || (vals[0] || []).length < 2) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Profile-Aliases!A1:B1",
        valueInputOption: "RAW",
        requestBody: { values: [["email", "alumniId"]] },
      });
    }
  } catch {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Profile-Aliases!A1:B1",
      valueInputOption: "RAW",
      requestBody: { values: [["email", "alumniId"]] },
    });
  }
}

/** Ensure current email is mapped to this alumniId (non-fatal if it fails) */
async function ensureAlias(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  email: string,
  alumniId: string
) {
  const nEmail = normalizeGmail(email);
  const nId = normId(alumniId);
  if (!nEmail || !nId) return;

  await ensureAliasesHeader(sheets, spreadsheetId);

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Aliases!A:B",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const vals = (res.data.values ?? []) as any[][];
    const [H, ...rows] = vals.length ? vals : [[]];
    const eIdx = idxOf(H as any, ["email"]);
    const idIdx = idxOf(H as any, ["alumniid", "alumni id", "id"]);
    if (eIdx === -1 || idIdx === -1) return;

    const exists = rows.some(
      (r) =>
        normalizeGmail(String(r?.[eIdx] ?? "")) === nEmail &&
        normId(String(r?.[idIdx] ?? "")) === nId
    );

    if (!exists) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Profile-Aliases!A:B",
        valueInputOption: "RAW",
        requestBody: { values: [[nEmail, nId]] },
      });
    }
  } catch {
    // don't fail saves because alias sheet is unavailable
  }
}

/**
 * ✅ Unique email guard for Profile-Live.
 * Returns null if OK; otherwise a 409 payload with match details.
 */
function checkDuplicateEmailInLive(opts: {
  dataRows: any[][];
  emailIdx: number;
  idIdx: number;
  slugIdx: number;
  statusIdx: number;
  isPublicIdx: number;
  updatedIdx: number;
  ownerKey: string;
  candidateEmail: string;
}) {
  const {
    dataRows,
    emailIdx,
    idIdx,
    slugIdx,
    statusIdx,
    isPublicIdx,
    updatedIdx,
    ownerKey,
    candidateEmail,
  } = opts;

  if (emailIdx === -1) return null;

  const want = normalizeGmail(candidateEmail);
  if (!want) return null;

  const matches = dataRows
    .filter((r) => normalizeGmail(String(r?.[emailIdx] ?? "")) === want)
    .map((r) => ({
      alumniId: idIdx !== -1 ? normId(r?.[idIdx]) : "",
      slug: slugIdx !== -1 ? normId(r?.[slugIdx]) : "",
      status: statusIdx !== -1 ? String(r?.[statusIdx] ?? "") : "",
      isPublic: isPublicIdx !== -1 ? String(r?.[isPublicIdx] ?? "") : "",
      updatedAt: updatedIdx !== -1 ? String(r?.[updatedIdx] ?? "") : "",
    }));

  const owners = new Set(matches.map((m) => m.alumniId).filter(Boolean));

  if (owners.size === 0) return null;
  if (owners.size === 1 && owners.has(normId(ownerKey))) return null;

  return {
    error: "duplicate_email" as const,
    email: want,
    matchCount: matches.length,
    matches,
  };
}

/* ──────────────────────────────────────────────────────────
 * ✅ Field aliases + canonicalization (UI → Profile-Live)
 * Fixes “No changes to save” when UI sends keys that don’t
 * exist in Profile-Live (or differ in casing/format).
 * ────────────────────────────────────────────────────────── */
const FIELD_ALIASES: Record<string, string> = {
  // Bio / Artist statement variants → biolong
  bio: "biolong",
  "bio long": "biolong",
  "bio-long": "biolong",
  "bio_long": "biolong",
  biolong: "biolong",
  artiststatement: "biolong",
  "artist statement": "biolong",
  artistbio: "biolong",
  "artist bio": "biolong",

  // Optional short bio
  bioshort: "bioshort",
  "bio short": "bioshort",
  "bio-short": "bioshort",
  "bio_short": "bioshort",

  // Status flags variants
  statusflag: "statusflags",
  "status flag": "statusflags",
  statusflags: "statusflags",

  // Program badges variants
  programbadges: "programs",
  "program badges": "programs",
  projectbadges: "programs",
  "project badges": "programs",

  // Other common camelCase/variants
  currentheadshoturl: "currentheadshoturl",
  secondlocation: "secondlocation",
  backgroundstyle: "backgroundstyle",
  backgroundchoice: "backgroundchoice",
  isbicoastal: "isbicoastal",
  publicemail: "publicemail",
};

function canonKey(rawKey: string) {
  const raw = String(rawKey || "").trim();
  if (!raw) return "";

  const kLower = raw.toLowerCase();

  // 1) exact alias
  if (FIELD_ALIASES[kLower]) return FIELD_ALIASES[kLower];

  // 2) smash separators: "bioLong" / "bio_long" / "bio-long"
  const smashed = kLower.replace(/[\s_-]+/g, "");
  if (FIELD_ALIASES[smashed]) return FIELD_ALIASES[smashed];

  // 3) default: lowercased raw key
  return kLower;
}

export async function PUT(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(ip, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();

    const {
      alumniId,
      oldSlug,
      changes,
      submittedByEmail = "",
      note = "",
    } = body || {};

    const incomingKey = normId(alumniId);
    const oldKey = normId(oldSlug);

    if (!incomingKey || typeof changes !== "object" || changes == null) {
      return NextResponse.json(
        { error: "alumniId and changes are required" },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "Missing ALUMNI_SHEET_ID" },
        { status: 500 }
      );
    }

    const sheets = sheetsClient();
    const admin = isAdmin(auth.email);

    // Read Profile-Live ONCE
    const liveResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Live!A:ZZ",
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const rowsAll = (liveResp.data.values ?? []) as any[][];
    if (!rowsAll.length) {
      return NextResponse.json(
        { error: "Profile-Live has no header row" },
        { status: 500 }
      );
    }

    const header = rowsAll[0] ?? [];
    const dataRows = rowsAll.slice(1);

    // map header -> col idx (lowercase)
    const headerMap: Record<string, number> = {};
    header.forEach((h: any, i: number) => {
      headerMap[String(h ?? "").trim().toLowerCase()] = i;
    });

    const idIdx = idxOf(header as string[], ["alumniid", "alumni id", "id"]);
    const slugIdx = idxOf(header as string[], ["slug"]);
    const statusIdx = idxOf(header as string[], ["status"]);
    const updatedIdx = idxOf(header as string[], ["updatedat", "updated at"]);
    const emailIdx = idxOf(header as string[], ["email"]);
    const isPublicIdx = idxOf(header as string[], ["ispublic", "is public"]);

    if (idIdx === -1) throw new Error('Profile-Live missing "alumniId" header');
    if (slugIdx === -1) throw new Error('Profile-Live missing "slug" header');
    if (statusIdx === -1) throw new Error('Profile-Live missing "status" header');

    // Resolve stable owner alumniId from incomingKey (slug or stable id)
    const ownerKey = resolveStableAlumniIdForEdit({
      header,
      rows: dataRows,
      incoming: oldKey || incomingKey,
    });

    if (!ownerKey) {
      return NextResponse.json(
        { error: "Unable to resolve owner alumniId" },
        { status: 400 }
      );
    }

    // Non-admins can only edit their own stable alumniId
    if (!admin) {
      const ownerId = await resolveOwnerAlumniId(
        sheets,
        spreadsheetId,
        auth.email || ""
      );
      if (!ownerId || ownerId !== ownerKey) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ensure the logged-in email is mapped (non-fatal)
    if (auth.email) {
      void ensureAlias(sheets, spreadsheetId, auth.email, ownerKey).catch(
        () => {}
      );
    }

    const submitter = String(submittedByEmail || auth.email || "").trim();
    const nowIso = new Date().toISOString();

    // Find the live row by stable alumniId
    let rowIndex = dataRows.findIndex((r) => normId(r?.[idIdx]) === ownerKey);

    // Optional fallback by slug (legacy)
    if (rowIndex === -1) {
      const bySlug = dataRows.findIndex(
        (r) => normId(r?.[slugIdx]) === incomingKey
      );
      if (bySlug !== -1) rowIndex = bySlug;
    }

    const currentRow = rowIndex !== -1 ? (dataRows[rowIndex] ?? []) : [];

    const beforeForFieldLower = (fieldLower: string): string => {
      const colIdx = headerMap[fieldLower];
      if (typeof colIdx !== "number" || colIdx < 0) return "";
      return String(currentRow[colIdx] ?? "");
    };

    /**
     * Filter incoming changes:
     * - canonKey() maps UI keys → Profile-Live keys
     * - must exist as a column in Profile-Live
     * - never allow alumniId updates
     * - block server-controlled keys
     * - admin-only keys guarded
     *
     * ALSO:
     * - return savedFields as the ORIGINAL keys client sent (prevents client asserts)
     */
    const filteredChangesByCanonical: Record<string, string> = {};
    const acceptedInputKeys: string[] = [];
    const acceptedCanonicalKeys: string[] = [];

    for (const [rawKey, rawVal] of Object.entries(
      changes as Record<string, unknown>
    )) {
      const inputKey = String(rawKey || "").trim();
      if (!inputKey) continue;

      const kCanon = canonKey(inputKey);
      if (!kCanon) continue;

      if (isStableIdField(kCanon)) continue;
      if (isServerControlledField(kCanon)) continue;
      if (isAdminOnlyField(kCanon) && !admin) continue;

      const colIdx = headerMap[kCanon];
      if (typeof colIdx !== "number" || colIdx < 0) continue;

      filteredChangesByCanonical[kCanon] = rawVal == null ? "" : String(rawVal);
      acceptedInputKeys.push(inputKey);
      acceptedCanonicalKeys.push(kCanon);
    }

    if (!Object.keys(filteredChangesByCanonical).length) {
      return NextResponse.json(
        { ok: true, note: "No-op (no valid fields)", savedFields: [] },
        { status: 200 }
      );
    }

    // 1) Append audit rows to Profile-Changes (ts, alumniId, email, field, before, after)
    const changeRows: string[][] = [];
    for (const [fieldLower, after] of Object.entries(filteredChangesByCanonical)) {
      const before = rowIndex !== -1 ? beforeForFieldLower(fieldLower) : "";
      if (before === after) continue;
      changeRows.push([nowIso, ownerKey, submitter, fieldLower, before, after]);
    }

    if (changeRows.length) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Profile-Changes!A:F",
        valueInputOption: "RAW",
        requestBody: { values: changeRows },
      });
    }

    // 2) Upsert Profile-Live row
    const incomingNewSlug = normId(filteredChangesByCanonical["slug"]);
    const existingSlug = rowIndex !== -1 ? normId(currentRow?.[slugIdx]) : "";
    const finalSlug = incomingNewSlug || existingSlug || incomingKey;

    // Slug forward mapping if slug is changing
    if (incomingNewSlug && incomingNewSlug !== existingSlug) {
      const fromSlug = oldKey || existingSlug || incomingKey;
      if (fromSlug && fromSlug !== incomingNewSlug) {
        await ensureSlugsSheetHeader(sheets, spreadsheetId);
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Profile-Slugs!A:C",
          valueInputOption: "RAW",
          requestBody: { values: [[fromSlug, incomingNewSlug, nowIso]] },
        });
      }
    }

    // Decide whether we are about to write/backfill email on Live
    const currentLiveEmail =
      rowIndex !== -1 && emailIdx !== -1
        ? String(currentRow[emailIdx] ?? "").trim()
        : "";
    const willBackfillEmail = emailIdx !== -1 && !currentLiveEmail && !!submitter;

    // Unique-email guard
    if (willBackfillEmail) {
      const dup = checkDuplicateEmailInLive({
        dataRows,
        emailIdx,
        idIdx,
        slugIdx,
        statusIdx,
        isPublicIdx,
        updatedIdx,
        ownerKey,
        candidateEmail: submitter,
      });
      if (dup) return NextResponse.json(dup, { status: 409 });
    }

    if (rowIndex === -1) {
      // Create row (admin-only)
      if (!admin) {
        return NextResponse.json(
          {
            error:
              "Profile not found. New profiles must be seeded by admin (Profile-Live + Profile-Aliases).",
          },
          { status: 404 }
        );
      }

      const newRow: string[] = Array(header.length).fill("");

      for (const [kLower, v] of Object.entries(filteredChangesByCanonical)) {
        const colIdx = headerMap[kLower];
        if (typeof colIdx === "number" && colIdx >= 0) newRow[colIdx] = v;
      }

      newRow[idIdx] = ownerKey;
      newRow[slugIdx] = finalSlug;

      newRow[statusIdx] = "needs_review";
      if (updatedIdx !== -1) newRow[updatedIdx] = nowIso;

      if (emailIdx !== -1 && submitter) newRow[emailIdx] = submitter;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Profile-Live!A${dataRows.length + 2}:ZZ${dataRows.length + 2}`,
        valueInputOption: "RAW",
        requestBody: { values: [newRow] },
      });

      if (submitter) {
        void ensureAlias(sheets, spreadsheetId, submitter, ownerKey).catch(
          () => {}
        );
      }
    } else {
      // Update row
      const absoluteRowNumber = rowIndex + 2;
      const row = [...currentRow].map((x) => String(x ?? "")) as string[];
      while (row.length < header.length) row.push("");

      for (const [kLower, v] of Object.entries(filteredChangesByCanonical)) {
        const colIdx = headerMap[kLower];
        if (typeof colIdx === "number" && colIdx >= 0) row[colIdx] = v;
      }

      row[idIdx] = ownerKey;
      row[slugIdx] = finalSlug;

      row[statusIdx] = "needs_review";
      if (updatedIdx !== -1) row[updatedIdx] = nowIso;

      if (emailIdx !== -1) {
        const curr = String(row[emailIdx] ?? "").trim();
        if (!curr && submitter) row[emailIdx] = submitter;
      }

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Profile-Live!A${absoluteRowNumber}:ZZ${absoluteRowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
    }

    return NextResponse.json({
      ok: true,
      note: note ? String(note) : undefined,

      // client-friendly: return what the client tried to save
      savedFields: acceptedInputKeys,

      // optional debug
      savedFieldsCanonical: Array.from(new Set(acceptedCanonicalKeys)),
      debug: {
        tab: "Profile-Live",
        ownerKey,
        wroteAt: nowIso,
        rowIndex,
        changeRowCount: changeRows.length,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("SAVE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
