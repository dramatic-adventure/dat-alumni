// lib/buildDramaClubLeadTeam.ts
import type { DramaClub } from "@/lib/dramaClubMap";
import type { RoleAssignmentRow } from "@/lib/loadRoleAssignments";

export type PersonRef = {
  name: string;
  href?: string;

  // canonical field your UI expects
  avatarSrc?: string;

  // common aliases upstream might provide
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

/**
 * CLUB scope keys are the most error-prone (e.g. "shuar" vs "shuar-drama-club"
 * or someone pastes "/drama-club/shuar-drama-club").
 *
 * This normalizes those so they match either way.
 */
function normClubScopeKey(s?: string) {
  const raw = (s ?? "").toLowerCase().trim();
  if (!raw) return "";

  // Strip route-ish prefixes if someone pastes them
  const noPath = raw
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/?drama-?club\/?/i, "");

  // Strip common suffix variants
  const noSuffix = noPath.replace(/-?drama-?club$/i, "");

  return normKey(noSuffix);
}

// Parse inclusive date ranges safely.
// - startDate = start of that day (local)
// - endDate = END of that day (local), so "2025-12-19" is active all day
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

function roleSubtitle(roleCodeRaw: string, club: DramaClub, roleLabel?: string) {
  if (roleLabel?.trim()) return roleLabel.trim();

  const city = club.city?.trim();
  const country = club.country?.trim();
  const loc = city && country ? `${city}, ${country}` : city || country || "";

  const roleCode = normRoleCode(roleCodeRaw);

  if (roleCode === "RTA")
    return loc ? `Resident Teaching Artist — ${loc}` : "Resident Teaching Artist";
  if (roleCode === "TAIR")
    return loc ? `Teaching Artist-in-Residence — ${loc}` : "Teaching Artist-in-Residence";
  if (roleCode === "MCP")
    return country
      ? `Manager of Community Partnerships in ${country}`
      : "Manager of Community Partnerships";
  if (roleCode === "DCL") return "Director of Creative Learning";

  return "";
}

const ROLE_PRIORITY: Record<string, number> = {
  RTA: 10,
  TAIR: 20,
  MCP: 30,
  DCL: 40,
};

function scopeBucket(scopeTypeRaw: string) {
  const scopeType = normScopeType(scopeTypeRaw);
  if (scopeType === "CLUB") return 0;
  if (scopeType === "COUNTRY") return 1;
  return 2; // GLOBAL + anything unknown
}

// pick avatar from multiple possible keys and normalize URL
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

  // If someone stored "images/foo.png" without leading slash, fix it.
  if (!https.startsWith("http") && !https.startsWith("/")) return `/${https}`;

  return https;
}

export function buildDramaClubLeadTeam(
  club: DramaClub,
  assignments: RoleAssignmentRow[],
  peopleById: Record<string, PersonRef>,
  asOf: Date = new Date()
): PersonRef[] {
  // Prefer slug/id for matching. For CLUB scope, normalize as a “club scope key”
  const clubSlug = (club as unknown as { slug?: string }).slug;
  const clubId = (club as unknown as { id?: string }).id;

  const clubScopeKey = normClubScopeKey(clubSlug || clubId || "");
  const countryLabelKey = normKey(club.country);

  const eligible = assignments
    // If your sheet includes showOnProfile, respect it (undefined = show)
    .filter((a) => a.showOnProfile !== false)
    .filter((a) => isActive(a, asOf))
    .filter((a) => ["RTA", "TAIR", "MCP", "DCL"].includes(normRoleCode(a.roleCode)))
    .filter((a) => {
      const scopeType = normScopeType(a.scopeType);
      const scopeKeyRaw = String(a.scopeKey ?? "");

      if (scopeType === "CLUB") {
        // ✅ robust match: "shuar" matches "shuar-drama-club"
        return clubScopeKey.length > 0 && normClubScopeKey(scopeKeyRaw) === clubScopeKey;
      }

      if (scopeType === "COUNTRY") return normKey(scopeKeyRaw) === countryLabelKey;
      if (scopeType === "GLOBAL") return isGlobalScopeKey(scopeKeyRaw);

      return false;
    });

  // one person only once (best role wins)
  const bestByProfile = new Map<string, RoleAssignmentRow>();

  for (const a of eligible) {
    const pid = String(a.profileId ?? "").trim();
    if (!pid) continue;

    const existing = bestByProfile.get(pid);

    const prA = ROLE_PRIORITY[normRoleCode(a.roleCode)] ?? 999;
    const prE = existing ? (ROLE_PRIORITY[normRoleCode(existing.roleCode)] ?? 999) : 999;

    if (!existing) {
      bestByProfile.set(pid, a);
      continue;
    }

    if (prA < prE) {
      bestByProfile.set(pid, a);
      continue;
    }

    if (prA === prE) {
      const da = a.displayOrder ?? 999;
      const de = existing.displayOrder ?? 999;
      if (da < de) bestByProfile.set(pid, a);
    }
  }

  const picked = Array.from(bestByProfile.values());

  picked.sort((a, b) => {
    const sb = scopeBucket(String(a.scopeType)) - scopeBucket(String(b.scopeType));
    if (sb !== 0) return sb;

    const pa = ROLE_PRIORITY[normRoleCode(a.roleCode)] ?? 999;
    const pb = ROLE_PRIORITY[normRoleCode(b.roleCode)] ?? 999;
    if (pa !== pb) return pa - pb;

    const od = (a.displayOrder ?? 999) - (b.displayOrder ?? 999);
    if (od !== 0) return od;

    // stable-ish tie-breaker
    return String(a.profileId).localeCompare(String(b.profileId));
  });

  return picked
    .map((a) => {
      const pid = String(a.profileId ?? "").trim();
      const p = peopleById[pid];
      if (!p?.name) return null;

      // Don’t wipe out an existing avatarSrc if pickAvatarSrc returns undefined
      const normalizedAvatar = pickAvatarSrc(p) ?? p.avatarSrc;

      return {
        ...p,
        profileId: pid,
        avatarSrc: normalizedAvatar,
        subtitle: roleSubtitle(String(a.roleCode), club, a.roleLabel),
      };
    })
    .filter(Boolean) as PersonRef[];
}
