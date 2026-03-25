// app/api/healthz/route.ts
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";

export const runtime = "nodejs";
// make sure this never gets prerendered/cached
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Minimal, non-leaky health check.
 * Verifies:
 *  - ALUMNI_SHEET_ID exists
 *  - GCP_SA_JSON exists (boolean only)
 *  - Service Account can read a single-cell range from Profile-Live
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
    const hasSA = Boolean(process.env.GCP_SA_JSON);

    if (!spreadsheetId) {
      return NextResponse.json(
        { ok: false, error: "Missing ALUMNI_SHEET_ID" },
        { status: 500 }
      );
    }
    if (!hasSA) {
      return NextResponse.json(
        { ok: false, error: "Missing GCP_SA_JSON" },
        { status: 500 }
      );
    }

    const sheets = sheetsClient();

    // Tiny probe — header cell only (cheap & safe).
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Profile-Live!A1:A1",
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const headerCell = String(resp.data.values?.[0]?.[0] ?? "");
    const at = new Date().toISOString();

    // Mask the sheet id in the response (no secret leakage)
    const maskedId =
      spreadsheetId.length > 8
        ? `${spreadsheetId.slice(0, 4)}…${spreadsheetId.slice(-4)}`
        : "****";

    return NextResponse.json({
      ok: true,
      at,
      env: {
        ALUMNI_SHEET_ID: true,
        GCP_SA_JSON: true,
      },
      sheet: {
        id: maskedId,
        reachable: true,
        headerCellKnown: headerCell.length > 0, // just a light hint
      },
    });
  } catch (e: any) {
    // Don't include env values or stack traces
    const msg = String(e?.message || "health check failed");
    console.error("HEALTHZ ERROR:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
