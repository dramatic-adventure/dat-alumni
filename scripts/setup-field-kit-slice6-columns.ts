// scripts/setup-field-kit-slice6-columns.ts
//
// One-time admin script (Slice 6 — Composer/Publish/Retroactive): appends the
// new HEADER COLUMNS this slice adds to two EXISTING tabs in the alumni
// spreadsheet (ALUMNI_SHEET_ID). Unlike the slice-5 script it never creates
// tabs — both tabs already carry live data — it only extends row 1:
//
//   Field-Captures   + chapterId | visibility     (Trace unification, §4-R Q2/Q3)
//   Journey Cards    + chaptersJson               (structured chapters, §4-R Q1)
//
// IDEMPOTENT: a column whose header already exists (matched case-insensitively)
// is left untouched; missing ones are appended AFTER the last existing header so
// no data column ever shifts. Safe to re-run. Run with:
//
//     npm run setup:field-kit-slice6-columns
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

const SHEET_ID = process.env.ALUMNI_SHEET_ID || "";

const COLUMN_ADDITIONS: { tab: string; headers: string[] }[] = [
  { tab: "Field-Captures", headers: ["chapterId", "visibility"] },
  { tab: "Journey Cards", headers: ["chaptersJson"] },
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

/** A1 column letter for a 0-based index (0 → A, 25 → Z, 26 → AA). */
function colLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
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

  for (const { tab, headers } of COLUMN_ADDITIONS) {
    let row1: string[];
    try {
      const head = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${tab}'!1:1`,
      });
      row1 = (head.data.values?.[0] ?? []).map((c: unknown) => String(c ?? "").trim());
    } catch (e) {
      console.error(`✗ tab "${tab}" is unreadable — does it exist? (${e instanceof Error ? e.message : e})`);
      continue;
    }
    if (row1.filter(Boolean).length === 0) {
      // This script extends live tabs; an empty tab means the earlier slice's
      // setup hasn't run — refuse rather than write a partial header.
      console.error(`✗ tab "${tab}" has no header row — run the earlier setup scripts first`);
      continue;
    }

    const have = new Set(row1.map((h) => h.toLowerCase()));
    const missing = headers.filter((h) => !have.has(h.toLowerCase()));
    if (!missing.length) {
      console.log(`• "${tab}" already has: ${headers.join(", ")}`);
      continue;
    }

    const startIndex = row1.length; // append AFTER the last existing header
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${tab}'!${colLetter(startIndex)}1`,
      valueInputOption: "RAW",
      requestBody: { values: [missing] },
    });
    console.log(`✓ "${tab}": appended ${missing.join(", ")} at column ${colLetter(startIndex)}`);
  }

  console.log("\nDone. Slice 6 columns are in place.");
}

main().catch((e) => die(e instanceof Error ? e.message : String(e)));
