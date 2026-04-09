import type { RoleAssignmentRow } from "@/lib/loadRoleAssignments";

/**
 * DAT role label substrings. Any Profile-Live role containing one of these is
 * considered a "DAT-managed" role and will be dropped from `remainingExisting`
 * when active Role-Assignment entries exist (prevents stale legacy roles from
 * leaking through after an assignment is removed from the sheet).
 */
const DAT_ROLE_FRAGMENTS = [
  "artistic director",
  "associate artistic director",
  "executive director",
  "director of creative learning",
  "director of community partnerships",
  "manager of community partnerships",
  "teaching artist in residence",
  "resident teaching artist",
  "board of directors",
];

function isDatStyleRole(role: string): boolean {
  const lc = roleMatchKey(role);
  return DAT_ROLE_FRAGMENTS.some((frag) => lc.includes(frag));
}

function normRoleText(s?: string) {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")       // strip periods: "K." → "K"
    .replace(/[-_]+/g, " ")  // hyphens/underscores → space: "mary-k-baxter" → "mary k baxter"
    .replace(/\s+/g, " ")    // collapse whitespace
    .trim();
}

function roleMatchKey(s?: string) {
  let out = normRoleText(s);

  while (/^(former|interim|acting|incoming)\s+/i.test(out)) {
    out = out.replace(/^(former|interim|acting|incoming)\s+/i, "");
  }

  if (out === "ed") return "executive director";
  if (out === "ad") return "artistic director";
  if (out === "aad") return "associate artistic director";
  if (out === "assoc artistic director") return "associate artistic director";
  if (out === "rp") return "resident playwright";
  if (out === "dcl") return "director of creative learning";
  if (out === "dcp") return "director of community partnerships";
  if (out === "mcp") return "manager of community partnerships";
  if (out === "tair") return "teaching artist in residence";
  if (out === "rta") return "resident teaching artist";

  return out;
}

function expandDisplayRole(role?: string) {
  const clean = String(role ?? "").trim();
  const code = clean.toUpperCase();

  switch (code) {
    case "AD":
      return "Artistic Director";
    case "AAD":
      return "Associate Artistic Director";     
    case "RP":
      return "Resident Playwright";
    case "ED":
      return "Executive Director";
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
    default:
      return clean;
  }
}

function parseSheetDate(value?: string, endOfDay: boolean = false): Date | null {
  const s = String(value ?? "").trim();
  if (!s) return null;

  // Google Sheets / Excel serial date
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = Number(s);
    const baseUtc = Date.UTC(1899, 11, 30);
    const dt = new Date(baseUtc + serial * 86400 * 1000);
    if (Number.isNaN(dt.getTime())) return null;

    if (endOfDay) dt.setUTCHours(23, 59, 59, 999);
    else dt.setUTCHours(0, 0, 0, 0);

    return dt;
  }

  // ISO date string
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const dt = new Date(`${s}${endOfDay ? "T23:59:59.999" : "T00:00:00.000"}`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return null;

  if (endOfDay) dt.setHours(23, 59, 59, 999);
  else dt.setHours(0, 0, 0, 0);

  return dt;
}

function parseISOStart(d?: string): Date | null {
  return parseSheetDate(d, false);
}

