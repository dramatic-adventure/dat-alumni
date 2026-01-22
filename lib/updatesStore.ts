// lib/updatesStore.ts
import { google } from "googleapis";
import crypto from "node:crypto";

export type UpdatesRow = {
  id: string;
  ts: string;
  alumniId: string;
  email?: string;
  name: string;
  slug: string;
  text: string;
  promptUsed?: string;
  isDatGold?: boolean;
  status?: "live" | "deleted";
};

function parseSA(jsonStr: string) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return JSON.parse(jsonStr.replace(/\\n/g, "\n"));
  }
}

function getSheetsClient() {
  const saRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";
  if (!saRaw) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");

  const sa = parseSA(saRaw);

  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function sheetName() {
  return (process.env.UPDATES_SHEET_NAME || "Updates").trim() || "Updates";
}

function ssid() {
  const id = process.env.GOOGLE_SHEETS_ID || "";
  if (!id) throw new Error("Missing GOOGLE_SHEETS_ID");
  return id;
}

export function newUpdateId() {
  // Node 18+ has randomUUID
  return crypto.randomUUID();
}

export async function appendUpdate(row: UpdatesRow) {
  const sheets = getSheetsClient();

  const values = [
    [
      row.id,
      row.ts,
      row.alumniId,
      row.email ?? "",
      row.name,
      row.slug,
      row.text,
      row.promptUsed ?? "",
      row.isDatGold ? "true" : "false",
      row.status ?? "live",
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: ssid(),
    range: `${sheetName()}!A:Z`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  return row.id;
}

export async function readRecentUpdates(limit = 50): Promise<UpdatesRow[]> {
  const sheets = getSheetsClient();

  // Pull the whole sheet (fine for small/medium; if it grows huge, paginate or use a tighter range).
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: ssid(),
    range: `${sheetName()}!A:Z`,
  });

  const rows = (res.data.values || []) as string[][];
  if (rows.length <= 1) return [];

  const header = rows[0].map((h) => String(h || "").trim());
  const idx = (name: string) => header.findIndex((h) => h === name);

  const iId = idx("id");
  const iTs = idx("ts");
  const iAlumniId = idx("alumniId");
  const iEmail = idx("email");
  const iName = idx("name");
  const iSlug = idx("slug");
  const iText = idx("text");
  const iPrompt = idx("promptUsed");
  const iGold = idx("isDatGold");
  const iStatus = idx("status");

  const parsed: UpdatesRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const id = String(row[iId] ?? "").trim();
    const ts = String(row[iTs] ?? "").trim();
    const alumniId = String(row[iAlumniId] ?? "").trim();
    const name = String(row[iName] ?? "").trim();
    const slug = String(row[iSlug] ?? "").trim();
    const text = String(row[iText] ?? "").trim();
    const status = (String(row[iStatus] ?? "").trim() as any) || "live";

    if (!id || !alumniId || !name || !slug || !text) continue;

    parsed.push({
      id,
      ts: ts || "0",
      alumniId,
      email: String(row[iEmail] ?? "").trim() || undefined,
      name,
      slug,
      text,
      promptUsed: String(row[iPrompt] ?? "").trim() || undefined,
      isDatGold: String(row[iGold] ?? "").trim() === "true",
      status: status === "deleted" ? "deleted" : "live",
    });
  }

  // newest-first (ts is ISO-ish)
  parsed.sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts));

  const liveOnly = parsed.filter((x) => x.status !== "deleted");
  return liveOnly.slice(0, Math.max(1, limit));
}

export async function softDeleteUpdateById(id: string) {
  const sheets = getSheetsClient();

  // Find row index by scanning IDs (simple + reliable).
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: ssid(),
    range: `${sheetName()}!A:Z`,
  });

  const values = (res.data.values || []) as string[][];
  if (values.length <= 1) return { ok: false, reason: "empty" as const };

  const header = values[0].map((h) => String(h || "").trim());
  const idCol = header.findIndex((h) => h === "id");
  const statusCol = header.findIndex((h) => h === "status");

  if (idCol < 0 || statusCol < 0) {
    return { ok: false, reason: "missing_columns" as const };
  }

  // Locate row
  let rowIndex = -1; // 1-based in Sheets UI; in API we’ll compute A1 range
  for (let r = 1; r < values.length; r++) {
    const rid = String(values[r]?.[idCol] ?? "").trim();
    if (rid === id) {
      rowIndex = r + 1; // because header is row 1
      break;
    }
  }

  if (rowIndex < 0) return { ok: false, reason: "not_found" as const };

  // status cell A1 notation (statusCol is 0-based; A=1)
  const colLetter = (n: number) => {
    let s = "";
    let x = n + 1;
    while (x > 0) {
      const m = (x - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      x = Math.floor((x - 1) / 26);
    }
    return s;
  };

  const statusA1 = `${sheetName()}!${colLetter(statusCol)}${rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: ssid(),
    range: statusA1,
    valueInputOption: "RAW",
    requestBody: { values: [["deleted"]] },
  });

  return { ok: true as const };
}
