// scripts/shelve-field-kit-resource.ts
//
// One-off admin script (Slice 5): shelve a local file in the Field Library.
// Uploads the file to Drive under DRIVE_CAPTURES_FOLDER_ID/<programId>/library/
// (SA-readable, so the gated proxy route app/api/field-kit/library/file/[id]
// can stream it — which is what makes it viewable online AND offline via
// cache-on-open), then appends a row to the "Field Kit Resources" tab.
//
// IDEMPOTENT: reuses an existing Drive file of the same name in the library
// folder, and refuses to append a row whose id already exists. Safe to re-run.
//
//     npm run shelve:resource -- --file "public/resources/Playwriting Exercise.pdf" \
//       --id playwriting-exercise --title "Playwriting Exercise" --tags "Teaching"
//
// Optional: --type (default "text"), --day (dayId for "Relevant today"),
// --program (default FIELD_KIT_PROGRAM_ID env or passage-slovakia-2026).
//
// Requires ALUMNI_SHEET_ID, DRIVE_CAPTURES_FOLDER_ID + GCP service-account
// credentials in the environment or .env.local — credential resolution
// mirrors lib/googleClients.ts (which is "server-only" and can't load here).

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { PassThrough } from "stream";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") }); // optional fallback

import { google } from "googleapis";

const TAB = "Field Kit Resources";
const HEADERS = ["id", "programId", "dayId", "title", "type", "url", "tags"] as const;

function die(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function arg(name: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : "";
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

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".txt": "text/plain",
};

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  parentId: string,
  name: string
): Promise<string> {
  const q = `'${parentId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder' and name = '${name.replace(/'/g, "\\'")}'`;
  const list = await drive.files.list({
    q,
    fields: "files(id,name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const existing = list.data.files?.[0];
  if (existing?.id) return existing.id;
  const created = await drive.files.create({
    requestBody: { name, parents: [parentId], mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
    supportsAllDrives: true,
  });
  return created.data.id!;
}

async function main() {
  const sheetId = process.env.ALUMNI_SHEET_ID || die("Missing env ALUMNI_SHEET_ID");
  const capturesRoot = process.env.DRIVE_CAPTURES_FOLDER_ID || die("Missing env DRIVE_CAPTURES_FOLDER_ID");

  const filePath = arg("file") || die("--file <path> required");
  const id = arg("id") || die("--id <resource id> required");
  const title = arg("title") || die("--title <title> required");
  const tags = arg("tags"); // first tag = shelf name; empty lands on "The Shelf"
  const type = arg("type") || "text";
  const dayId = arg("day");
  const programId = arg("program") || process.env.FIELD_KIT_PROGRAM_ID || "passage-slovakia-2026";

  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) die(`File not found: ${abs}`);
  const fileName = path.basename(abs);
  const mimeType = MIME_BY_EXT[path.extname(abs).toLowerCase()] || "application/octet-stream";

  const sa = resolveServiceAccount();
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  // ── 1. Read the tab; show existing rows for this program; guard duplicate id ──
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `'${TAB}'!A:G`,
  });
  const rows = (res.data.values ?? []) as string[][];
  if (!rows.length) die(`Tab "${TAB}" is empty — run npm run setup:field-kit-slice5-tabs first`);
  const header = rows[0].map((h) => String(h ?? "").trim().toLowerCase());
  const col = Object.fromEntries(HEADERS.map((h) => [h, header.indexOf(h.toLowerCase())]));
  if (col.id === -1 || col.programId === -1) die(`Tab "${TAB}" header row is malformed: ${rows[0].join(", ")}`);

  console.log(`Existing "${TAB}" rows for ${programId}:`);
  let found = 0;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i]?.[col.programId] ?? "").trim().toLowerCase() !== programId.toLowerCase()) continue;
    found++;
    console.log(`  • ${rows[i]?.[col.id]} — "${rows[i]?.[col.title]}" [${rows[i]?.[col.type]}] tags: ${rows[i]?.[col.tags] || "(none — The Shelf)"}`);
    if (String(rows[i]?.[col.id] ?? "").trim().toLowerCase() === id.toLowerCase())
      die(`Resource id "${id}" already exists (row ${i + 1}) — nothing appended`);
  }
  if (!found) console.log("  (none yet)");

  // ── 2. Upload to Drive: <captures root>/<programId>/library/<file> ──────────
  const programFolder = await findOrCreateFolder(drive, capturesRoot, programId);
  const libraryFolder = await findOrCreateFolder(drive, programFolder, "library");

  let fileId = "";
  const dupe = await drive.files.list({
    q: `'${libraryFolder}' in parents and trashed = false and name = '${fileName.replace(/'/g, "\\'")}'`,
    fields: "files(id,name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  if (dupe.data.files?.[0]?.id) {
    fileId = dupe.data.files[0].id!;
    console.log(`• Drive file already exists, reusing: ${fileName} (${fileId})`);
  } else {
    const body = new PassThrough();
    fs.createReadStream(abs).pipe(body);
    const created = await drive.files.create({
      requestBody: { name: fileName, parents: [libraryFolder] },
      media: { mimeType, body },
      fields: "id",
      supportsAllDrives: true,
    });
    fileId = created.data.id!;
    console.log(`✓ uploaded ${fileName} → Drive ${fileId} (in ${programId}/library/)`);
  }

  // ── 3. Append the resource row ───────────────────────────────────────────────
  const url = `https://drive.google.com/file/d/${fileId}/view`;
  const row: string[] = [];
  row[col.id] = id;
  row[col.programId] = programId;
  row[col.dayId] = dayId;
  row[col.title] = title;
  row[col.type] = type;
  row[col.url] = url;
  row[col.tags] = tags;
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `'${TAB}'!A:G`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row.map((c) => c ?? "")] },
  });
  console.log(`✓ appended row: ${id} | ${programId} | ${dayId || "—"} | ${title} | ${type} | ${url} | ${tags || "(untagged)"}`);

  // ── 4. Verify: re-read + confirm the SA can read the file bytes back ────────
  const verify = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `'${TAB}'!A:G` });
  const ok = (verify.data.values ?? []).some(
    (r) => String(r?.[col.id] ?? "").trim().toLowerCase() === id.toLowerCase()
  );
  if (!ok) die("Verification failed: appended row not found on re-read");
  const meta = await drive.files.get({ fileId, fields: "size,mimeType", supportsAllDrives: true });
  console.log(`✓ verified: row present; Drive file readable (${meta.data.mimeType}, ${meta.data.size} bytes)`);
  console.log(`\nDone. "${title}" is on the "${tags.split(/[\n|,]/)[0]?.trim() || "The Shelf"}" shelf (visible within ~60s TTL).`);
}

main().catch((e) => die(e instanceof Error ? e.message : String(e)));
