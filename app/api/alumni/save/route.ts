// /app/api/alumni/save/route.ts
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAuth } from "@/lib/requireAuth";   // auth guard (no-op if next-auth not installed)
import { rateLimit } from "@/lib/rateLimit";       // tiny in-memory rate limiter

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

/** Resolve the alumniId that "owns" an email, using the same logic as /lookup */
async function resolveOwnerAlumniId(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string,
  email: string
): Promise<string | "" > {
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
    const idIdx = idxOf(H, ["alumniid", "slug", "alumni id"]);
    if (idIdx !== -1) {
      const emailCols: number[] = (H || [])
        .map((h: string, i: number) => ({ h: String(h || "").toLowerCase(), i }))
        .filter(({ h }) => /(email|gmail)/.test(h))
        .map(({ i }) => i);
      if (emailCols.length) {
        for (const r of rows) {
          const candidates = emailCols.map((i) => String(r[i] || "")).filter(Boolean);
          const normed = new Set(candidates.map(normalizeGmail));
          if (normed.has(nEmail)) {
            return String(r[idIdx] || "").trim().toLowerCase();
          }
        }
      }
    }
  }
  // 2) Profile-Aliases
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
      if (hit) return String(hit[1]).trim().toLowerCase();
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
    const slugIdx = idxOf(h, ["alumniid", "slug", "alumni id"]);
    if (emailIdx !== -1 && slugIdx !== -1) {
      for (let i = rows2.length - 1; i >= 0; i--) {
        const r = rows2[i];
        const e = normalizeGmail(String(r[emailIdx] || ""));
        const s = String(r[slugIdx] || "").trim().toLowerCase();
        if (e === nEmail && s) return s;
      }
    }
  }
  return "";
}

/** Admin helper (comma-separated list in env) */
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
    if (vals.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Profile-Slugs!A1:C1",
        valueInputOption: "RAW",
        requestBody: { values: [["fromSlug", "toSlug", "createdAt"]] },
      });
    } else if (vals.length > 0 && (vals[0] || []).length < 3) {
      // normalize header if it's there but short
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Profile-Slugs!A1:C1",
        valueInputOption: "RAW",
        requestBody: { values: [["fromSlug", "toSlug", "createdAt"]] },
      });
    }
  } catch {
    // If sheet/tab missing, let Google create it implicitly by writing header
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Profile-Slugs!A1:C1",
      valueInputOption: "RAW",
      requestBody: { values: [["fromSlug", "toSlug", "createdAt"]] },
    });
  }
}

