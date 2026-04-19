// /app/api/alumni/save/route.ts
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAuth } from "@/lib/requireAuth";
import { rateLimit } from "@/lib/rateLimit";
import { getAlumniIdForOwnerEmail } from "@/lib/ownership";

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

function isStableIdField(k: string) {
  const kk = k.trim().toLowerCase();
  return kk === "alumniid" || kk === "alumni id" || kk === "id";
}

function isServerControlledField(k: string) {
  const kk = k.trim().toLowerCase();
  return kk === "updatedat" || kk === "updated at";
}

/**
 * Admin-only fields.
 *
 * Keys here are compared against the CANONICAL form produced by canonKey()
 * (lowercased, separators removed), so variants like "bio short" / "bio_short"
 * all collapse to the canonical key.
 *
 * - ispublic / status: publish/workflow flags
 * - bioshort, spotlight, programs, tags, statusflags: curation fields — alumni
 *   must not edit these from the Profile Studio.
 */
const ADMIN_ONLY_CANONICAL_KEYS = new Set<string>([
  "ispublic",
  "status",
  "bioshort",
  "spotlight",
  "programs",
  "tags",
  "statusflags",
]);

function isAdminOnlyField(k: string) {
  const kk = k.trim().toLowerCase().replace(/[\s_-]+/g, "");
  // legacy explicit checks preserved for non-canonicalized callers
  if (kk === "ispublic" || kk === "status") return true;
  return ADMIN_ONLY_CANONICAL_KEYS.has(kk);
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

  // Primary social (defensive identity + short form)
  primarysocial: "primarysocial",
  "primary social": "primarysocial",
  primary: "primarysocial",

  // Show-on-map: confirmed against live sheet — header is `storyShowOnMap`
  // (single prefix). Legacy `showOnMap` (no `story` prefix) aliased for safety.
  storyshowonmap: "storyshowonmap",
  showonmap: "storyshowonmap",
  "show on map": "storyshowonmap",

  // Title vs Work — Profile-Live has BOTH `currentTitle` (role/title) and
  // `currentWork` (what they're working on now). Legacy `currentRole` maps
  // to `currentTitle`.
  currenttitle: "currenttitle",
  "current title": "currenttitle",
  currentrole: "currenttitle",
  "current role": "currenttitle",
  currentwork: "currentwork",
  "current work": "currentwork",

  // Roles — `roles` is canonical; `datRoles` is legacy
  roles: "roles",
  datroles: "roles",
  "dat roles": "roles",

  // Story key — sheet header is `activeStoryKey`; code/UI uses `storyKey`.
  // Both canonicalize to `activestorykey` so the save route maps correctly.
  storykey: "activestorykey",
  "story key": "activestorykey",
  activestorykey: "activestorykey",
  "active story key": "activestorykey",

  // Media IDs (sheet headers are camelCase)
  currentheadshotid: "currentheadshotid",
  featuredalbumid: "featuredalbumid",
  featuredreelid: "featuredreelid",
  featuredeventid: "featuredeventid",

  // Newsletter link
  newsletter: "newsletter",

  // Visibility toggles
  showwebsite: "showwebsite",
  "show website": "showwebsite",
  showpublicemail: "showpublicemail",
  "show public email": "showpublicemail",
};

