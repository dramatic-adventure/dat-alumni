import type { DramaClub } from "@/lib/dramaClubMap";
import type { RoleAssignmentRow } from "@/lib/loadRoleAssignments";

export type PersonRef = {
  name: string;
  href?: string;
  avatarSrc?: string;
  headshotUrl?: string;
  subtitle?: string;
  profileId?: string;
};

function normKey(s?: string) {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function splitScopeList(s?: string) {
  return String(s ?? "")
    .split(/[,\n;|]+/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normClubScopeKey(s?: string) {
  const raw = (s ?? "").toLowerCase().trim();
  if (!raw) return "";

  const noPath = raw
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/?drama-?club\/?/i, "");

  const noSuffix = noPath.replace(/-?drama-?club$/i, "");

  return normKey(noSuffix);
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

function isPast(a: RoleAssignmentRow, asOf: Date) {
  const end = parseISOEnd(a.endDate);
  return !!end && asOf > end;
}

function startOfYear(year: number) {
  return new Date(`${year}-01-01T00:00:00.000`);
}

function endOfYear(year: number) {
  return new Date(`${year}-12-31T23:59:59.999`);
}

function overlapsWindow(a: RoleAssignmentRow, start: Date, end: Date) {
  const aStart = parseISOStart(a.startDate);
  const aEnd = parseISOEnd(a.endDate);

  if (aStart && aStart > end) return false;
  if (aEnd && aEnd < start) return false;
  return true;
}

function endsBeforeWindow(a: RoleAssignmentRow, start: Date) {
  const aEnd = parseISOEnd(a.endDate);
  return !!aEnd && aEnd < start;
}

function wasActiveOn(a: RoleAssignmentRow, when: Date) {
  return isActive(a, when);
}

function getLeadTeamMode(
  club: DramaClub,
  asOf: Date
):
  | { mode: "legacy"; start: Date; end: Date; clubBegin: Date }
  | { mode: "current"; asOf: Date } {
  const status = club.statusOverride ?? club.status;
  const firstYear = club.firstYearActive;
  const lastYear = club.lastYearActive;

  if (
    status === "legacy" &&
    typeof firstYear === "number" &&
    typeof lastYear === "number"
  ) {
    return {
      mode: "legacy",
      start: startOfYear(firstYear),
      end: endOfYear(lastYear),
      clubBegin: startOfYear(firstYear),
    };
  }

  return { mode: "current", asOf };
}

function isGlobalScopeKey(scopeKey: string) {
  const k = normKey(scopeKey);
  return k === "" || k === "dat" || k === "global" || k === "all";
}

function normScopeType(v: unknown) {
  return String(v ?? "").trim().toUpperCase();
}

function normRoleCode(v: unknown) {
  return String(v ?? "").trim().toUpperCase();
}

function scopeKeyMatchesClub(scopeKeyRaw: string, clubScopeKey: string) {
  return splitScopeList(scopeKeyRaw).some(
    (part) => normClubScopeKey(part) === clubScopeKey
  );
}

function scopeKeyMatchesCountry(scopeKeyRaw: string, countryLabelKey: string) {
  return splitScopeList(scopeKeyRaw).some(
    (part) => normKey(part) === countryLabelKey
  );
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

function shouldPrefixLeadTeamStatus(status?: string) {
  const s = String(status ?? "").trim().toLowerCase();
  return s === "interim" || s === "acting" || s === "incoming";
}

function getLeadTeamStatusPrefix(roleDetails?: string) {
  const details = String(roleDetails ?? "").trim();
  return shouldPrefixLeadTeamStatus(details) ? details : "";
}

function getLeadTeamContextualLabel(
  club: DramaClub,
  roleCode: string,
  roleDetails?: string
) {
  const details = String(roleDetails ?? "").trim();
  if (details && !shouldPrefixLeadTeamStatus(details)) return details;

  if (roleCode === "MCP" || roleCode === "DCP") {
    return club.country?.trim() || "";
  }

  return "";
}

function roleSubtitle(
  roleCodeRaw: string,
  club: DramaClub,
  roleLabel?: string,
  roleDetails?: string
) {
  const explicitRoleLabel = String(roleLabel ?? "").trim();
  const city = club.city?.trim();
  const country = club.country?.trim();
  const fallbackLoc = city && country ? `${city}, ${country}` : city || country || "";

  const roleCode = normRoleCode(roleCodeRaw);

  const base =
    explicitRoleLabel && !isPlaceholderRoleLabel(explicitRoleLabel)
      ? explicitRoleLabel
      : roleCode === "TAIR"
        ? "Teaching Artist in Residence"
        : roleCode === "MCP"
          ? "Manager of Community Partnerships"
          : roleCode === "DCP"
            ? "Director of Community Partnerships"
            : roleCode === "DCL"
              ? "Director of Creative Learning"
              : "";

  const contextual = getLeadTeamContextualLabel(club, roleCode, roleDetails);
  const statusPrefix = getLeadTeamStatusPrefix(roleDetails);

  let label = base;

  if (contextual) {
    const baseLower = base.toLowerCase();
    const contextualLower = contextual.toLowerCase();

    if (baseLower && contextualLower.includes(baseLower)) label = contextual;
    else if (roleCode === "MCP" || roleCode === "DCP") label = `${base} in ${contextual}`;
    else if (roleCode === "TAIR" || roleCode === "DCL") label = `${base} — ${contextual}`;
    else label = base ? `${base} — ${contextual}` : contextual;
  } else if (!label) {
    if (roleCode === "TAIR") {
      label = fallbackLoc
        ? `Teaching Artist in Residence — ${fallbackLoc}`
        : "Teaching Artist in Residence";
    } else if (roleCode === "MCP") {
      label = country
        ? `Manager of Community Partnerships in ${country}`
        : "Manager of Community Partnerships";
    } else if (roleCode === "DCP") {
      label = "Director of Community Partnerships";
    } else if (roleCode === "DCL") {
      label = "Director of Creative Learning";
    }
  }

  if (statusPrefix && !label.toLowerCase().startsWith(statusPrefix.toLowerCase())) {
    label = `${statusPrefix[0].toUpperCase()}${statusPrefix.slice(1).toLowerCase()} ${label}`;
  }

  return label;
}

function pickAvatarSrc(p: unknown): string | undefined {
  const rec = (p ?? {}) as Record<string, unknown>;

  const raw =
    rec["avatarSrc"] ??
    rec["headshotUrl"] ??
    rec["headshotURL"] ??
    rec["headshot"] ??
    rec["imageUrl"] ??
    rec["photoUrl"] ??
    rec["photoURL"];

  if (typeof raw !== "string") return undefined;

  const src = raw.trim();
  if (!src) return undefined;

  const withProto = src.startsWith("//") ? `https:${src}` : src;
  const https = withProto.replace(/^http:\/\//i, "https://");

  if (!https.startsWith("http") && !https.startsWith("/")) return `/${https}`;

  return https;
}

function compareCoreAssignments(a: RoleAssignmentRow, b: RoleAssignmentRow) {
  const display = (b.displayOrder ?? -999) - (a.displayOrder ?? -999);
  if (display !== 0) return display;

  const aStart = parseISOStart(a.startDate)?.getTime() ?? 0;
  const bStart = parseISOStart(b.startDate)?.getTime() ?? 0;
  if (aStart !== bStart) return bStart - aStart;

  return String(a.roleLabel ?? "").localeCompare(String(b.roleLabel ?? ""));
}

function comparePastCoreAssignments(a: RoleAssignmentRow, b: RoleAssignmentRow) {
  const aEnd = parseISOEnd(a.endDate)?.getTime() ?? 0;
  const bEnd = parseISOEnd(b.endDate)?.getTime() ?? 0;
  if (aEnd !== bEnd) return bEnd - aEnd;

  return compareCoreAssignments(a, b);
}

function compareLegacyCoreAssignments(
  a: RoleAssignmentRow,
  b: RoleAssignmentRow,
  clubBegin: Date
) {
  const aAtBegin = wasActiveOn(a, clubBegin);
  const bAtBegin = wasActiveOn(b, clubBegin);
  if (aAtBegin !== bAtBegin) return aAtBegin ? -1 : 1;

  return compareCoreAssignments(a, b);
}

function compareLegacyTAIR(
  a: RoleAssignmentRow,
  b: RoleAssignmentRow,
  clubBegin: Date
) {
  const aAtBegin = wasActiveOn(a, clubBegin);
  const bAtBegin = wasActiveOn(b, clubBegin);
  if (aAtBegin !== bAtBegin) return aAtBegin ? -1 : 1;

  return compareCurrentTAIR(a, b);
}

function compareCurrentTAIR(a: RoleAssignmentRow, b: RoleAssignmentRow) {
  const aStart = parseISOStart(a.startDate)?.getTime() ?? 0;
  const bStart = parseISOStart(b.startDate)?.getTime() ?? 0;
  if (aStart !== bStart) return bStart - aStart;

  const display = (b.displayOrder ?? -999) - (a.displayOrder ?? -999);
  if (display !== 0) return display;

  return String(a.profileId ?? "").localeCompare(String(b.profileId ?? ""));
}

function compareUpcomingTAIR(a: RoleAssignmentRow, b: RoleAssignmentRow) {
  const aStart = parseISOStart(a.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const bStart = parseISOStart(b.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  if (aStart !== bStart) return aStart - bStart;

  return String(a.profileId ?? "").localeCompare(String(b.profileId ?? ""));
}

function comparePastTAIR(a: RoleAssignmentRow, b: RoleAssignmentRow) {
  const aEnd = parseISOEnd(a.endDate)?.getTime() ?? 0;
  const bEnd = parseISOEnd(b.endDate)?.getTime() ?? 0;
  if (aEnd !== bEnd) return bEnd - aEnd;

  return String(a.profileId ?? "").localeCompare(String(b.profileId ?? ""));
}

function toPersonRef(
  assignment: RoleAssignmentRow | undefined,
  club: DramaClub,
  peopleById: Record<string, PersonRef>
): PersonRef | null {
  if (!assignment) return null;

  const pid = String(assignment.profileId ?? "").trim();
  if (!pid) return null;

  const person = peopleById[pid];
  if (!person?.name) return null;

  return {
    ...person,
    profileId: pid,
    avatarSrc: pickAvatarSrc(person) || person.avatarSrc,
    subtitle: roleSubtitle(
      assignment.roleCode,
      club,
      assignment.roleLabel,
      assignment.roleDetails
    ),
  };
}

function dedupePeople(people: Array<PersonRef | null | undefined>) {
  const out: PersonRef[] = [];
  const seen = new Set<string>();

  for (const person of people) {
    if (!person?.name) continue;

    const key = String(person.profileId ?? person.href ?? person.name).trim().toLowerCase();
    if (!key || seen.has(key)) continue;

    seen.add(key);
    out.push(person);
  }

  return out;
}

export function buildDramaClubLeadTeam(
  club: DramaClub,
  assignments: RoleAssignmentRow[],
  peopleById: Record<string, PersonRef>,
  asOf: Date = new Date()
): PersonRef[] {
  const clubSlug = (club as unknown as { slug?: string }).slug;
  const clubId = (club as unknown as { id?: string }).id;

  const clubScopeKey = normClubScopeKey(clubSlug || clubId || "");
  const countryLabelKey = normKey(club.country);

  const leadTeamMode = getLeadTeamMode(club, asOf);

  const visible = assignments.filter((a) => a.showOnProfile !== false);

  const active =
  leadTeamMode.mode === "legacy"
    ? visible.filter((a) => overlapsWindow(a, leadTeamMode.start, leadTeamMode.end))
    : visible.filter((a) => isActive(a, leadTeamMode.asOf));

const dcpCurrent = active
  .filter(
    (a) =>
      normRoleCode(a.roleCode) === "DCP" &&
      normScopeType(a.scopeType) === "GLOBAL" &&
      isGlobalScopeKey(String(a.scopeKey ?? ""))
  )
  .sort((a, b) =>
    leadTeamMode.mode === "legacy"
      ? compareLegacyCoreAssignments(a, b, leadTeamMode.clubBegin)
      : compareCoreAssignments(a, b)
  )[0];

  const dcpPast =
    leadTeamMode.mode === "legacy"
      ? visible
          .filter(
            (a) =>
              normRoleCode(a.roleCode) === "DCP" &&
              normScopeType(a.scopeType) === "GLOBAL" &&
              isGlobalScopeKey(String(a.scopeKey ?? "")) &&
              endsBeforeWindow(a, leadTeamMode.start)
          )
          .sort(comparePastCoreAssignments)[0]
      : undefined;

  const dcp = dcpCurrent ?? dcpPast;

const mcpCurrent = active
  .filter(
    (a) =>
      normRoleCode(a.roleCode) === "MCP" &&
      normScopeType(a.scopeType) === "COUNTRY" &&
      scopeKeyMatchesCountry(String(a.scopeKey ?? ""), countryLabelKey)
  )
  .sort((a, b) =>
    leadTeamMode.mode === "legacy"
      ? compareLegacyCoreAssignments(a, b, leadTeamMode.clubBegin)
      : compareCoreAssignments(a, b)
  )[0];

  const mcpPast =
    leadTeamMode.mode === "legacy"
      ? visible
          .filter(
            (a) =>
              normRoleCode(a.roleCode) === "MCP" &&
              normScopeType(a.scopeType) === "COUNTRY" &&
              scopeKeyMatchesCountry(String(a.scopeKey ?? ""), countryLabelKey) &&
              endsBeforeWindow(a, leadTeamMode.start)
          )
          .sort(comparePastCoreAssignments)[0]
      : undefined;

  const mcp = mcpCurrent ?? mcpPast;

const dclCurrent = active
  .filter(
    (a) =>
      normRoleCode(a.roleCode) === "DCL" &&
      normScopeType(a.scopeType) === "GLOBAL" &&
      isGlobalScopeKey(String(a.scopeKey ?? ""))
  )
  .sort((a, b) =>
    leadTeamMode.mode === "legacy"
      ? compareLegacyCoreAssignments(a, b, leadTeamMode.clubBegin)
      : compareCoreAssignments(a, b)
  )[0];

const dclPast =
  leadTeamMode.mode === "legacy"
    ? visible
        .filter(
          (a) =>
            normRoleCode(a.roleCode) === "DCL" &&
            normScopeType(a.scopeType) === "GLOBAL" &&
            isGlobalScopeKey(String(a.scopeKey ?? "")) &&
            endsBeforeWindow(a, leadTeamMode.start)
        )
        .sort(comparePastCoreAssignments)[0]
    : undefined;

const dcl = dclCurrent ?? dclPast;

  const core = dedupePeople([
    toPersonRef(dcp, club, peopleById),
    toPersonRef(mcp, club, peopleById),
    toPersonRef(dcl, club, peopleById),
  ]);

  const used = new Set(core.map((p) => String(p.profileId ?? "").trim()).filter(Boolean));

  const tairBase = visible.filter((a) => {
    const pid = String(a.profileId ?? "").trim();
    if (!pid || used.has(pid)) return false;

    return (
      normRoleCode(a.roleCode) === "TAIR" &&
      normScopeType(a.scopeType) === "CLUB" &&
      scopeKeyMatchesClub(String(a.scopeKey ?? ""), clubScopeKey)
    );
  });

  const tairCurrent =
    leadTeamMode.mode === "legacy"
      ? tairBase
          .filter((a) => overlapsWindow(a, leadTeamMode.start, leadTeamMode.end))
          .sort((a, b) => compareLegacyTAIR(a, b, leadTeamMode.clubBegin))
      : tairBase.filter((a) => isActive(a, leadTeamMode.asOf)).sort(compareCurrentTAIR);
  const tairUpcoming: RoleAssignmentRow[] = [];
  const tairPast =
    leadTeamMode.mode === "legacy"
      ? tairBase
          .filter((a) => endsBeforeWindow(a, leadTeamMode.start))
          .sort(comparePastTAIR)
      : tairBase.filter((a) => isPast(a, leadTeamMode.asOf)).sort(comparePastTAIR);

  const fillers = dedupePeople([
    ...tairCurrent.map((a) => toPersonRef(a, club, peopleById)),
    ...tairUpcoming.map((a) => toPersonRef(a, club, peopleById)),
    ...tairPast.map((a) => toPersonRef(a, club, peopleById)),
  ]).filter((person) => !used.has(String(person.profileId ?? "").trim()));

  return [...core, ...fillers].slice(0, 3);
}