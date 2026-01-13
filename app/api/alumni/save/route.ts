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

/** Resolve the alumniId that "owns" an email (Live → Aliases → Changes) */
async function resolveOwnerAlumniId(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  email: string
): Promise<string | ""> {
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
    if (idIdx !== -1) {
      const emailCols: number[] = (H || [])
        .map((h: string, i: number) => ({ h: String(h || "").toLowerCase(), i }))
        .filter(({ h }) => /(email|gmail)/.test(h))
        .map(({ i }) => i);

      for (const r of rows) {
        const candidates = emailCols.map((i) => String(r[i] || "")).filter(Boolean);
        const normed = new Set(candidates.map(normalizeGmail));
        if (normed.has(nEmail)) {
          return normId(r[idIdx]);
        }
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
      const hit = rest.find(([e, aid]) => e && aid && normalizeGmail(String(e)) === nEmail);
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
    const [h, ...rows2] = chgRows;
    const emailIdx = idxOf(h, ["email", "submittedbyemail"]);
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
 * Determine stable owner alumniId for edits.
 * Incoming UI value may be: current slug, old slug, or stable alumniId.
 * We resolve by reading Profile-Live once and matching slug OR alumniId, returning alumniId.
 * If nothing matches, we fall back to the incoming key (only safe if your system allows new rows).
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

  // 1) Match by alumniId (stable)
  const byId = rows.find((r) => normId(r?.[idIdx]) === key);
  if (byId) return normId(byId[idIdx]);

  // 2) Match by slug (current)
  if (slugIdx !== -1) {
    const bySlug = rows.find((r) => normId(r?.[slugIdx]) === key);
    if (bySlug) return normId(bySlug[idIdx]);
  }

  // 3) Unknown: fallback to incoming
  return key;
}

// Do not allow user edits to touch stable ID fields
function isStableIdField(k: string) {
  const kk = k.trim().toLowerCase();
  return kk === "alumniid" || kk === "alumni id" || kk === "id";
}

export async function PUT(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(ip, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      alumniId, // current target slug in UI (may be old slug)
      oldSlug, // optional previous slug when changing (HISTORY ONLY)
      changes,
      submittedByEmail = "",
      note = "",
    } = body || {};

    const targetKey = normId(alumniId);
    const oldKey = normId(oldSlug);

    if (!targetKey || typeof changes !== "object" || changes == null) {
      return NextResponse.json({ error: "alumniId and changes are required" }, { status: 400 });
    }

    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    const sheets = sheetsClient();

    // Read Profile-Live ONCE (we use it for stable id resolution + upsert)
    const liveResp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Live!A:ZZ",
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const rowsAll = (liveResp.data.values ?? []) as any[][];
    if (!rowsAll.length) {
      return NextResponse.json({ error: "Profile-Live has no header row" }, { status: 500 });
    }

    const header = rowsAll[0] ?? [];
    const dataRows = rowsAll.slice(1);

    // Resolve stable alumniId (ownerKey) from either oldSlug or alumniId
    const incomingKey = oldKey || targetKey;
    const ownerKey = resolveStableAlumniIdForEdit({
      header,
      rows: dataRows,
      incoming: incomingKey,
    });

    if (!ownerKey) {
      return NextResponse.json({ error: "Unable to resolve owner alumniId" }, { status: 400 });
    }

    // Owner/Admin guard (non-admins can only edit their own stable alumniId)
    if (auth.email && !isAdmin(auth.email)) {
      const ownerId = await resolveOwnerAlumniId(sheets, spreadsheetId, auth.email);
      if (!ownerId || ownerId !== ownerKey) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const submitter = String(submittedByEmail || auth.email || "");
    const nowIso = new Date().toISOString();

    // 1) Append audit rows to Profile-Changes (field-per-row)
    const changeRows: string[][] = [];
    for (const [field, newValue] of Object.entries(changes as Record<string, unknown>)) {
      changeRows.push([
        ownerKey, // stable alumniId
        field,
        newValue == null ? "" : String(newValue),
        "",
        nowIso,
        submitter,
        "",
        "",
        "",
        note,
      ]);
    }

    if (changeRows.length) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Profile-Changes!A:J",
        valueInputOption: "RAW",
        requestBody: { values: changeRows },
      });
    }

    // 2) Upsert Profile-Live
    const idIdx = idxOf(header, ["alumniid", "alumni id", "id"]);
    const slugIdx = idxOf(header, ["slug"]);
    const statusIdx = idxOf(header, ["status"]);
    const updatedIdx = idxOf(header, ["updatedat", "updated at"]);
    const emailIdx = idxOf(header, ["email"]);
    const lastChangeIdx = idxOf(header, ["lastchangetype"]);

    if (idIdx === -1) throw new Error('Profile-Live missing "alumniId" header');
    if (slugIdx === -1) throw new Error('Profile-Live missing "slug" header');
    if (statusIdx === -1) throw new Error('Profile-Live missing "status" header');

    // case-insensitive header map
    const headerMap: Record<string, number> = {};
    header.forEach((h: any, i: number) => {
      headerMap[String(h ?? "").trim().toLowerCase()] = i;
    });

    // Find row by stable alumniId first
    let rowIndex = dataRows.findIndex((r) => normId(r?.[idIdx]) === ownerKey);

    // Secondary fallback: if not found (rare), try by slug
    if (rowIndex === -1) {
      const bySlug = dataRows.findIndex((r) => normId(r?.[slugIdx]) === targetKey);
      if (bySlug !== -1) rowIndex = bySlug;
    }

    // Determine current slug (for mapping + final slug default)
    const existingSlug =
      rowIndex !== -1 ? normId(dataRows[rowIndex]?.[slugIdx]) : "";

    const incomingNewSlug = normId((changes as any)?.slug || "");
    const finalSlug = incomingNewSlug || existingSlug || targetKey;

    // If slug is changing, write forward mapping oldSlug/currentSlug → newSlug
    if (incomingNewSlug && incomingNewSlug !== existingSlug && incomingNewSlug !== targetKey) {
      const fromSlug = oldKey || existingSlug || targetKey || ownerKey;
      if (fromSlug && fromSlug !== incomingNewSlug) {
        await ensureSlugsSheetHeader(sheets, spreadsheetId);
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: "Profile-Slugs!A:C",
          valueInputOption: "RAW",
          requestBody: { values: [[fromSlug, incomingNewSlug, nowIso]] },
        });
      }
    } else if (incomingNewSlug && incomingNewSlug !== existingSlug) {
      // even if targetKey==incomingNewSlug etc, still safe to map current→new when meaningful
      const fromSlug = oldKey || existingSlug || targetKey || ownerKey;
      if (fromSlug && incomingNewSlug && fromSlug !== incomingNewSlug) {
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
      // CREATE row
      const newRow: string[] = Array(header.length).fill("");

      // stable alumniId is the source of truth and should not change once set
      newRow[idIdx] = ownerKey;
      newRow[slugIdx] = finalSlug;

      // apply incoming changes to columns that exist (case-insensitive)
      for (const [k, v] of Object.entries(changes as Record<string, unknown>)) {
        if (isStableIdField(k)) continue; // ✅ never allow alumniId overwrite
        const colIdx = headerMap[String(k).trim().toLowerCase()];
        if (typeof colIdx === "number" && colIdx >= 0) {
          newRow[colIdx] = String(v ?? "");
        }
      }

      // enforce slug & status
      newRow[slugIdx] = finalSlug;
      newRow[statusIdx] = "needs_review";
      if (updatedIdx !== -1) newRow[updatedIdx] = nowIso;
      if (lastChangeIdx !== -1) newRow[lastChangeIdx] = "profile";

      if (emailIdx !== -1 && submitter) newRow[emailIdx] = submitter;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Profile-Live!A${dataRows.length + 2}:ZZ${dataRows.length + 2}`,
        valueInputOption: "RAW",
        requestBody: { values: [newRow] },
      });
    } else {
      // UPDATE row
      const absoluteRowNumber = rowIndex + 2; // + header row

      const row = [...(dataRows[rowIndex] ?? [])] as string[];
      while (row.length < header.length) row.push("");

      for (const [k, v] of Object.entries(changes as Record<string, unknown>)) {
        if (isStableIdField(k)) continue; // ✅ never allow alumniId overwrite
        const colIdx = headerMap[String(k).trim().toLowerCase()];
        if (typeof colIdx === "number" && colIdx >= 0) {
          row[colIdx] = String(v ?? "");
        }
      }

      // slug can change; alumniId must NOT
      row[idIdx] = ownerKey;
      row[slugIdx] = finalSlug;

      row[statusIdx] = "needs_review";
      if (updatedIdx !== -1) row[updatedIdx] = nowIso;
      if (lastChangeIdx !== -1) row[lastChangeIdx] = "profile";

      // backfill email once (don’t overwrite existing)
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

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("SAVE ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
