import type { RoleAssignmentRow } from "@/lib/loadRoleAssignments";

/**
 * DAT role label substrings. Any Profile-Live role containing one of these is
 * considered a "DAT-managed" role and will be dropped from `remainingExisting`
 * when active Role-Assignment entries exist (prevents stale legacy roles from
 * leaking through after an assignment is removed from the sheet).
 */
const DAT_ROLE_FRAGMENTS = [
  "director of creative learning",
  "director of community partnerships",
  "manager of community partnerships",
  "teaching artist in residence",
  "resident teaching artist",
  "board of directors",
];

function isDatStyleRole(role: string): boolean {
  const lc = (role ?? "").toLowerCase();
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

  // For BOARD roles: always append ", Board of Directors" when the specific title
  // is used as base so the board context is never lost from the displayed label.
  if (String(a.roleCode ?? "").trim().toUpperCase() === "BOARD" &&
      !label.toLowerCase().includes("board")) {
    label = `${label}, Board of Directors`;
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
  asOf: Date = new Date(),
  /** Optional: roles derived from programMap / productionMap for this profile. */
  projectRoles: string[] = []
): string[] {
  const pid = normRoleText(String(profileId ?? ""));
  const rawExisting = dedupeRoles(Array.isArray(existingRoles) ? existingRoles : []);
  const cleanProjectRoles = dedupeRoles(
    projectRoles.map((r) => r.trim()).filter(Boolean)
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

  const currentLabels = dedupeRoles(current.map(buildAssignmentRoleLabel));
  const historicalLabels = dedupeRoles(historical.map(buildAssignmentRoleLabel));

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
  if (currentExisting.length > 0) {
    const extraProject = removeRoles(cleanProjectRoles, [
      ...currentExisting,
      ...historicalLabels,
    ]);
    return dedupeRoles([
      currentExisting[0],
      ...historicalLabels,
      ...extraProject,
      ...currentExisting.slice(1),
    ]);
  }

  // Fallback for profiles with no existing roles list.
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