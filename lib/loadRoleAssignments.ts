// lib/loadRoleAssignments.ts
import "server-only";

import { sheetsClient } from "@/lib/googleClients";

export type ScopeType = "GLOBAL" | "COUNTRY" | "CLUB" | "PRODUCTION";
export type RoleCode =
  | "RTA"
  | "TAIR"
  | "MCP"
  | "DCP"
  | "DCL"
  | "BOARD"
  | string;

export type RoleAssignmentRow = {
  profileId?: string;
  roleCode: RoleCode;
  roleLabel?: string;
  roleDetails?: string;

  scopeType: ScopeType;
  scopeKey: string;

  startDate?: string;
  endDate?: string;

  statusSignifier?: string;
  displayOrder?: number;
  showOnProfile?: boolean;
};

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

function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

function cell(r: unknown[], idx: number) {
  return idx !== -1 ? String(r?.[idx] ?? "").trim() : "";
}

export async function loadRoleAssignments(): Promise<RoleAssignmentRow[]> {
  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

  const roleAssignmentsTab =
    process.env.ROLE_ASSIGNMENTS_TAB || "Role-Assignments";

  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${roleAssignmentsTab}!A:ZZ`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const all = (res.data.values ?? []) as unknown[][];
  if (!all.length) return [];

  const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
  const rows = all.slice(1);

  const profileIdIdx = idxOf(header, ["profileId", "Profile ID", "profile_id"]);
  const roleCodeIdx = idxOf(header, ["roleCode", "Role Code", "role", "Role"]);
  const roleLabelIdx = idxOf(header, ["roleLabel", "Role Label"]);
  const roleDetailsIdx = idxOf(header, [
    "roleDetails",
    "Role Details",
    "role_details",
    "roleDetail",
    "Role Detail",
    "role_detail",
  ]);
  const scopeTypeIdx = idxOf(header, [
    "scopeType",
    "Scope Type",
    "scope",
    "Scope",
  ]);
  const scopeKeyIdx = idxOf(header, ["scopeKey", "Scope Key"]);
  const startDateIdx = idxOf(header, ["startDate", "Start Date"]);
  const endDateIdx = idxOf(header, ["endDate", "End Date"]);
  const statusSignifierIdx = idxOf(header, [
    "statusSignifier",
    "Status Signifier",
  ]);
  const displayOrderIdx = idxOf(header, ["displayOrder", "Display Order"]);
  const showOnProfileIdx = idxOf(header, [
    "showOnProfile",
    "Show on Profile?",
    "Show on Profile",
  ]);

  const out: RoleAssignmentRow[] = [];

  for (const r of rows) {
    const profileId = cell(r, profileIdIdx);
    const roleCode = cell(r, roleCodeIdx);
    const scopeType = cell(r, scopeTypeIdx);
    const scopeKey = cell(r, scopeKeyIdx);
    const statusSignifier = cell(r, statusSignifierIdx) || undefined;

    const isOpen =
      String(statusSignifier ?? "").trim().toLowerCase() === "open";

    if ((!profileId && !isOpen) || !roleCode || !scopeType || !scopeKey) {
      continue;
    }

    out.push({
      profileId: profileId || undefined,
      roleCode,
      roleLabel: cell(r, roleLabelIdx) || undefined,
      roleDetails: cell(r, roleDetailsIdx) || undefined,
      scopeType: scopeType as ScopeType,
      scopeKey,
      startDate: cell(r, startDateIdx) || undefined,
      endDate: cell(r, endDateIdx) || undefined,
      statusSignifier,
      displayOrder: toNum(cell(r, displayOrderIdx)),
      showOnProfile: toBool(cell(r, showOnProfileIdx)),
    });
  }

  return out;
}