// scripts/setup-field-kit-slice5-tabs.ts
//
// One-time admin script (Slice 5): creates the five Field Ops & Library tabs in
// the alumni spreadsheet (ALUMNI_SHEET_ID), each with its canonical header row:
//
//   Field Kit Roll Call               id | programId | dayId | label | openedAt | closedAt
//   Field Kit Roll Call Responses     rollCallId | alumniSlug | status | respondedAt
//   Field Kit Company Choice          id | programId | question | choices | deadline |
//                                     resultsVisibility | outcome | postedAt | closedAt
//   Field Kit Company Choice Votes    choiceSetId | alumniSlug | selection | votedAt
//   Field Kit Resources               id | programId | dayId | title | type | url | tags
//
// IDEMPOTENT: an existing tab is left untouched (only a missing header row is
// written); safe to re-run. Run with:
//
//     npm run setup:field-kit-slice5-tabs
//
// Requires ALUMNI_SHEET_ID + GCP service-account credentials (GCP_SA_JSON_BASE64,
// GCP_SA_JSON, or GCP_SA_EMAIL/GCP_SA_PRIVATE_KEY) in the environment or
// .env.local — same resolution order as lib/googleClients.ts, mirrored here
// because that module is "server-only" and can't load in a plain tsx process.

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") }); // optional fallback

import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";

const SHEET_ID = process.env.ALUMNI_SHEET_ID || "";

const TABS: { title: string; headers: string[] }[] = [
  {
    // Slice 3's tab, included here because a 2026-07-02 audit of the live sheet
    // found it missing entirely (its reads fail resilient-null and admin
    // setRallyPoint would throw). Idempotent like the rest — a no-op wherever
    // it already exists.
    title: "Field Kit Rally Point",
    headers: ["programId", "location", "lookFor", "meetTime", "departure", "updatedAt"],
  },
  {
    title: "Field Kit Roll Call",
    headers: ["id", "programId", "dayId", "label", "openedAt", "closedAt"],
  },
  {
    title: "Field Kit Roll Call Responses",
    headers: ["rollCallId", "alumniSlug", "status", "respondedAt"],
  },
  {
    title: "Field Kit Company Choice",
    headers: [
      "id", "programId", "question", "choices", "deadline",
      "resultsVisibility", "outcome", "postedAt", "closedAt",
    ],
  },
  {
    title: "Field Kit Company Choice Votes",
    headers: ["choiceSetId", "alumniSlug", "selection", "votedAt"],
  },
  {
    title: "Field Kit Resources",
    headers: ["id", "programId", "dayId", "title", "type", "url", "tags"],
  },
];

function die(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function normalizePrivateKey(raw: string): string {
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

/** Mirror lib/googleClients.ts credential resolution (base64 → JSON → split vars). */
function resolveServiceAccount(): { client_email: string; private_key: string } {
  const b64 = process.env.GCP_SA_JSON_BASE64;
  if (b64) {
    const parsed = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return { client_email: parsed.client_email, private_key: normalizePrivateKey(parsed.private_key) };
  }
  const json = process.env.GCP_SA_JSON;
  if (json) {
    let parsed: { client_email: string; private_key: string };
    try {
      parsed = JSON.parse(json);
    } catch {
      parsed = JSON.parse(json.replace(/\\n/g, "\n"));
    }
    return { client_email: parsed.client_email, private_key: normalizePrivateKey(parsed.private_key) };
  }
  const email = process.env.GCP_SA_EMAIL;
  const key = process.env.GCP_SA_PRIVATE_KEY;
  if (email && key) return { client_email: email, private_key: normalizePrivateKey(key) };
  die("No GCP service-account credentials found (GCP_SA_JSON_BASE64 / GCP_SA_JSON / GCP_SA_EMAIL+GCP_SA_PRIVATE_KEY)");
}

async function main() {
  if (!SHEET_ID) die("Missing env ALUMNI_SHEET_ID");
  const sa = resolveServiceAccount();

  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets(properties(title))",
  });
  const existing = new Set(
    (meta.data.sheets ?? []).map((s: sheets_v4.Schema$Sheet) => s.properties?.title ?? "")
  );

  for (const tab of TABS) {
    if (!existing.has(tab.title)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: tab.title } } }] },
      });
      console.log(`✓ created tab "${tab.title}"`);
    } else {
      console.log(`• tab "${tab.title}" already exists`);
    }

    // Write the header row only when row 1 is empty — never clobber real data.
    const head = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${tab.title}'!1:1`,
    });
    const row1 = (head.data.values?.[0] ?? []).map((c: unknown) => String(c ?? "").trim());
    if (row1.filter(Boolean).length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `'${tab.title}'!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [tab.headers] },
      });
      console.log(`  ✓ wrote header row (${tab.headers.join(", ")})`);
    } else {
      console.log(`  • header row already present (${row1.filter(Boolean).join(", ")})`);
    }
  }

  console.log("\nDone. All five Slice 5 tabs are ready.");
}

main().catch((e) => die(e instanceof Error ? e.message : String(e)));
