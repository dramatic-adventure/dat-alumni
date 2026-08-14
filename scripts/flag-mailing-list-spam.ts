// scripts/flag-mailing-list-spam.ts
//
// Reviews the existing "Mailing List" tab and FLAGS suspected bot signups.
// It never deletes a row and never edits Timestamp/Name/Email/Source — it only
// fills the Status and Notes columns (E and F), adding those headers if the tab
// predates them.
//
// It scores rows with lib/mailingListGuard.ts — the exact same function the
// live /api/mailing-list endpoint uses — so what you see here is what the
// endpoint would have done.
//
//   npm run flag:mailing-list            # dry run: report only, writes nothing
//   npm run flag:mailing-list -- --write # apply Status/Notes to the sheet
//
// IDEMPOTENT: re-running produces the same verdicts. Rows you've manually
// marked (anything in Status that isn't "", "subscribed" or "quarantined") are
// left completely alone, so your own review decisions survive a re-run.
//
// Requires ALUMNI_SHEET_ID (or GOOGLE_SHEET_ID) + GCP service-account
// credentials in .env.local — same resolution order as lib/googleClients.ts,
// mirrored here because that module is "server-only".

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { google, sheets_v4 } from "googleapis";
import {
  scoreSignup,
  QUARANTINE_SCORE,
  normalizeEmail,
  normalizeGmail,
} from "../lib/mailingListGuard";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || process.env.ALUMNI_SHEET_ID || "";
const TAB = "Mailing List";
const WRITE = process.argv.includes("--write");

/** Status values this script owns and may overwrite; anything else is preserved. */
const SCRIPT_OWNED_STATUS = new Set(["", "subscribed", "quarantined", "flagged"]);

/** Statuses the live route writes itself. Preserved (they carry context the
 *  scorer doesn't have — a burst, a missing Origin) but counted separately so
 *  they aren't misreported as human review decisions. */
const ROUTE_FLAGGED_STATUS = new Set(["rate-limited", "no-origin"]);

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
    return {
      client_email: parsed.client_email,
      private_key: normalizePrivateKey(parsed.private_key),
    };
  }
  const json = process.env.GCP_SA_JSON;
  if (json) {
    let parsed: { client_email: string; private_key: string };
    try {
      parsed = JSON.parse(json);
    } catch {
      parsed = JSON.parse(json.replace(/\\n/g, "\n"));
    }
    return {
      client_email: parsed.client_email,
      private_key: normalizePrivateKey(parsed.private_key),
    };
  }
  const email = process.env.GCP_SA_EMAIL;
  const key = process.env.GCP_SA_PRIVATE_KEY;
  if (email && key) return { client_email: email, private_key: normalizePrivateKey(key) };
  die(
    "No GCP service-account credentials found (GCP_SA_JSON_BASE64 / GCP_SA_JSON / GCP_SA_EMAIL+GCP_SA_PRIVATE_KEY)"
  );
}

/**
 * The "Mailing List" tab was created 4 columns wide (A–D). Status and Notes
 * live in E and F, and the Sheets API rejects ANY write past the grid edge
 * ("exceeds grid limits") rather than growing the sheet for you — so widen the
 * grid first. Returns true if it had to widen.
 */
async function ensureColumns(sheets: sheets_v4.Sheets, needed: number): Promise<boolean> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = (meta.data.sheets ?? []).find(
    (s) => (s.properties?.title ?? "") === TAB
  );
  if (!sheet?.properties) die(`Tab "${TAB}" not found in this spreadsheet.`);

  const current = sheet.properties.gridProperties?.columnCount ?? 0;
  if (current >= needed) return false;

  if (!WRITE) {
    console.log(
      `\n"${TAB}" is only ${current} columns wide; needs ${needed} for Status/Notes.` +
        ` Re-run with --write to widen it.`
    );
    return true;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId: sheet.properties.sheetId,
              gridProperties: { columnCount: needed },
            },
            fields: "gridProperties.columnCount",
          },
        },
      ],
    },
  });
  console.log(`\u2713 Widened "${TAB}" from ${current} to ${needed} columns.`);
  return true;
}

