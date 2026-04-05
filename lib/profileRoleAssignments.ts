import type { RoleAssignmentRow } from "@/lib/loadRoleAssignments";

function normRoleText(s?: string) {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function parseISOStart(d?: string): Date | null {
  const s = (d ?? "").trim();
  if (!s) return null;
  const dt = new Date(`${s}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function parseISOEnd(d?: string): Date | null {
  const s = (d ?? "").trim();
  if (!s) return null;
  const dt = new Date(`${s}T23:59:59.999`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function isActive(a: RoleAssignmentRow, asOf: Date) {
  const start = parseISOStart(a.startDate);
  const end = parseISOEnd(a.endDate);
  if (start && asOf < start) return false;
  if (end && asOf > end) return false;
  return true;
}

function isFuture(a: RoleAssignmentRow, asOf: Date) {
  const start = parseISOStart(a.startDate);
  return !!start && asOf < start;
}

function scopeRank(scopeType?: string) {
  const s = String(scopeType ?? "").trim().toUpperCase();
  if (s === "GLOBAL") return 0;
  if (s === "COUNTRY") return 1;
  if (s === "CLUB") return 2;
  if (s === "PRODUCTION") return 3;
  return 9;
}

function roleCodeLabel(roleCode?: string): string {
  const code = String(roleCode ?? "").trim().toUpperCase();

  switch (code) {
    case "DCL":
      return "Director of Creative Learning";
    case "DCP":
      return "Director of Community Partnerships";
    case "MCP":
      return "Manager of Community Partnerships";
    case "TAIR":
      return "Teaching Artist in Residence";
    case "RTA":
      return "Resident Teaching Artist";
    case "BOARD":
      return "Board of Directors";
    default:
      return String(roleCode ?? "").trim();
  }
}

function titleCaseWords(s?: string) {
  return String(s ?? "")
    .split(/[,\n;|]+/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .split(/\s+/)
        .map((word) =>
          word ? word[0]!.toUpperCase() + word.slice(1).toLowerCase() : word
        )
        .join(" ")
    )
    .join(" and ");
}

function clubLabelFromScopeKey(scopeKey?: string) {
  return String(scopeKey ?? "")
    .split(/[,\n;|]+/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/^https?:\/\/[^/]+/i, "")
        .replace(/^\/?drama-?club\/?/i, "")
        .replace(/-?drama-?club$/i, "")
        .replace(/-/g, " ")
        .trim()
    )
    .map((part) =>
      part
        .split(/\s+/)
        .map((word) =>
          word ? word[0]!.toUpperCase() + word.slice(1).toLowerCase() : word
        )
        .join(" ")
    )
    .join(" and ");
}

function scopeSpecificity(a: RoleAssignmentRow): string {
  const details = String(a.roleDetails ?? "").trim();
  if (details) return details;

  if (String(a.scopeType ?? "").toUpperCase() === "COUNTRY") {
    return titleCaseWords(a.scopeKey);
  }

  if (String(a.scopeType ?? "").toUpperCase() === "CLUB") {
    return clubLabelFromScopeKey(a.scopeKey);
  }

  return "";
}

function shouldPrefixStatus(status?: string) {
  const s = String(status ?? "").trim().toLowerCase();
  return s === "interim" || s === "acting" || s === "open" || s === "incoming";
}

function isPlaceholderRoleLabel(label?: string) {
  const clean = String(label ?? "").trim();
  if (!clean) return true;

  if (/^(staff|board)\b/i.test(clean)) return true;

  const upper = clean.toUpperCase();
  if (clean === upper && clean.length <= 8) return true;

  const pieces = clean.split(/\s+/).filter(Boolean);
  if (pieces.length <= 2 && pieces.every((p) => p.length <= 4)) return true;

  return false;
}

function buildAssignmentRoleLabel(a: RoleAssignmentRow): string {
  const scopeType = String(a.scopeType ?? "").trim().toUpperCase();
  const explicitRoleLabel = String(a.roleLabel ?? "").trim();
  const contextual = String(a.roleDetails ?? "").trim() || scopeSpecificity(a);

  const base =
    explicitRoleLabel && !isPlaceholderRoleLabel(explicitRoleLabel)
      ? explicitRoleLabel
      : roleCodeLabel(a.roleCode);

  let label = base;

  if (contextual) {
    const baseLower = base.toLowerCase();
    const contextualLower = contextual.toLowerCase();

    if (contextualLower.includes(baseLower)) {
      label = contextual;
    } else if (String(a.roleCode ?? "").trim().toUpperCase() === "BOARD") {
      label = `${contextual}, ${base}`;
    } else if (scopeType === "COUNTRY") {
      label = `${base} in ${contextual}`;
    } else if (scopeType === "CLUB") {
      label = `${base} for ${contextual}`;
    } else {
      label = `${base} — ${contextual}`;
    }
  }

  const status = String(a.statusSignifier ?? "").trim();
  if (!status || !shouldPrefixStatus(status)) return label;

  const statusLower = status.toLowerCase();
  if (label.toLowerCase().startsWith(statusLower)) return label;

  return `${status} ${label}`;
}

function dedupeRoles(roles: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const role of roles) {
    const clean = String(role ?? "").trim();
    if (!clean) continue;

    const key = normRoleText(clean);
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(clean);
  }

  return out;
}

function removeRoles(source: string[], toRemove: string[]) {
  const removeSet = new Set(toRemove.map((r) => normRoleText(r)));
  return source.filter((role) => !removeSet.has(normRoleText(role)));
}

function compareExplicitRolePriority(a?: string, b?: string) {
  const aa = String(a ?? "").trim().toUpperCase();
  const bb = String(b ?? "").trim().toUpperCase();

  if (aa === "DCP" && bb === "MCP") return -1;
  if (aa === "MCP" && bb === "DCP") return 1;

  return 0;
}

function compareCurrent(a: RoleAssignmentRow, b: RoleAssignmentRow) {
  const explicitPriority = compareExplicitRolePriority(a.roleCode, b.roleCode);
  if (explicitPriority !== 0) return explicitPriority;

  const display = (b.displayOrder ?? -999) - (a.displayOrder ?? -999);
  if (display !== 0) return display;

  const scope = scopeRank(a.scopeType) - scopeRank(b.scopeType);
  if (scope !== 0) return scope;

  const aStart = parseISOStart(a.startDate)?.getTime() ?? 0;
  const bStart = parseISOStart(b.startDate)?.getTime() ?? 0;
  if (aStart !== bStart) return bStart - aStart;

  return buildAssignmentRoleLabel(a).localeCompare(buildAssignmentRoleLabel(b));
}

function compareHistorical(a: RoleAssignmentRow, b: RoleAssignmentRow) {
  const aEnd = parseISOEnd(a.endDate)?.getTime() ?? 0;
  const bEnd = parseISOEnd(b.endDate)?.getTime() ?? 0;
  if (aEnd !== bEnd) return bEnd - aEnd;

  const display = (b.displayOrder ?? -999) - (a.displayOrder ?? -999);
  if (display !== 0) return display;

  return buildAssignmentRoleLabel(a).localeCompare(buildAssignmentRoleLabel(b));
}

export function getOrderedProfileRoles(
  profileId: string | undefined,
  existingRoles: string[] | undefined,
  assignments: RoleAssignmentRow[],
  asOf: Date = new Date()
): string[] {
  const pid = String(profileId ?? "").trim();
  const currentExisting = dedupeRoles(Array.isArray(existingRoles) ? existingRoles : []);

  if (!pid) return currentExisting;

  const relevant = assignments.filter(
    (a) =>
      String(a.profileId ?? "").trim() === pid &&
      a.showOnProfile !== false
  );

  const current = relevant.filter((a) => isActive(a, asOf)).sort(compareCurrent);
  const historical = relevant
    .filter((a) => !isActive(a, asOf) && !isFuture(a, asOf))
    .sort(compareHistorical);

  const currentLabels = dedupeRoles(current.map(buildAssignmentRoleLabel));
  const historicalLabels = dedupeRoles(historical.map(buildAssignmentRoleLabel));

  // If there is a current role in Role-Assignments, it becomes primary.
  // Historical DAT roles should come next.
  // Existing leftover roles stay after the DAT role history.
  if (currentLabels.length > 0) {
    const remainingExisting = removeRoles(currentExisting, [
      ...currentLabels,
      ...historicalLabels,
    ]);

    return dedupeRoles([
      ...currentLabels,
      ...historicalLabels,
      ...remainingExisting,
    ]);
  }

  // Otherwise preserve the existing primary profile role,
  // then fold historical sheet roles underneath it.
  if (currentExisting.length > 0) {
    return dedupeRoles([
      currentExisting[0],
      ...historicalLabels,
      ...currentExisting.slice(1),
    ]);
  }

  // Fallback for profiles with no existing roles list.
  return historicalLabels;
}

export function getPrimaryDatRoleForProfile(
  profileId: string | undefined,
  existingRoles: string[] | undefined,
  assignments: RoleAssignmentRow[],
  asOf: Date = new Date()
): string {
  return getOrderedProfileRoles(profileId, existingRoles, assignments, asOf)[0] || "";
}