export async function PUT(req: Request) {
  try {
    // ── Basic rate limit (per IP, 60 req / min)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(ip, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ── Require auth (fills email if using next-auth; otherwise no-op)
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      alumniId,
      changes,                 // e.g., { name, website, slug, ... }
      submittedByEmail = "",
      note = "",
    } = body || {};

    if (!alumniId || typeof changes !== "object") {
      return NextResponse.json(
        { error: "alumniId and changes are required" },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.ALUMNI_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
    }

    // ── Owner/Admin guard ─────────────────────────────────────────────────────
    if (auth.email) {
      const target = String(alumniId).trim().toLowerCase();
      if (!isAdmin(auth.email)) {
        const sheets = sheetsClient();
        const ownerId = await resolveOwnerAlumniId(sheets, spreadsheetId, auth.email);
        if (!ownerId || ownerId !== target) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    // Prefer client-provided email for audit, else the authenticated user's email
    const submitter = String(submittedByEmail || auth.email || "");

    const sheets = sheetsClient();
    const nowIso = new Date().toISOString();

    // ── 1) Append audit rows to Profile-Changes (field-per-row)
    // alumniId | field | newValue | oldValue | submittedAt | submittedByEmail | reviewed | reviewedBy | reviewedAt | note
    const changeRows: string[][] = [];
    for (const [field, newValue] of Object.entries(changes as Record<string, unknown>)) {
      changeRows.push([
        String(alumniId),
        field,
        newValue == null ? "" : String(newValue),
        "",            // oldValue (optional)
        nowIso,        // submittedAt
        submitter,     // submittedByEmail
        "", "", "",    // reviewed, reviewedBy, reviewedAt
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

    // ── 1a) If slug is changing, write a forward mapping (old -> new) ────────
    const incomingNewSlug = String((changes as any)?.slug || "").trim().toLowerCase();
    const oldSlug = String(alumniId).trim().toLowerCase();

    if (incomingNewSlug && incomingNewSlug !== oldSlug) {
      await ensureSlugsSheetHeader(sheets, spreadsheetId);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Profile-Slugs!A:C",
        valueInputOption: "RAW",
        requestBody: {
          values: [[oldSlug, incomingNewSlug, nowIso]],
        },
      });
    }

    // ── 2) Touch Profile-Live row: status=pending, updatedAt, lastChangeType="text"
    const live = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Live!A:ZZ",
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const rows = live.data.values ?? [];
    if (!rows.length) {
      return NextResponse.json({ error: "Profile-Live has no header row" }, { status: 500 });
    }

    const header = rows[0] ?? [];
    const idIdx         = idxOf(header, ["alumniid", "slug", "alumni id"]);
    const slugIdx       = idxOf(header, ["slug"]);
    const statusIdx     = idxOf(header, ["status"]);
    const updatedIdx    = idxOf(header, ["updatedat", "updated at"]);
    const emailIdx      = idxOf(header, ["email"]);
    const lastChangeIdx = idxOf(header, ["lastchangetype"]);

    if (idIdx === -1 && slugIdx === -1) {
      throw new Error('Profile-Live missing "alumniId"/"slug" header');
    }
    if (statusIdx === -1) {
      throw new Error('Profile-Live missing "status" header');
    }

    // exact header name -> index (preserve original casing)
    const headerMap: Record<string, number> = {};
    header.forEach((h, i) => (headerMap[String(h)] = i));

    // find row by alumniId (preferred) or slug fallback
    const needle = String(alumniId).trim().toLowerCase();
    let rowIndex = -1;
    if (idIdx !== -1) {
      rowIndex = rows.findIndex((r, i) => i > 0 && String(r[idIdx] ?? "").trim().toLowerCase() === needle);
    }
    if (rowIndex === -1 && slugIdx !== -1) {
      rowIndex = rows.findIndex((r, i) => i > 0 && String(r[slugIdx] ?? "").trim().toLowerCase() === needle);
    }

    if (rowIndex === -1) {
      // ── CREATE new row
      rowIndex = rows.length;
      const newRow: string[] = Array(header.length).fill("");

      if (idIdx   !== -1) newRow[idIdx] = alumniId;
      if (slugIdx !== -1) newRow[slugIdx] = incomingNewSlug || alumniId;

      for (const [k, v] of Object.entries(changes as Record<string, unknown>)) {
        const colIdx = headerMap[k];
        if (typeof colIdx === "number" && colIdx >= 0) {
          newRow[colIdx] = String(v ?? "");
        }
      }

      newRow[statusIdx] = "pending";
      if (updatedIdx    !== -1) newRow[updatedIdx]    = nowIso;
      if (lastChangeIdx !== -1) newRow[lastChangeIdx] = "text";
      if (emailIdx      !== -1 && submitter) newRow[emailIdx] = submitter;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Profile-Live!A${rowIndex + 1}:ZZ${rowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: [newRow] },
      });
    } else {
      // ── UPDATE existing row
      const row = [...(rows[rowIndex] ?? [])];
      if (row.length < header.length) row.length = header.length;

      for (const [k, v] of Object.entries(changes as Record<string, unknown>)) {
        const colIdx = headerMap[k];
        if (typeof colIdx === "number" && colIdx >= 0) {
          row[colIdx] = String(v ?? "");
        }
      }

      // Keep slug column consistent if present
      if (slugIdx !== -1 && incomingNewSlug) {
        row[slugIdx] = incomingNewSlug;
      }

      row[statusIdx] = "pending";
      if (updatedIdx    !== -1) row[updatedIdx]    = nowIso;
      if (lastChangeIdx !== -1) row[lastChangeIdx] = "text";

      if (emailIdx !== -1) {
        const curr = String(row[emailIdx] ?? "").trim();
        if (!curr && submitter) row[emailIdx] = submitter;
      }

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Profile-Live!A${rowIndex + 1}:ZZ${rowIndex + 1}`,
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