async function main() {
  if (!SHEET_ID) die("Missing env ALUMNI_SHEET_ID (or GOOGLE_SHEET_ID)");

  const sa = resolveServiceAccount();
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  let rows: string[][];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${TAB}'!A:F`,
    });
    rows = (res.data.values ?? []).map((r) =>
      (r as unknown[]).map((c) => String(c ?? "").trim())
    );
  } catch (e) {
    die(
      `Can't read the "${TAB}" tab — does it exist in this spreadsheet? (${
        e instanceof Error ? e.message : e
      })`
    );
  }

  // Must happen before any E/F write, empty tab or not.
  const neededWidening = await ensureColumns(sheets, 6);

  const header = rows[0] ?? [];
  const dataRows = rows.slice(1);

  // ── Header repair (E1/F1) ──────────────────────────────────────────────────
  // Only fills in EMPTY header cells. A different non-empty value means a
  // human put their own column there — warn and leave it alone rather than
  // clobbering their work.
  const wantHeaders = ["Status", "Notes"];
  const headerUpdates: { range: string; values: string[][] }[] = [];
  ["E", "F"].forEach((col, i) => {
    const idx = 4 + i;
    const current = (header[idx] ?? "").trim();
    if (current === wantHeaders[i]) return;
    if (current === "") {
      headerUpdates.push({ range: `'${TAB}'!${col}1`, values: [[wantHeaders[i]]] });
    } else {
      console.warn(
        `⚠ ${col}1 already contains "${current}" (expected "${wantHeaders[i]}"). ` +
          `Leaving it alone — move that column elsewhere and re-run if you want ` +
          `${wantHeaders[i]} in ${col}.`
      );
    }
  });

  // An empty tab still needs its Status/Notes headers — write them and stop,
  // rather than returning early and leaving the tab half-set-up.
  if (dataRows.length === 0) {
    console.log(`\n"${TAB}" — no data rows yet.`);
    if (!headerUpdates.length && !neededWidening) {
      console.log("Headers already correct — nothing to do.");
      return;
    }
    if (!WRITE) {
      console.log(
        `Missing headers: ${headerUpdates
          .map((h) => h.values[0][0])
          .join(", ")}. Re-run with --write to add them.`
      );
      return;
    }
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: "RAW", data: headerUpdates },
    });
    console.log(`✓ Added ${headerUpdates.length} header cell(s).`);
    return;
  }

  // ── Score every row ────────────────────────────────────────────────────────
  const updates: { range: string; values: string[][] }[] = [];
  const flagged: { row: number; email: string; reasons: string[] }[] = [];
  const seen = new Map<string, number>();
  let clean = 0;
  let manuallyReviewed = 0;
  let routeFlagged = 0;

  dataRows.forEach((row, i) => {
    const rowNumber = i + 2; // 1-based, +1 for the header
    const name = row[1] ?? "";
    const email = normalizeEmail(row[2] ?? "");
    const currentStatus = (row[4] ?? "").trim().toLowerCase();

    if (!email) return;

    // Rows the route itself flagged carry context the scorer can't recompute
    // (a burst, a missing Origin) — preserve them, count them as their own
    // category. Everything else outside SCRIPT_OWNED_STATUS is a human call.
    if (ROUTE_FLAGGED_STATUS.has(currentStatus)) {
      routeFlagged++;
      return;
    }
    if (!SCRIPT_OWNED_STATUS.has(currentStatus)) {
      manuallyReviewed++;
      return;
    }

    const { score, reasons } = scoreSignup({ email, name });

    // Duplicates are worth surfacing but aren't spam on their own. Keyed on
    // the CANONICAL Gmail form, so the dot-variants the attacker cycles
    // through land in one group — exactly what the live route collapses.
    const canonical = normalizeGmail(email);
    const firstSeen = seen.get(canonical);
    if (firstSeen) reasons.push(`duplicate of row ${firstSeen}`);
    else seen.set(canonical, rowNumber);

    const status = score >= QUARANTINE_SCORE ? "quarantined" : "subscribed";
    const notes = reasons.join("; ");

    if (status === "quarantined") flagged.push({ row: rowNumber, email, reasons });
    else clean++;

    // Only queue a write if something actually changes.
    if ((row[4] ?? "") !== status || (row[5] ?? "") !== notes) {
      updates.push({ range: `'${TAB}'!E${rowNumber}:F${rowNumber}`, values: [[status, notes]] });
    }
  });

  // ── Report ─────────────────────────────────────────────────────────────────
  console.log(`\n"${TAB}" — ${dataRows.length} data rows`);
  console.log(`  clean:         ${clean}`);
  console.log(`  quarantined:   ${flagged.length}`);
  if (routeFlagged)
    console.log(`  route-flagged: ${routeFlagged} (rate-limited / no-origin — left as-is)`);
  if (manuallyReviewed)
    console.log(`  skipped:       ${manuallyReviewed} (manually reviewed already)`);

  if (flagged.length) {
    console.log(`\nSuspected bot signups:`);
    for (const f of flagged) {
      console.log(`  row ${String(f.row).padStart(4)}  ${f.email}`);
      console.log(`            ${f.reasons.join("; ")}`);
    }
  }

  const allWrites = [...headerUpdates, ...updates];
  if (!allWrites.length) {
    console.log(`\nSheet already matches — nothing to write.`);
    return;
  }

  if (!WRITE) {
    console.log(
      `\nDry run — ${allWrites.length} cell range(s) would be updated. Re-run with --write to apply.`
    );
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: "RAW", data: allWrites },
  });
  console.log(`\n✓ Wrote ${allWrites.length} cell range(s). No rows were deleted.`);
}

main().catch((e) => die(e instanceof Error ? e.message : String(e)));
