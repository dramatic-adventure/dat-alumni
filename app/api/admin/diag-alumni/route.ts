// /app/api/admin/diag-alumni/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Row = Record<string, string>;

/** ---- helpers ---- */
const normalizeKey = (k: string) =>
  k.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, "-");

const isSheetsCsv = (url: string) => {
  try {
    const u = new URL(url);
    if (u.hostname !== "docs.google.com") return false;
    if (!u.pathname.includes("/spreadsheets/")) return false;
    const fmt = (u.searchParams.get("format") || u.searchParams.get("output") || "").toLowerCase();
    return fmt === "csv" || u.pathname.endsWith("/export") || u.pathname.endsWith("/gviz/tq");
  } catch {
    return false;
  }
};

const withCb = (url: string) => {
  try {
    const u = new URL(url);
    u.searchParams.set("_cb", String(Date.now()));
    return u.toString();
  } catch {
    return url;
  }
};

/** Tiny CSV parser that handles quotes, commas, and newlines in quotes. */
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
    for (let c = 0; c < header.length; c++) obj[header[c] || `col-${c}`] = cells[c] ?? "";
    out.push(obj);
  }
  return out;
}

function findFirstKey(row: Row, candidates: string[]) {
  for (const c of candidates) if (c in row) return c;
  return undefined;
}

/** ---- route ---- */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();

    // Prefer ALUMNI_CSV_URL; fall back to Sheet+Tab envs you already have set.
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

    const finalUrl = isSheetsCsv(csvUrl) ? withCb(csvUrl) : csvUrl;

    // No-store fetch so we see the latest published CSV on the server
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(finalUrl, {
      cache: "no-store",
      next: { revalidate: 0 },
      headers: {
        Accept: "text/csv, text/plain; q=0.9, */*; q=0.8",
        Referer: "https://docs.google.com/",
        "Cache-Control": "no-cache, no-store, max-age=0",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `HTTP ${res.status} ${res.statusText}` },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    let text = await res.text();
    if (text.length > 0 && text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM

    const rows = parseCsv(text).map((r) => {
      const n: Row = {};
      for (const [k, v] of Object.entries(r)) n[normalizeKey(k)] = v;
      return n;
    });

    const count = rows.length;

    const slugKeys = ["slug", "profile-slug", "alumni-slug"];
    const nameKeys = ["name", "full-name", "alumni-name"];
    const showKeys = ["show-on-profile", "showonprofile", "visible"];

    const exists =
      !!slug &&
      rows.some((r) => {
        const k = findFirstKey(r, slugKeys);
        const v = k ? (r[k] || "").trim().toLowerCase() : "";
        return !!k && v === slug;
      });

    const sampleRow =
      (slug &&
        rows.find((r) => {
          const k = findFirstKey(r, slugKeys);
          const v = k ? (r[k] || "").trim().toLowerCase() : "";
          return !!k && v === slug;
        })) ||
      rows[0] ||
      undefined;

    const kSlug = sampleRow ? findFirstKey(sampleRow, slugKeys) : undefined;
    const kName = sampleRow ? findFirstKey(sampleRow, nameKeys) : undefined;
    const kShow = sampleRow ? findFirstKey(sampleRow, showKeys) : undefined;

    const sample =
      sampleRow && kSlug
        ? {
            slug: sampleRow[kSlug],
            ...(kName ? { name: sampleRow[kName] } : {}),
            ...(kShow ? { showOnProfile: sampleRow[kShow] } : {}),
          }
        : null;

    return NextResponse.json(
      {
        ok: true,
        count,
        slug: slug || null,
        exists,
        sample,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "X-Data-Source": "alumni-csv",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err || "Unknown error") },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
