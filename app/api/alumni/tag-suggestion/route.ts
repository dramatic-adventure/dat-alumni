// /app/api/alumni/tag-suggestion/route.ts
//
// Collects alumni-submitted "Request a new tag" proposals.
// Writes to the `TagSuggestions` Sheet tab; never auto-publishes.
// Admins promote accepted suggestions into lib/alumniTaxonomy.ts manually.

import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAuth } from "@/lib/requireAuth";
import { rateLimit } from "@/lib/rateLimit";
import { findTagByLabelOrAlias } from "@/lib/alumniTaxonomy";

export const runtime = "nodejs";

const VALID_LAYERS = new Set(["identity", "practice", "exploreCare"]);
const SHEET_TAB = "TagSuggestions";
const HEADER_ROW = [
  "timestamp",
  "layer",
  "label",
  "rationale",
  "requesterEmail",
  "requesterSlug",
  "status",
];

async function ensureHeader(
  sheets: ReturnType<typeof sheetsClient>,
  spreadsheetId: string
): Promise<"ok" | "missing-tab"> {
  // Step 1: confirm the tab exists. Only this GET should classify as "missing-tab".
  let row: unknown[] = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_TAB}!A1:G1`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    row = (res.data.values ?? [])[0] ?? [];
  } catch (err: any) {
    // Google returns 400 "Unable to parse range" when the tab doesn't exist.
    const msg = String(err?.message ?? err ?? "");
    if (/Unable to parse range/i.test(msg) || err?.code === 400) {
      return "missing-tab";
    }
    throw err;
  }

  // Step 2: tab exists — write header if missing. Errors here are real errors, not missing-tab.
  if (row.length < HEADER_ROW.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_TAB}!A1:G1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADER_ROW] },
    });
  }
  return "ok";
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    if (!rateLimit(ip, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    const layer = String(body?.layer ?? "").trim();
    const label = String(body?.label ?? "").trim();
    const rationale = String(body?.rationale ?? "").trim().slice(0, 1000);
    const slug = String(body?.slug ?? "").trim().toLowerCase();

    if (!VALID_LAYERS.has(layer)) {
      return NextResponse.json({ error: "Invalid layer" }, { status: 400 });
    }
    if (!label) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }
    if (label.length > 120) {
      return NextResponse.json({ error: "Label too long" }, { status: 400 });
    }

    // If the proposed label already matches a canonical tag or alias, there's
    // nothing to suggest — tell the client so they can surface it in the UI.
    const alreadyCanonical = findTagByLabelOrAlias(label, layer as any);
    if (alreadyCanonical) {
      return NextResponse.json(
        {
          ok: true,
          alreadyCanonical: true,
          label: alreadyCanonical.label,
          layer: alreadyCanonical.layer,
        },
        { status: 200 }
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
    const headerState = await ensureHeader(sheets, spreadsheetId);
    if (headerState === "missing-tab") {
      // Graceful: don't 500 if the admin hasn't created the tab yet.
      return NextResponse.json(
        {
          ok: false,
          queued: false,
          note:
            "TagSuggestions tab not yet provisioned — suggestion not persisted. Please ask an admin to add the tab.",
        },
        { status: 202 }
      );
    }

    const nowIso = new Date().toISOString();
    const requesterEmail = String(auth.email || "").trim();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_TAB}!A:G`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            nowIso,
            layer,
            label,
            rationale,
            requesterEmail,
            slug,
            "pending",
          ],
        ],
      },
    });

    return NextResponse.json({ ok: true, queued: true }, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("TAG SUGGESTION ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
