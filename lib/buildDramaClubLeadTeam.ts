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

function isPast(a: RoleAssignmentRow, asOf: Date) {
  const end = parseISOEnd(a.endDate);
  return !!end && asOf > end;
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

function roleSubtitle(
  roleCodeRaw: string,
  club: DramaClub,
  roleLabel?: string,
  roleDetails?: string
) {
  const explicitRoleLabel = String(roleLabel ?? "").trim();
  const details = String(roleDetails ?? "").trim();
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

  if (details) {
    const baseLower = base.toLowerCase();
    const detailsLower = details.toLowerCase();

    if (baseLower && detailsLower.includes(baseLower)) return details;
    if (roleCode === "MCP" || roleCode === "DCP") return `${base} in ${details}`;
    if (roleCode === "TAIR" || roleCode === "DCL") return `${base} — ${details}`;
    return base ? `${base} — ${details}` : details;
  }

  if (base) return base;

  if (roleCode === "TAIR") {
    return fallbackLoc
      ? `Teaching Artist in Residence — ${fallbackLoc}`
      : "Teaching Artist in Residence";
  }

  if (roleCode === "MCP") {
    return country
      ? `Manager of Community Partnerships in ${country}`
      : "Manager of Community Partnerships";
  }

  if (roleCode === "DCP") {
    return "Director of Community Partnerships";
  }

  if (roleCode === "DCL") {
    return "Director of Creative Learning";
  }

  return "";
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

  const visible = assignments.filter((a) => a.showOnProfile !== false);

  const active = visible.filter((a) => isActive(a, asOf));

  const dcp = active
    .filter(
      (a) =>
        normRoleCode(a.roleCode) === "DCP" &&
        normScopeType(a.scopeType) === "GLOBAL" &&
        isGlobalScopeKey(String(a.scopeKey ?? ""))
    )
    .sort(compareCoreAssignments)[0];

  const mcp = active
    .filter(
      (a) =>
        normRoleCode(a.roleCode) === "MCP" &&
        normScopeType(a.scopeType) === "COUNTRY" &&
        scopeKeyMatchesCountry(String(a.scopeKey ?? ""), countryLabelKey)
    )
    .sort(compareCoreAssignments)[0];

  const dcl = active
    .filter(
      (a) =>
        normRoleCode(a.roleCode) === "DCL" &&
        normScopeType(a.scopeType) === "GLOBAL" &&
        isGlobalScopeKey(String(a.scopeKey ?? ""))
    )
    .sort(compareCoreAssignments)[0];

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

  const tairCurrent = tairBase.filter((a) => isActive(a, asOf)).sort(compareCurrentTAIR);
  const tairUpcoming = tairBase.filter((a) => isFuture(a, asOf)).sort(compareUpcomingTAIR);
  const tairPast = tairBase.filter((a) => isPast(a, asOf)).sort(comparePastTAIR);

  const fillers = dedupePeople([
    ...tairCurrent.map((a) => toPersonRef(a, club, peopleById)),
    ...tairUpcoming.map((a) => toPersonRef(a, club, peopleById)),
    ...tairPast.map((a) => toPersonRef(a, club, peopleById)),
  ]).filter((person) => !used.has(String(person.profileId ?? "").trim()));

  return [...core, ...fillers].slice(0, 3);
}