function parseISOEnd(d?: string): Date | null {
  return parseSheetDate(d, true);
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

/**
 * Sorts a role list to enforce explicit priority rules (e.g. DCP before MCP).
 * Preserves original order for all other roles.
 */
function sortRolesByPriority(roles: string[]): string[] {
  const dcpIdx = roles.findIndex((r) =>
    normRoleText(r).includes("director of community partnerships")
  );
  const mcpIdx = roles.findIndex((r) =>
    normRoleText(r).includes("manager of community partnerships")
  );
  if (dcpIdx === -1 || mcpIdx === -1 || dcpIdx < mcpIdx) return roles;
  // DCP appears after MCP — move DCP before MCP
  const result = [...roles];
  const [dcpItem] = result.splice(dcpIdx, 1);
  const newMcpIdx = result.findIndex((r) =>
    normRoleText(r).includes("manager of community partnerships")
  );
  result.splice(newMcpIdx, 0, dcpItem);
  return result;
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
    case "ED":
      return "Executive Director";  
    case "AD":
      return "Artistic Director";
    case "AAD":
      return "Associate Artistic Director";    
    case "RP":
      return "Resident Playwright";
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
  if (String(a.scopeType ?? "").toUpperCase() === "COUNTRY") {
    return titleCaseWords(a.scopeKey);
  }

  if (String(a.scopeType ?? "").toUpperCase() === "CLUB") {
    return clubLabelFromScopeKey(a.scopeKey);
  }

  return "";
}

function getAssignmentStatusPrefix(a: RoleAssignmentRow): string {
  const status = String(a.statusSignifier ?? "").trim();
  if (shouldPrefixStatus(status)) return status;

  const details = String(a.roleDetails ?? "").trim();
  if (shouldPrefixStatus(details)) return details;

  return "";
}

function getAssignmentContextualLabel(a: RoleAssignmentRow): string {
  const details = String(a.roleDetails ?? "").trim();
  if (details && !shouldPrefixStatus(details)) return details;

  return scopeSpecificity(a);
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

function buildAssignmentRoleLabel(
  a: RoleAssignmentRow,
  options?: { historical?: boolean }
): string {
  const historical = !!options?.historical;
  const scopeType = String(a.scopeType ?? "").trim().toUpperCase();
  const explicitRoleLabel = String(a.roleLabel ?? "").trim();
  const contextual = getAssignmentContextualLabel(a);

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

  if (
    String(a.roleCode ?? "").trim().toUpperCase() === "BOARD" &&
    !label.toLowerCase().includes("board")
  ) {
    label = `${label}, Board of Directors`;
  }

  const prefixes: string[] = [];

  if (historical && !label.toLowerCase().startsWith("former ")) {
    prefixes.push("Former");
  }

  const statusPrefix = getAssignmentStatusPrefix(a);
  if (
    statusPrefix &&
    !label.toLowerCase().startsWith(statusPrefix.toLowerCase())
  ) {
    prefixes.push(statusPrefix[0].toUpperCase() + statusPrefix.slice(1).toLowerCase());
  }

  return prefixes.length ? `${prefixes.join(" ")} ${label}` : label;
}

function dedupeRoles(roles: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const role of roles) {
    const clean = String(role ?? "").trim();
    if (!clean) continue;

    const key = roleMatchKey(clean);
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(clean);
  }

  return out;
}

function removeRoles(source: string[], toRemove: string[]) {
  const removeSet = new Set(toRemove.map((r) => roleMatchKey(r)));
  return source.filter((role) => !removeSet.has(roleMatchKey(role)));
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
  asOf: Date = new Date(),
  /** Optional: roles derived from programMap / productionMap for this profile. */
  projectRoles: string[] = []
): string[] {
  const pid = normRoleText(String(profileId ?? ""));
  const rawExisting = dedupeRoles(
    Array.isArray(existingRoles) ? existingRoles.map(expandDisplayRole) : []
  );
  const cleanProjectRoles = dedupeRoles(
    projectRoles.map((r) => expandDisplayRole(r.trim())).filter(Boolean)
  );

  if (!pid) {
    // No Role-Assignments available; merge project roles into existing.
    if (rawExisting.length > 0) {
      const extraProject = removeRoles(cleanProjectRoles, rawExisting);
      return dedupeRoles([rawExisting[0], ...rawExisting.slice(1), ...extraProject]);
    }
    return dedupeRoles(cleanProjectRoles);
  }

  const relevant = assignments.filter(
    (a) =>
      normRoleText(String(a.profileId ?? "")) === pid &&
      // Board roles always surface regardless of showOnProfile — board membership is significant
      (a.showOnProfile !== false || String(a.roleCode ?? "").trim().toUpperCase() === "BOARD")
  );

  // When any Role-Assignment history exists for this person, suppress stale
  // DAT-managed roles from Profile-Live (prevents deleted/ended assignments from
  // leaking back through the profile). Also enforce DCP > MCP ordering.
  const currentExisting = sortRolesByPriority(
    relevant.length > 0
      ? rawExisting.filter((r) => !isDatStyleRole(r))
      : rawExisting
  );

  const current = relevant.filter((a) => isActive(a, asOf)).sort(compareCurrent);
  const historical = relevant
    .filter((a) => !isActive(a, asOf) && !isFuture(a, asOf))
    .sort(compareHistorical);

  const currentLabels = dedupeRoles(
    current.map((a) => buildAssignmentRoleLabel(a))
  );
  const historicalLabels = dedupeRoles(
    historical.map((a) => buildAssignmentRoleLabel(a, { historical: true }))
  );

  // If there is a current role in Role-Assignments, it becomes primary.
  // Historical DAT roles come next, then project/history roles, then
  // remaining Profile-Live roles — but stale DAT-pattern Profile-Live
  // roles are dropped to prevent deleted assignments from leaking back in.
  if (currentLabels.length > 0) {
    const covered = [...currentLabels, ...historicalLabels];

    const remainingExisting = removeRoles(currentExisting, covered).filter(
      (role) => !isDatStyleRole(role)
    );

    const remainingProject = removeRoles(cleanProjectRoles, [
      ...covered,
      ...remainingExisting,
    ]);

    return dedupeRoles([
      ...currentLabels,
      ...historicalLabels,
      ...remainingProject,
      ...remainingExisting,
    ]);
  }

  // No current Role-Assignment: preserve Profile-Live primary, fold in
  // historical assignments and project roles underneath it.
    const preservedExisting =
    relevant.length > 0
        ? currentExisting.filter((r) => !isDatStyleRole(r))
        : currentExisting;

    if (preservedExisting.length > 0) {
    const extraProject = removeRoles(cleanProjectRoles, [
        ...preservedExisting,
        ...historicalLabels,
    ]);
    return dedupeRoles([
        preservedExisting[0],
        ...historicalLabels,
        ...extraProject,
        ...preservedExisting.slice(1),
    ]);
    }

    if (relevant.length > 0) {
    const extraProject = removeRoles(cleanProjectRoles, historicalLabels);
    return dedupeRoles([...extraProject, ...historicalLabels]);
    }

    const extraProject = removeRoles(cleanProjectRoles, historicalLabels);
    return dedupeRoles([...historicalLabels, ...extraProject]);
}

/**
 * Returns the most specific active board role label for a profile (e.g., "Treasurer, Board of Directors").
 * Unlike getOrderedProfileRoles, this always surfaces BOARD roles regardless of showOnProfile.
 * Used to ensure board titles appear in visible role/title output.
 */
export function getBoardRoleLabelForProfile(
  profileId: string | undefined,
  assignments: RoleAssignmentRow[],
  asOf: Date = new Date()
): string | null {
  const pid = normRoleText(String(profileId ?? ""));
  if (!pid) return null;

  const boardActive = assignments
    .filter(
      (a) =>
        normRoleText(String(a.profileId ?? "")) === pid &&
        String(a.roleCode ?? "").trim().toUpperCase() === "BOARD" &&
        isActive(a, asOf)
    )
    .sort(compareCurrent);

  return boardActive.length ? buildAssignmentRoleLabel(boardActive[0]) : null;
}

export function getPrimaryDatRoleForProfile(
  profileId: string | undefined,
  existingRoles: string[] | undefined,
  assignments: RoleAssignmentRow[],
  asOf: Date = new Date()
): string {
  return getOrderedProfileRoles(profileId, existingRoles, assignments, asOf)[0] || "";
}

/**
 * Returns true if the given profileId has an active BOARD assignment in Role-Assignments.
 * Used to derive "Board Member" status flag automatically without manual Profile-Live duplication.
 */
export function deriveBoardStatus(
  profileId: string | undefined,
  assignments: RoleAssignmentRow[],
  asOf: Date = new Date()
): boolean {
  const pid = normRoleText(String(profileId ?? ""));
  if (!pid) return false;
  return assignments.some(
    (a) =>
      normRoleText(String(a.profileId ?? "")) === pid &&
      String(a.roleCode ?? "").trim().toUpperCase() === "BOARD" &&
      isActive(a, asOf) &&
      a.showOnProfile !== false
  );
}