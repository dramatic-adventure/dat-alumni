import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAdmin } from "@/lib/requireAuth";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** case-insensitive header lookup */
function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(String(c).trim().toLowerCase());
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

function looksLikeEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function ensureOwnersHeader(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string
) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Owners!A:ZZ",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const vals = res.data.values ?? [];
    if (!vals.length) throw new Error("missing header");
  } catch {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Profile-Owners!A1:C1",
      valueInputOption: "RAW",
      requestBody: { values: [["alumniId", "ownerEmail", "updatedAt"]] },
    });
  }
}

export async function POST(req: Request) {
  // basic rate limit (prevents brute forcing this endpoint even for admins)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }

  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.response;

  const body = await req.json().catch(() => ({}));

  const alumniId = normId(body?.alumniId);
  const ownerEmail = normalizeGmail(body?.ownerEmail);
  const force = body?.force === true;

  if (!alumniId || !ownerEmail) {
    return NextResponse.json(
      { ok: false, error: "alumniId and ownerEmail are required" },
      { status: 400 }
    );
  }

  if (!looksLikeEmail(ownerEmail)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const spreadsheetId = process.env.ALUMNI_SHEET_ID;
  if (!spreadsheetId) {
    return NextResponse.json(
      { ok: false, error: "Missing ALUMNI_SHEET_ID" },
      { status: 500 }
    );
  }

  const sheets = sheetsClient();
  await ensureOwnersHeader(sheets, spreadsheetId);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Profile-Owners!A:ZZ",
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const rows = (res.data.values ?? []) as any[][];
  if (!rows.length) {
    return NextResponse.json(
      { ok: false, error: "Profile-Owners missing header row" },
      { status: 500 }
    );
  }

  const header = (rows[0] ?? []) as string[];
  const dataRows = rows.slice(1);

  const idIdx = idxOf(header, ["alumniid", "alumni id", "id"]);
  const emailIdx = idxOf(header, ["owneremail", "owner email"]);
  const updatedIdx = idxOf(header, ["updatedat", "updated at"]);

  if (idIdx === -1 || emailIdx === -1) {
    return NextResponse.json(
      { ok: false, error: "Profile-Owners must include alumniId and ownerEmail columns" },
      { status: 500 }
    );
  }

  const nowIso = new Date().toISOString();

  // Guard 1: prevent one email from owning multiple alumniIds
  const emailMatch = dataRows.find((r) => normalizeGmail(r?.[emailIdx]) === ownerEmail);
  if (emailMatch) {
    const existingOwner = normId(emailMatch?.[idIdx]);
    if (existingOwner && existingOwner !== alumniId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email already mapped to a different alumniId",
          email: ownerEmail,
          existingAlumniId: existingOwner,
        },
        { status: 409 }
      );
    }
  }

  // Guard 2: prevent changing an existing alumniId’s ownerEmail unless force=true
  const rowIndex = dataRows.findIndex((r) => normId(r?.[idIdx]) === alumniId);
  if (rowIndex !== -1) {
    const existingEmail = normalizeGmail(dataRows[rowIndex]?.[emailIdx]);
    if (existingEmail && existingEmail !== ownerEmail && !force) {
      return NextResponse.json(
        {
          ok: false,
          error: "alumniId already has a different ownerEmail (use force=true to replace)",
          alumniId,
          existingOwnerEmail: existingEmail,
          requestedOwnerEmail: ownerEmail,
        },
        { status: 409 }
      );
    }
  }

  if (rowIndex === -1) {
    const newRow: string[] = Array(header.length).fill("");
    newRow[idIdx] = alumniId;
    newRow[emailIdx] = ownerEmail;
    if (updatedIdx !== -1) newRow[updatedIdx] = nowIso;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Profile-Owners!A:ZZ",
      valueInputOption: "RAW",
      requestBody: { values: [newRow] },
    });
  } else {
    const abs = rowIndex + 2; // + header
    const row = [...dataRows[rowIndex]].map((x) => String(x ?? ""));
    while (row.length < header.length) row.push("");

    row[idIdx] = alumniId;
    row[emailIdx] = ownerEmail;
    if (updatedIdx !== -1) row[updatedIdx] = nowIso;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Profile-Owners!A${abs}:ZZ${abs}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  }

  return NextResponse.json({ ok: true, alumniId, ownerEmail, updatedAt: nowIso });
}