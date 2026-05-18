// app/api/debug/opportunities-source/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Diagnostic-only route: shows whether /opportunities is reading live Google
// Sheet data or falling back to data/opportunities.json.
//
// Access guard:
//   - Development (NODE_ENV !== "production"): open, no token required.
//   - Production: requires ?token=<DEBUG_TOKEN> (set DEBUG_TOKEN in Netlify env).
//     If DEBUG_TOKEN is not set in production the route returns 404 and is
//     effectively disabled.
//
// Safety guarantees:
//   - Read-only: no data is written or mutated.
//   - No secrets exposed: ALUMNI_SHEET_ID, private keys, and SA JSON are never
//     returned. Error messages are sanitised to strip any credential material.
// ─────────────────────────────────────────────────────────────────────────────

import "server-only";
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { csvRowsToSeed, getOpportunitiesSync, normalize } from "@/lib/opportunities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHEET_TAB = "Opportunities";
const RANGE = `${SHEET_TAB}!A1:AA`;

/** Strip private-key PEM blocks and long base64 blobs from error messages. */
function sanitizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "Unknown error");
  return raw
    .replace(/-----BEGIN[\s\S]*?-----END[^-]*-----/g, "[REDACTED_KEY]")
    .replace(/[A-Za-z0-9+/]{80,}={0,2}/g, "[REDACTED_BLOB]")
    .slice(0, 500);
}

export async function GET(req: Request) {
  // ── Auth guard ────────────────────────────────────────────────────────────
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    const debugToken = String(process.env.DEBUG_TOKEN ?? "").trim();
    if (!debugToken) {
      // DEBUG_TOKEN not configured → disable entirely in production.
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }
    const { searchParams } = new URL(req.url);
    const provided = String(searchParams.get("token") ?? "").trim();
    if (!provided || provided !== debugToken) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }
  }

  // ── Fallback data (always available, never throws) ────────────────────────
  const fallbackOpportunities = getOpportunitiesSync();
  const fallbackOpportunityCount = fallbackOpportunities.length;
  const fallbackFirstFiveIds = fallbackOpportunities.slice(0, 5).map((o) => o.id);

  // ── Live Sheets fetch ─────────────────────────────────────────────────────
  const hasAlumniSheetId = Boolean(String(process.env.ALUMNI_SHEET_ID ?? "").trim());
  const spreadsheetId = String(process.env.ALUMNI_SHEET_ID ?? "").trim();

  let sheetsRowCount: number | null = null;
  let sheetsHeaderRow: string[] | null = null;
  let sheetsOpportunityCount: number | null = null;
  let sheetsFirstFiveIds: string[] | null = null;
  let sheetsError: string | null = null;
  let wouldUseFallback = true;

  if (!hasAlumniSheetId) {
    sheetsError = "ALUMNI_SHEET_ID is not set — Sheets API fetch skipped";
  } else {
    try {
      const sheets = sheetsClient();
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: RANGE,
        valueRenderOption: "FORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });

      const rows = (res.data.values ?? []) as string[][];
      sheetsRowCount = rows.length;
      sheetsHeaderRow = rows[0] ?? null;

      if (rows.length >= 2) {
        const seeds = csvRowsToSeed(rows);
        const normalized = seeds.map(normalize).filter((o) => o.id && o.title);
        sheetsOpportunityCount = normalized.length;
        sheetsFirstFiveIds = normalized.slice(0, 5).map((o) => o.id);
        if (normalized.length > 0) {
          wouldUseFallback = false;
        } else {
          sheetsError =
            "Rows were returned but 0 passed normalization (missing id/title columns?)";
        }
      } else {
        sheetsError =
          rows.length === 0
            ? "Sheet returned 0 rows — Opportunities tab may be missing or empty"
            : "Sheet returned only 1 row (header only) — no data rows present";
      }
    } catch (err) {
      sheetsError = sanitizeError(err);
    }
  }

  return NextResponse.json(
    {
      ok: true,
      // ── Sheet env ──────────────────────────────────────────────────────────
      hasAlumniSheetId,
      // ── Live Sheets result ─────────────────────────────────────────────────
      attemptedRange: RANGE,
      sheetsRowCount,
      sheetsHeaderRow,
      sheetsOpportunityCount,
      sheetsFirstFiveIds,
      sheetsError,
      // ── Decision ──────────────────────────────────────────────────────────
      wouldUseFallback,
      // ── Fallback snapshot ─────────────────────────────────────────────────
      fallbackOpportunityCount,
      fallbackFirstFiveIds,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Data-Source": "debug-opportunities-source",
      },
    }
  );
}