function canonKey(rawKey: string) {
  const raw = String(rawKey || "").trim();
  if (!raw) return "";

  const kLower = raw.toLowerCase();

  // 1) exact alias
  if (FIELD_ALIASES[kLower]) return FIELD_ALIASES[kLower];

  // 2) smash separators
  const smashed = kLower.replace(/[\s_-]+/g, "");
  if (FIELD_ALIASES[smashed]) return FIELD_ALIASES[smashed];

  // 3) default: return smashed (NOT just lowercased)
  // This makes "bio_long" => "biolong", matching your headerMap keys.
  return smashed;
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

    // map Profile-Live header -> col idx (canonical)
    const headerMap: Record<string, number> = {};
    header.forEach((h: any, i: number) => {
      const raw = String(h ?? "").trim();
      if (!raw) return;

      const kCanon = canonKey(raw);
      if (!kCanon) return;

      // If multiple headers collapse to same canonical key, keep the first
      // (you can flip this to "last wins" if you prefer).
      if (typeof headerMap[kCanon] !== "number") headerMap[kCanon] = i;
    });


    const idIdx = idxOf(header as string[], ["alumniid", "alumni id", "id"]);
    const slugIdx = idxOf(header as string[], ["slug"]);
    const statusIdx = idxOf(header as string[], ["status"]);
    const updatedIdx = idxOf(header as string[], ["updatedat", "updated at"]);

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

    // ✅ Canonical ownership check (matches /api/alumni/update and /undo):
    //    Non-admins may only edit the profile their signed-in email owns.
    //    `getAlumniIdForOwnerEmail` reads Profile-Owners then Profile-Aliases
    //    (legacy read-only fallback) — same shape as the deprecated inline
    //    copy that used to live here.
    if (!admin) {
      const ownedId = await getAlumniIdForOwnerEmail(
        spreadsheetId,
        auth.email || ""
      );
      if (!ownedId || normId(ownedId) !== normId(ownerKey)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Editor identity (audit only)
    const editorEmail = String(submittedByEmail || auth.email || "").trim();
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

    const beforeForCanonKey = (fieldCanon: string): string => {
      const colIdx = headerMap[fieldCanon];
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

    const dropped: { inputKey: string; canon: string; reason: string }[] = [];

    for (const [rawKey, rawVal] of Object.entries(
      changes as Record<string, unknown>
    )) {
      const inputKey = String(rawKey || "").trim();
      if (!inputKey) continue;

      const kCanon = canonKey(inputKey);
      if (!kCanon) {
        dropped.push({ inputKey, canon: "", reason: "canon_empty" });
        continue;
      }

      if (isStableIdField(kCanon)) {
        dropped.push({ inputKey, canon: kCanon, reason: "stable_id_field" });
        continue;
      }

      if (isServerControlledField(kCanon)) {
        dropped.push({ inputKey, canon: kCanon, reason: "server_controlled" });
        continue;
      }

      if (isAdminOnlyField(kCanon) && !admin) {
        dropped.push({ inputKey, canon: kCanon, reason: "admin_only" });
        continue;
      }

      const colIdx = headerMap[kCanon];
      if (typeof colIdx !== "number" || colIdx < 0) {
        dropped.push({ inputKey, canon: kCanon, reason: "no_column_match" });
        continue;
      }

      filteredChangesByCanonical[kCanon] = rawVal == null ? "" : String(rawVal);
      acceptedInputKeys.push(inputKey);
      acceptedCanonicalKeys.push(kCanon);
    }

    // ✅ Login identity is NOT stored in Profile-Live.email.
    // Public contact is Profile-Live.publicEmail.
    // Therefore: never auto-write Profile-Live.email here.

    if (!Object.keys(filteredChangesByCanonical).length) {
      return NextResponse.json(
        {
          ok: true,
          note: "No-op (no valid fields)",
          savedFields: [],
          debug:
            process.env.NODE_ENV === "development"
              ? { dropped }
              : undefined,
        },
        { status: 200 }
      );
    }


    // 1) Append audit rows to Profile-Changes (ts, alumniId, email, field, before, after)
    const changeRows: string[][] = [];
    for (const [fieldCanon, after] of Object.entries(filteredChangesByCanonical)) {
      const before = rowIndex !== -1 ? beforeForCanonKey(fieldCanon) : "";
      if (before === after) continue;
      changeRows.push([nowIso, ownerKey, editorEmail, fieldCanon, before, after]);
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


    if (rowIndex === -1) {
      // Create row (admin-only)
      if (!admin) {
        return NextResponse.json(
          {
            error:
              "Profile not found. New profiles must be seeded by admin (Profile-Live + Profile-Owners).",
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

      // NOTE: `status = "needs_review"` is an INTERNAL “recent changes” flag for admins.
      // It is NOT a publish gate. Public visibility is controlled by `isPublic` only.
      // Do not block/withhold public updates based on `status`.

      newRow[statusIdx] = "needs_review";
      if (updatedIdx !== -1) newRow[updatedIdx] = nowIso;

      // ✅ Do not write Profile-Live.email (ownership is Profile-Owners; public contact is publicEmail)

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Profile-Live!A${dataRows.length + 2}:ZZ${dataRows.length + 2}`,
        valueInputOption: "RAW",
        requestBody: { values: [newRow] },
      });

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

      // NOTE: `status = "needs_review"` is an INTERNAL “recent changes” flag for admins.
      // It is NOT a publish gate. Public visibility is controlled by `isPublic` only.
      // Do not block/withhold public updates based on `status`.

      row[statusIdx] = "needs_review";
      if (updatedIdx !== -1) row[updatedIdx] = nowIso;

      // ✅ Do not write Profile-Live.email (ownership is Profile-Owners; public contact is publicEmail)

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
      debug:
        process.env.NODE_ENV === "development"
          ? {
              tab: "Profile-Live",
              ownerKey,
              wroteAt: nowIso,
              rowIndex,
              changeRowCount: changeRows.length,
              dropped, // optional: super helpful while you’re stabilizing field mapping
            }
          : undefined,

    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("SAVE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
