// lib/loadRoleAssignments.ts
import "server-only";

import fs from "node:fs/promises";
import path from "node:path";

export type ScopeType = "GLOBAL" | "COUNTRY" | "CLUB" | "PRODUCTION";
export type RoleCode = "RTA" | "TAIR" | "MCP" | "DCL" | "BOARD" | string;

export type RoleAssignmentRow = {
  profileId: string;
  roleCode: RoleCode;
  roleLabel?: string;

  scopeType: ScopeType;
  scopeKey: string;

  startDate?: string;
  endDate?: string;

  statusSignifier?: string;
  displayOrder?: number;
  showOnProfile?: boolean;
};

const DEFAULT_ROLE_ASSIGNMENTS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzkIPStlL2TU7AHySD3Kw9CqBFTi1q6QW7N99ivE3FpofNhHlwWejU0LXeMOmnTawtmLCT71KWMU-F/pub?gid=2095520301&single=true&output=csv";

const ROLE_ASSIGNMENTS_URL =
  process.env.DRAMA_CLUB_LEAD_TEAM_CSV_URL ??
  process.env.NEXT_PUBLIC_DRAMA_CLUB_LEAD_TEAM_CSV_URL ??
  DEFAULT_ROLE_ASSIGNMENTS_URL;

const FALLBACK_PATH = path.join(
  process.cwd(),
  "public",
  "fallback",
  "role-assignments.csv"
);

const DEBUG = process.env.DEBUG_ROLE_ASSIGNMENTS === "1";

// ✅ write fallback when remote is good (dev by default; opt-in for prod)
const SHOULD_WRITE_FALLBACK =
  process.env.WRITE_ROLE_ASSIGNMENTS_FALLBACK === "1" ||
  process.env.NODE_ENV === "development";

/** Debug logger that doesn't trip no-console everywhere */
function debugLog(...args: unknown[]) {
  if (!DEBUG) return;
  // eslint-disable-next-line no-console
  console.log(...args);
}

async function tryWriteFallback(csvText: string) {
  if (!SHOULD_WRITE_FALLBACK) return;

  try {
    await fs.mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
    const normalized = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    await fs.writeFile(FALLBACK_PATH, normalized, "utf8");
    debugLog("wrote fallback:", FALLBACK_PATH);
  } catch (e) {
    debugLog("failed to write fallback:", e);
  }
}

function parseCsv(text: string): Array<Record<string, string>> {
  const s = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];

  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (ch === '"') {
      const next = s[i + 1];
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  row.push(field);
  rows.push(row);

  const header = (rows.shift() ?? []).map((h) => h.trim());
  const records: Array<Record<string, string>> = [];

  for (const r of rows) {
    if (!r || r.every((v) => !String(v ?? "").trim())) continue;
    const rec: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) {
      const key = header[i];
      if (!key) continue;
      rec[key] = (r[i] ?? "").trim();
    }
    records.push(rec);
  }

  return records;
}

function toBool(v: string | undefined): boolean | undefined {
  if (!v) return undefined;
  const s = v.trim().toLowerCase();
  if (s === "true" || s === "yes" || s === "1") return true;
  if (s === "false" || s === "no" || s === "0") return false;
  return undefined;
}

function toNum(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function withCacheBust(url: string): string {
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}_=${Date.now()}`;
}

function looksLikeRoleCsv(text: string): boolean {
  const firstLine = (text.split(/\r?\n/)[0] ?? "").trim().toLowerCase();
  return firstLine.includes("profileid") && firstLine.includes("rolecode");
}

export async function loadRoleAssignments(): Promise<RoleAssignmentRow[]> {
  let csvText: string | null = null;
  let source: "remote" | "fallback" | "empty" = "empty";

  const isDev = process.env.NODE_ENV === "development";
  const fetchUrl = isDev ? withCacheBust(ROLE_ASSIGNMENTS_URL) : ROLE_ASSIGNMENTS_URL;

  // 1) Try remote
  try {
    const res = await fetch(
      fetchUrl,
      isDev ? { cache: "no-store" } : { next: { revalidate: 3600 } }
    );

    debugLog("=== DEBUG_ROLE_ASSIGNMENTS ===");
    debugLog("url:", ROLE_ASSIGNMENTS_URL);
    debugLog("fetchUrl:", fetchUrl);
    debugLog("status:", res.status, res.statusText);
    debugLog("content-type:", res.headers.get("content-type"));

    if (res.ok) {
      const text = await res.text();

      debugLog("bytes:", text.length);
      debugLog("firstLine:", (text.split(/\r?\n/)[0] ?? "").trim());

      if (looksLikeRoleCsv(text)) {
        csvText = text;
        source = "remote";
        await tryWriteFallback(text); // ✅ update fallback snapshot
      } else {
        debugLog("remote response didn't look like role-assignments CSV; will try fallback");
      }
    } else {
      debugLog("remote fetch not ok; will try fallback");
    }
  } catch (e) {
    debugLog("remote fetch error:", e);
    debugLog("will try fallback");
  }

  // 2) Fallback to local file
  if (!csvText) {
    try {
      csvText = await fs.readFile(FALLBACK_PATH, "utf8");
      source = "fallback";
    } catch {
      csvText = "";
      source = "empty";
    }
  }

  debugLog("source:", source);
  debugLog("=== /DEBUG_ROLE_ASSIGNMENTS ===");

  if (!csvText.trim()) return [];

  const records = parseCsv(csvText);

  const out: RoleAssignmentRow[] = records
    .map((r): RoleAssignmentRow | null => {
      const profileId = (r.profileId || r["Profile ID"] || r["profile_id"] || "").trim();
      const roleCode = (r.roleCode || r["Role Code"] || r.role || r["Role"] || "").trim();
      const scopeType = (r.scopeType || r["Scope Type"] || r.scope || r["Scope"] || "").trim();
      const scopeKey = (r.scopeKey || r["Scope Key"] || r["scopeKey"] || "").trim();

      if (!profileId || !roleCode || !scopeType || !scopeKey) return null;

      return {
        profileId,
        roleCode,
        roleLabel: (r.roleLabel || r["Role Label"] || "").trim() || undefined,
        scopeType: scopeType as ScopeType,
        scopeKey,

        startDate: (r.startDate || r["Start Date"] || "").trim() || undefined,
        endDate: (r.endDate || r["End Date"] || "").trim() || undefined,

        statusSignifier:
          (r.statusSignifier || r["Status Signifier"] || "").trim() || undefined,

        displayOrder: toNum(r.displayOrder || r["Display Order"]),
        showOnProfile: toBool(r.showOnProfile || r["Show on Profile?"]),
      };
    })
    .filter(Boolean) as RoleAssignmentRow[];

  return out;
}
