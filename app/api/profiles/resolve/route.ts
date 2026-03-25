// /app/api/profiles/resolve/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Row = Record<string, string>;

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function normalizeKey(k: string) {
  return k
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-");
}

function normSlug(s: string) {
  return (s || "").trim().toLowerCase();
}

function withCb(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("_cb", String(Date.now()));
    return u.toString();
  } catch {
    return url;
  }
}

function parseAdminEmails() {
  return new Set(
    String(process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function requireAdmin() {
  try {
    const session = await auth();
    const email = String(session?.user?.email || "").trim().toLowerCase();
    if (!email) return false;

    const allow = parseAdminEmails();
    return allow.size ? allow.has(email) : false;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------
// CSV parsing (minimal, robust)
// ------------------------------------------------------------
function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (ch !== "\r") {
        cell += ch;
      }
    }
  }

  row.push(cell);
  rows.push(row);

  if (!rows.length) return [];

  const header = rows[0].map(normalizeKey);
  const out: Row[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells || cells.every((c) => c === "")) continue;

    const obj: Row = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c] || `col-${c}`] = cells[c] ?? "";
    }
    out.push(obj);
  }

  return out;
}

// ------------------------------------------------------------
// Route
// ------------------------------------------------------------
export async function GET(req: Request) {
  // 🔒 ADMIN ONLY
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { searchParams } = new URL(req.url);
  const slug = normSlug(searchParams.get("slug") || "");

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "slug required" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const csvUrl =
    process.env.ALUMNI_CSV_URL ||
    (process.env.ALUMNI_SHEET_ID &&
      `https://docs.google.com/spreadsheets/d/${process.env.ALUMNI_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(
        process.env.ALUMNI_TAB || "Profile-Data"
      )}`) ||
    "";

  if (!csvUrl) {
    return NextResponse.json(
      { ok: false, error: "ALUMNI_CSV_URL not configured" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const res = await fetch(withCb(csvUrl), { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: `HTTP ${res.status}` },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  let text = await res.text().catch(() => "");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM

  const rows = parseCsv(text);

  const slugKeys = ["slug", "profile-slug", "alumni-slug"];
  const idKeys = ["alumniid", "alumni-id", "profile-id", "id", "profileid"];

  const hit = rows.find((r) => {
    const normalized = Object.keys(r).reduce<Record<string, string>>((acc, k) => {
      acc[normalizeKey(k)] = r[k];
      return acc;
    }, {});

    const rowSlug =
      slugKeys.map((k) => (normalized[k] || "").trim().toLowerCase()).find(Boolean) || "";

    return rowSlug === slug;
  });

  if (!hit) {
    return NextResponse.json(
      { ok: true, alumniId: "" },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const normalized = Object.keys(hit).reduce<Record<string, string>>((acc, k) => {
    acc[normalizeKey(k)] = hit[k];
    return acc;
  }, {});

  const alumniId =
    idKeys.map((k) => (normalized[k] || "").trim()).find(Boolean) || "";

  return NextResponse.json(
    { ok: true, alumniId },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
