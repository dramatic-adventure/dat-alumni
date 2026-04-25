// lib/titles.ts
import type { AlumniRow } from "@/lib/types";

/** Basic utils */
export function slugifyTitle(input: string) {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['".]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Split on commas, slashes, pipes, semicolons, middots/bullets, long dashes (NOT the hyphen) */
export function splitTitles(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\u2215/|;·•—–\n\r]+/g) // keep hyphenated titles intact; also split on newlines (multi-line Sheets cells)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Split a `currentTitle` string into individual titles WITHOUT splitting on commas.
 *
 * Commas are intentionally excluded because a single professional title commonly
 * contains a comma (e.g. "Executive Director, Dramatic Adventure Theatre" or
 * "Co-Founder, President"). Splitting on commas would create spurious second
 * titles from what is actually one continuous title string.
 *
 * Multiple outside titles should be separated by semicolons or newlines.
 */
export function splitCurrentTitles(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\u2215/|;·•—–\n\r]+/g) // same as splitTitles but WITHOUT comma
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitRoleTokensForBuckets(raw?: string | null): string[] {
  const s = String(raw || "").trim();
  if (!s) return [];

  if (/\bboard of directors\b/i.test(s)) {
    return ["Board of Directors"];
  }

  return splitTitles(s);
}

/** Irregulars + simple pluralization */
const irregular: Record<string, string> = {
  actress: "Actresses",
  actor: "Actors",
  playwright: "Playwrights",
  dramaturg: "Dramaturgs",
  composer: "Composers",
  designer: "Designers",
  designers: "Designers",                // ✅ normalize plural too
  "stage manager": "Stage Managers",
  "stage managers": "Stage Managers",    // ✅ normalize plural too
  "assistant stage manager": "Stage Managers",
  "production stage manager": "Stage Managers",
  "teaching artist": "Teaching Artists",
  "teaching artists": "Teaching Artists",// ✅ normalize plural too
  director: "Directors",
  "artistic director": "Artistic Directors",
  "associate artistic director": "Associate Artistic Directors",
  "executive director": "Executive Directors",
  "executive directors": "Executive Directors", // ✅ normalize plural too
  "resident playwright": "Playwrights",
  writer: "Travel Writers",              // generic "Writer" → Travel Writers
  "legal council": "Legal Council",      // stays singular
  // ✅ Founding roles — self-referential so they keep clean labels
  "founding member": "Founding Members",
  "co-founder": "Co-Founders",
  "cofounder": "Co-Founders",
  "co-founders": "Co-Founders",
  "cofounders": "Co-Founders",
  // ✅ Board — plural is the same string (it's a collective noun)
  "board of directors": "Board of Directors",
};

export function pluralizeToken(token: string): string {
  const lc = token.toLowerCase();
  if (irregular[lc]) return irregular[lc];

  // If ends with 'designer' → Designers
  if (/\bdesigner\b/i.test(token)) return "Designers";

  // default English-ish plural
  if (/\b([sxz]|[cs]h)\b/i.test(token)) return token + "es";
  if (/\b[^aeiou]y\b/i.test(token)) return token.replace(/y$/i, "ies");
  return token + "s";
}

/** Excluded titles (don’t create buttons for these) */
const EXCLUDED_TITLES = new Set([
  "intern",
  "fellow",
  "volunteer",
  "cos", // no COS button
  // ✅ Emeritus is a modifier/status, not a standalone DAT title bucket.
  //    "Executive Director Emeritus" is routed to executive-directors via its own pattern.
  "emeritus",
  "emerituss",        // typo variant in source data
  "member emeritus",  // EM code expansion; no standalone bucket needed
  "member emerituss", // typo-plural variant
]);

/** Canonical buckets (keys → display label, icon, color) */
export type TitleBucketKey =
  | "managers-community-partnerships"
  | "partners"
  | "teaching-artists"
  | "executive-directors"
  | "board-of-directors"
  | "stage-managers"
  | "designers"
  | "travel-writers"
  | "playwrights"
  | "special-event-hosts"
  | "staff"
  // dynamic DAT role fallbacks:
  | `title:${string}`
  // professional pathway buckets (generated from currentTitle):
  | `pathway:${string}`;

export interface BucketMeta {
  key: TitleBucketKey;
  label: string;
  icon: string;
  color: string;
}

/** Core, fixed buckets — ALL unique emoji + color (curated) */
export const FIXED_BUCKETS: Record<
  Exclude<TitleBucketKey, `title:${string}` | `pathway:${string}`>,
  BucketMeta
> = {
  "executive-directors": {
    key: "executive-directors",
    label: "Executive Directors",
    icon: "🏛️",
    color: "#8B0000", // dark red
  },
  "board-of-directors": {
    key: "board-of-directors",
    label: "Board of Directors",
    icon: "🪑",
    color: "#4A0080", // deep violet
  },
  "managers-community-partnerships": {
    key: "managers-community-partnerships",
    label: "Managers of Community Partnerships",
    icon: "🤝",
    color: "#2E8B57", // sea green
  },
  "teaching-artists": {
    key: "teaching-artists",
    label: "Teaching Artists",
    icon: "🧑‍🏫",
    color: "#0066CC", // bright blue
  },
  "stage-managers": {
    key: "stage-managers",
    label: "Stage Managers",
    icon: "🎧",
    color: "#8B4513", // saddle brown
  },
  designers: {
    key: "designers",
    label: "Designers",
    icon: "🎨",
    color: "#9932CC", // purple
  },
  "travel-writers": {
    key: "travel-writers",
    label: "Travel Writers",
    icon: "🧳",
    color: "#4682B4", // steel blue
  },
  playwrights: {
    key: "playwrights",
    label: "Playwrights",
    icon: "🖋️",
    color: "#FF8C00", // dark orange
  },
  "special-event-hosts": {
    key: "special-event-hosts",
    label: "Special Event Hosts",
    icon: "🎤",
    color: "#FFD700", // gold
  },
  partners: {
    key: "partners",
    label: "Partners",
    icon: "🌐",
    color: "#708090", // slate gray
  },
  staff: {
    key: "staff",
    label: "Staff",
    icon: "🏢",
    color: "#3E3A36", // matches flags.ts Staff color
  },
};

/** Curated emojis for common dynamic (title:*) buckets — all distinct */
const CURATED_DYNAMIC_EMOJI: Record<string, string> = {
  actors: "🎭",
  actresses: "🎭",
  directors: "🎬",
  dramaturgs: "📚",
  composers: "🎼",
  producers: "🎛️",
  editors: "✂️",
  choreographers: "🩰",
  dancers: "🕺",
  musicians: "🎹",
  photographers: "📷",
  videographers: "📹",
  cinematographers: "🎥",
  designers: "🎨",
  "stage managers": "🎧",
  hosts: "🎤",
};

/** ---- Dynamic Emoji + Color helpers ---- **/

// Distinct, neutral fallback emojis (no star)
const FALLBACK_ICONS = ["📌", "🟣", "🔸", "🌀", "📎", "🧭", "💠", "🧱"];
const usedFallbackIcons = new Set<string>(); // ensures no duplicates across dynamic buckets

// Optional keyword color nudges for dynamics (will fallback to palette if taken)
const KEYWORD_COLORS: Array<[RegExp, string]> = [
  [/\bactor|actress|performer\b/i, "#924E75"], // plum
  [/\bdirector\b/i, "#6C00AF"],                // deep purple
  [/\bwriter|playwright\b/i, "#008080"],       // teal
  [/\bdesigner\b/i, "#5E35B1"],                // indigo variant
  [/\bstage manager\b/i, "#795548"],           // brown variant
  [/\bcomposer\b/i, "#1E88E5"],                // blue
  [/\bdramaturg\b/i, "#455A64"],               // blue gray
  [/\bhost\b/i, "#E65100"],                    // deep orange
];

// A deterministic color palette for dynamic buckets (no duplicates preferred)
const DYNAMIC_COLOR_PALETTE = [
  "#D81B60", "#1E88E5", "#43A047", "#F4511E", "#6D4C41",
  "#3949AB", "#00ACC1", "#C0CA33", "#7CB342", "#FF7043",
  "#8D6E63", "#5E35B1", "#26A69A", "#FDD835", "#AB47BC",
];

// Tiny stable hash for deterministic seeding
function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Helper: normalize for matching */
function norm(s: string) {
  return s.trim().toLowerCase();
}

/** Does this token/title look like a status role we exclude? */
function isExcludedTitleToken(token: string): boolean {
  const t = token.toLowerCase();
  if (EXCLUDED_TITLES.has(t)) return true;
  if (EXCLUDED_TITLES.has(t.replace(/s$/, ""))) return true; // obvious plurals
  return false;
}

/** Distinct emoji chooser for dynamic buckets */
function guessIconForLabel(label: string): string {
  const l = label.trim().toLowerCase();

  // 1) Exact curated match (labels are plural for dynamic buckets)
  if (CURATED_DYNAMIC_EMOJI[l]) return CURATED_DYNAMIC_EMOJI[l];

  // 2) Keyword heuristics (kept for safety if label wording varies)
  if (/\bactor|actress|performer\b/.test(l)) return "🎭";
  if (/\bdirector\b/.test(l)) return "🎬";
  if (/\bwriter|playwright\b/.test(l)) return "✍️";
  if (/\bdesigner\b/.test(l)) return "🎨";
  if (/\bstage manager\b/.test(l)) return "🎧";
  if (/\bcomposer\b/.test(l)) return "🎼";
  if (/\bdramaturg\b/.test(l)) return "📚";
  if (/\bphotograph|photo|photographer\b/.test(l)) return "📷";
  if (/\bvideo|videograph|videographer\b/.test(l)) return "📹";
  if (/\bcinematograph|cinematographer|dp\b/.test(l)) return "🎥";
  if (/\bproducer\b/.test(l)) return "🎛️";
  if (/\bedit(or|ing)\b/.test(l)) return "✂️";
  if (/\bchoreograph|choreographer|dance\b/.test(l)) return "🩰";
  if (/\bmusician|music\b/.test(l)) return "🎹";
  if (/\bhost|emcee|moderator\b/.test(l)) return "🎤";

  // 3) Rotating fallback (no duplicates, no star)
  const seed = l.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  for (let i = 0; i < FALLBACK_ICONS.length; i++) {
    const icon = FALLBACK_ICONS[(seed + i) % FALLBACK_ICONS.length];
    if (!usedFallbackIcons.has(icon)) {
      usedFallbackIcons.add(icon);
      return icon;
    }
  }
  // If we somehow run out, reuse deterministically (very unlikely)
  return FALLBACK_ICONS[seed % FALLBACK_ICONS.length];
}

/** Return all bucket keys a single title token belongs to */
export function bucketsForTitleToken(tokenRaw: string): TitleBucketKey[] {
  const token = tokenRaw.trim();
  const t = norm(token);

  // exclusions
  if (isExcludedTitleToken(t)) return [];

  // ✅ "Former X" tokens are status/historical modifiers — no standalone bucket.
  //    Historical director appearances are handled by the execDirStatus field mechanism.
  // ✅ Tokens containing "Emeritus" are status modifiers, not browse buckets.
  if (/^former\b/i.test(t) || /\bemeritus\b/i.test(t)) return [];

  // ✅ Staff admin titles: operational/administrative roles that belong in the broad
  //    Staff bucket (populated via datStaffStatus) — NOT singleton dynamic title buckets.
  if (isStaffAdminTitle(t)) return [];

  // ✅ "X Design" / "X Designs" (without "er") — suppress singleton design-noun buckets.
  //    Only "X Designer" forms route to the Designers bucket.
  if (/\bdesigns?\b/i.test(t) && !/\bdesigner\b/i.test(t)) return [];

  const buckets: TitleBucketKey[] = [];

  // Partners (specific)
  if (t === "artistic director (rotm theatre)") {
    buckets.push("partners");
    return buckets; // suppress standalone button
  }

  /** --- Merge-prone fixed buckets: force to fixed & early return --- */

  // Teaching Artists: singular + plural
  if (/\bteaching artist(s)?\b/i.test(t)) {
    buckets.push("teaching-artists");
    return buckets;
  }

  // Director of Creative Learning → teaching-artists only.
  // ✅ executive-directors is now populated exclusively via the execDirStatus field
  //    (Staff Role-Assignments with "Director" in the resolved title), not token routing.
  if (t === "director of creative learning") {
    buckets.push("teaching-artists");
    return buckets;
  }

  // Stage Managers: singular + plural, plus ASM/PSM
  if (
    /\bstage manager(s)?\b/i.test(t) ||
    t === "production stage manager" ||
    t === "assistant stage manager"
  ) {
    buckets.push("stage-managers");
    return buckets; // ✅ always fixed, no dynamic variant
  }

  // Designers: singular + plural, and any "* Designer"
  if (/\bdesigner(s)?\b/i.test(t)) {
    buckets.push("designers");
    return buckets; // ✅ always fixed, no dynamic variant
  }

  // ✅ Executive Director tokens: no token-based bucket.
  //    /title/executive-directors is populated exclusively by the execDirStatus field
  //    (Staff Role-Assignments where resolved title contains "Director").
  //    This prevents project roles, production credits, and legacy profile roles
  //    from polluting the executive-directors bucket.
  if (/\bexecutive director\b/i.test(t)) {
    return [];
  }

  /** --- Remaining fixed-bucket rules --- */

  // Playwrights: anything with "playwright" (incl. Resident Playwright)
  if (/\bplaywright\b/i.test(t)) {
    buckets.push("playwrights");
    return buckets;
  }

  // Travel Writers: anything with "writer" (incl. Response Team/Travel Writers)
  if (
    /\bwriter(s)?\b/i.test(t) ||
    /\bresponse team writer(s)?\b/i.test(t) ||
    /\btravel writer(s)?\b/i.test(t)
  ) {
    buckets.push("travel-writers");
    return buckets;
  }

  // Managers of Community Partnerships:
  // ✅ MCP/DCP titles route ONLY to their dedicated bucket.
  if (
    /\b(Manager|Director)\b.*\bof\b.*\bCommunity Partnerships\b/i.test(token) ||
    /\bCommunity Partnerships\b.*\b(Manager|Director)\b/i.test(token)
  ) {
    buckets.push("managers-community-partnerships");
    return buckets;
  }

  // Special Event Hosts: Travelogue Moderators / Emcees
  if (/\btravelogue\b/i.test(t) && (/\bmoderator\b/i.test(t) || /\bemcee\b/i.test(t))) {
    buckets.push("special-event-hosts");
    return buckets;
  }

  // Host / Hosts → merge into Special Event Hosts (not a separate generic bucket)
  if (/^hosts?$/i.test(t)) {
    buckets.push("special-event-hosts");
    return buckets;
  }

  // Artistic Director / Associate Artistic Director → directors bucket only.
  // ✅ executive-directors is handled by the execDirStatus field, not token routing.
  // Strip trailing parenthetical modifiers (e.g. "(On Hiatus)") before matching.
  const tBase = t.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (tBase === "artistic director" || tBase === "associate artistic director") {
    buckets.push("title:directors" as TitleBucketKey);
    return buckets;
  }

  // Board of Directors → dedicated fixed bucket
  if (t === "board of directors" || /\bboard\s+of\s+directors\b/i.test(t)) {
    buckets.push("board-of-directors");
    return buckets;
  }

  // Resident <X> → include in the <X>s default bucket as well
  if (/^resident\s+(.+)/i.test(token)) {
    const base = norm(token.replace(/^resident\s+/i, ""));
    const label = pluralizeToken(base);
    buckets.push(`title:${label.toLowerCase()}` as TitleBucketKey);
    return buckets;
  }

  // Founding Members: merge co-founder + founding member into one shared bucket
  if (/\b(founding member|co-?founder)\b/i.test(t)) {
    buckets.push("title:founding-members" as TitleBucketKey);
    return buckets;
  }

  // Producers: normalize all producer variants ("executive producer", "co-producer", etc.) to one bucket
  if (/\bproducer\b/i.test(t)) {
    buckets.push("title:producers" as TitleBucketKey);
    return buckets;
  }

  // Fallback: make a button for the token itself (pluralized)
  const plural = pluralizeToken(token);
  buckets.push(`title:${plural.toLowerCase()}` as TitleBucketKey);
  return buckets;
}

/** Bucket record type used in the map below */
export type BucketRecord = {
  meta: BucketMeta;
  people: Set<string>;
  subcats?: Map<string, Set<string>>; // used by Designers / Executive Directors
  /** Distinguishes DAT-assigned roles from alumni's present-day professional titles. */
  category: "dat-role" | "professional-pathway";
};

// ─── Staff admin title suppression ───────────────────────────────────────────
// These are operational/administrative job titles that should live in the broad
// Staff bucket — NOT create singleton dynamic DAT-role title buckets.
// Normalization: & → and, extra whitespace collapsed, before matching.
const STAFF_ADMIN_TITLE_RE =
  /^(engagement\s+(coordinator|manager)|development\s+(director|associate|manager)|program\s+(coordinator|manager)|communications?\s+(manager|director|coordinator)|outreach\s+(coordinator|manager)|development\s+director|operations?\s+manager|finance\s+(director|manager)|grants?\s+(manager|coordinator|writer)|deputy\s+director(\s+.*)?|(.+\s+)?engagement\s+(coordinator|manager)|development\s+(and\s+)?community\s+engagement)$/i;

function isStaffAdminTitle(t: string): boolean {
  // Normalize & → and and collapse whitespace before pattern matching so tokens
  // like "Artist & Alumni Engagement Coordinator" are reliably caught.
  const normalized = t.trim().toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ");
  return STAFF_ADMIN_TITLE_RE.test(normalized);
}

// ─── Professional Pathway junk filter ────────────────────────────────────────
// Exclude empty, too-short, symbol-only, or common placeholder currentTitle values
// from creating Professional Pathway buckets.
const JUNK_TITLE_RE =
  /^(n\/a|none|na|tbd|unknown|other|student|retired|unemployed|job\s+seeker)$/i;

function isJunkCurrentTitle(t: string): boolean {
  if (!t || t.length < 3) return true;
  if (!/[a-zA-Z]/.test(t)) return true;
  if (JUNK_TITLE_RE.test(t.trim())) return true;
  return false;
}

/** Build all buckets from alumni rows */
export function buildTitleBuckets(alumni: AlumniRow[]) {
  // Map<bucketKey, BucketRecord>
  const buckets = new Map<TitleBucketKey, BucketRecord>();

  // Track taken colors so we don’t duplicate (start with fixed)
  const usedColors = new Set<string>(
    Object.values(FIXED_BUCKETS).map((b) => b.color.toLowerCase())
  );

  // Seed fixed buckets (Designers and Executive Directors get subcats Maps)
  for (const key of Object.keys(FIXED_BUCKETS) as (keyof typeof FIXED_BUCKETS)[]) {
    const obj: BucketRecord = {
      meta: FIXED_BUCKETS[key],
      people: new Set<string>(),
      category: "dat-role",
    };
    if (key === "designers" || key === "executive-directors" || key === "staff") {
      obj.subcats = new Map<string, Set<string>>();
    }
    buckets.set(key, obj);
  }

  // Choose a distinct color for dynamic labels (deterministic; avoids usedColors)
  function colorForDynamic(label: string): string {
    const l = label.toLowerCase();

    // 1) Keyword nudges
    for (const [re, color] of KEYWORD_COLORS) {
      if (re.test(l) && !usedColors.has(color.toLowerCase())) {
        usedColors.add(color.toLowerCase());
        return color;
      }
    }

    // 2) Palette via hash seed → scan for first free
    const seed = hashString(l);
    const start = seed % DYNAMIC_COLOR_PALETTE.length;
    for (let i = 0; i < DYNAMIC_COLOR_PALETTE.length; i++) {
      const idx = (start + i) % DYNAMIC_COLOR_PALETTE.length;
      const c = DYNAMIC_COLOR_PALETTE[idx];
      if (!usedColors.has(c.toLowerCase())) {
        usedColors.add(c.toLowerCase());
        return c;
      }
    }

    // 3) Fallback (rare) — pick any palette color
    return DYNAMIC_COLOR_PALETTE[start];
  }

  // helper to ensure meta for dynamic title buckets (title:actors, title:directors, etc.)
  function ensureDynamicBucket(key: TitleBucketKey, labelFromKey?: string) {
    if (buckets.has(key)) return buckets.get(key)!;
    let label = labelFromKey ?? "";
    if (!label && key.startsWith("title:")) {
      const name = key.slice("title:".length);
      label = name
        .split("-")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(" ");
    }
    const meta: BucketMeta = {
      key,
      label,
      icon: guessIconForLabel(label),
      color: colorForDynamic(label), // ← unique color per dynamic label
    };
    const v: BucketRecord = { meta, people: new Set<string>(), category: "dat-role" };
    buckets.set(key, v);
    return v;
  }

  // helper to ensure meta for professional-pathway buckets (pathway:physical-therapists, etc.)
  function ensurePathwayBucket(key: TitleBucketKey, label: string) {
    if (buckets.has(key)) return buckets.get(key)!;
    const meta: BucketMeta = {
      key,
      label,
      icon: guessIconForLabel(label),
      color: colorForDynamic(label),
    };
    const v: BucketRecord = { meta, people: new Set<string>(), category: "professional-pathway" };
    buckets.set(key, v);
    return v;
  }

  for (const a of alumni) {
    const tokens = new Set(
      splitRoleTokensForBuckets(a.role).map((t) => t.trim()).filter(Boolean)
    );

    // Also include merged roles array when pre-populated (e.g. from Role-Assignments)
    for (const r of a.roles || []) {
      if (typeof r === "string") {
        for (const t of splitRoleTokensForBuckets(r)) {
          if (t.trim()) tokens.add(t.trim());
        }
      }
    }

    // ✅ currentTitle is intentionally NOT included here.
    //    DAT title buckets should only reflect DAT-assigned roles, not outside
    //    professional titles. currentTitle is not included in DAT Role buckets. It may still be used for search, matched-via labels, individual profile display, and Professional Pathways.

    for (const rawToken of tokens) {
      const keys = bucketsForTitleToken(rawToken);
      if (!keys.length) continue;

      for (const key of keys) {
        // ✅ executive-directors is now populated exclusively by the execDirStatus field
        //    below — skip any residual token routing for that bucket.
        if (key === "executive-directors") continue;

        const isFixed = key in FIXED_BUCKETS;
        const bucket = isFixed
          ? buckets.get(key as keyof typeof FIXED_BUCKETS)!
          : ensureDynamicBucket(key);

        bucket.people.add(a.slug); // de-dupe persons within a bucket

        // Designers subcategories: "<Something> Designer"
        if (key === "designers") {
          if (!bucket.subcats) bucket.subcats = new Map<string, Set<string>>();
          const m = rawToken.match(/^(.+)\s+designer$/i);
          const sub = m ? m[1].trim() : "General";
          const lc = sub.toLowerCase();
          if (!bucket.subcats.has(lc)) bucket.subcats.set(lc, new Set());
          bucket.subcats.get(lc)!.add(a.slug);
        }
      }
    }

    // ✅ Executive Directors bucket: populated from execDirStatus field only.
    //    Source: Staff Role-Assignments where resolved title contains "Director".
    //    Current/Past determined by Role-Assignments startDate/endDate.
    //    This is the ONLY place executive-directors gets populated — token routing
    //    for this bucket has been intentionally removed from bucketsForTitleToken.
    const execDirStatus = (a as any).execDirStatus as string | undefined;
    if (execDirStatus === "current" || execDirStatus === "past") {
      const execBucket = buckets.get("executive-directors")!;
      execBucket.people.add(a.slug);
      if (!execBucket.subcats) execBucket.subcats = new Map();
      if (!execBucket.subcats.has("current")) execBucket.subcats.set("current", new Set<string>());
      if (!execBucket.subcats.has("past"))    execBucket.subcats.set("past",    new Set<string>());

      if (execDirStatus === "current") {
        execBucket.subcats.get("current")!.add(a.slug);
        // Ensure they're not also in past if they have an active assignment
        execBucket.subcats.get("past")!.delete(a.slug);
      } else {
        // Only add to past if not already current
        if (!execBucket.subcats.get("current")!.has(a.slug)) {
          execBucket.subcats.get("past")!.add(a.slug);
        }
      }
    }

    // ✅ Staff bucket: populated from datStaffStatus (set by loadAlumniWithMergedRoles
    //    via getStaffStatusForProfile). Does NOT use role tokens — keeps admin job titles
    //    out of the DAT creative title bucket system.
    const staffStatus = (a as any).datStaffStatus as string | undefined;
    if (staffStatus === "current" || staffStatus === "past") {
      const staffBucket = buckets.get("staff")!;
      staffBucket.people.add(a.slug);
      if (!staffBucket.subcats) staffBucket.subcats = new Map();
      if (!staffBucket.subcats.has(staffStatus)) staffBucket.subcats.set(staffStatus, new Set());
      staffBucket.subcats.get(staffStatus)!.add(a.slug);
    }

    // ✅ Current Title → existing FIXED DAT Role buckets (when matched) + Professional Pathways.
    //
    //    If a currentTitle token matches an existing fixed DAT role bucket (e.g. "Playwright"
    //    → playwrights), the person appears in that bucket with a "via current title" label.
    //    This does NOT create new dynamic title:* buckets from currentTitle — only pathway:*
    //    buckets are generated from currentTitle for Professional Pathways.
    //
    //    executive-directors is intentionally excluded: that bucket requires Staff Role-Assignments,
    //    not a currentTitle self-report.
    const rawCt = (a as any).currentTitle ?? "";
    if (rawCt && typeof rawCt === "string") {
      for (const rawTitle of splitCurrentTitles(rawCt)) {
        const title = rawTitle.trim();
        if (isJunkCurrentTitle(title)) continue;

        // Route to fixed DAT role buckets when matched (no new dynamic buckets from currentTitle)
        const ctKeys = bucketsForTitleToken(title);
        for (const ctKey of ctKeys) {
          if (ctKey === "executive-directors") continue; // Staff Role-Assignments only
          if (!(ctKey in FIXED_BUCKETS)) continue;       // skip dynamic title:* keys
          const fixedBucket = buckets.get(ctKey as keyof typeof FIXED_BUCKETS);
          if (!fixedBucket) continue;
          fixedBucket.people.add(a.slug);
        }

        // Professional Pathways: always create pathway:* buckets from currentTitle
        const plural = pluralizeToken(title);
        const pathwayKey = `pathway:${slugifyTitle(plural)}` as TitleBucketKey;
        const pathwayBucket = ensurePathwayBucket(pathwayKey, plural);
        pathwayBucket.people.add(a.slug);
      }
    }
  }

  return buckets;
}

/** Compute preferred bucket route slug(s) for a raw title token */
export function getBucketSlugsForTitleToken(tokenRaw: string): string[] {
  const keys = bucketsForTitleToken(tokenRaw);
  const seen = new Set<string>();
  const out: string[] = [];

  for (const key of keys) {
    if (key.startsWith("title:")) {
      // dynamic bucket → label is after "title:" (e.g., "actors")
      const label = key.slice("title:".length);
      const slug = slugifyTitle(label);
      if (!seen.has(slug)) {
        seen.add(slug);
        out.push(slug);
      }
    } else {
      // fixed bucket keys are already the canonical slugs (e.g., "playwrights", "travel-writers", "designers")
      const slug = String(key);
      if (!seen.has(slug)) {
        seen.add(slug);
        out.push(slug);
      }
    }
  }

  return out;
}

/** Convenience: first bucket href for a single token (most titles map to exactly one) */
export function getBucketHrefForTitleToken(tokenRaw: string): string | null {
  const slugs = getBucketSlugsForTitleToken(tokenRaw);
  return slugs.length ? `/title/${slugs[0]}` : null;
}

/**
 * When a token broadly matches a dynamic bucket (e.g., "Artistic Director" → title:directors),
 * return the canonical concept label for the via: display instead of the raw token.
 * Falls back to the original token for exact/non-broad matches.
 */
function canonicalViaLabelForBucket(token: string, bk: TitleBucketKey): string {
  const t = token.toLowerCase();
  // "Artistic Director", "Associate Artistic Director", etc. → "Director" when appearing in title:directors
  if (bk === ("title:directors" as TitleBucketKey) && /\bdirector\b/i.test(t) && t !== "director") {
    return "Director";
  }
  return token;
}

/**
 * Given an alumni and a bucket key, returns which token caused them to appear
 * in that bucket — and whether it was a DAT role or currentTitle.
 *
 * Returns null when the match is via the primary role (no via: label needed).
 */
export function getViaBucketToken(
  a: AlumniRow,
  bucketKey: string
): { label: string; source: "dat-role" | "current-title" } | null {
  const bk = bucketKey as TitleBucketKey;

  // ✅ Professional pathway buckets: match via currentTitle only.
  //    Returns the raw currentTitle token that produced this pathway slug.
  if (bucketKey.startsWith("pathway:")) {
    const pathwaySlug = bucketKey.slice("pathway:".length);
    const ct = (a as any).currentTitle ?? (a as any)["current title"];
    if (ct && typeof ct === "string") {
      for (const t of splitCurrentTitles(ct)) {
        if (!t.trim() || isJunkCurrentTitle(t)) continue;
        const plural = pluralizeToken(t.trim());
        if (slugifyTitle(plural) === pathwaySlug) {
          return { label: t.trim(), source: "current-title" };
        }
      }
    }
    return null;
  }

  // ✅ Executive Directors: via label comes from execDirViaTitle field.
  //    Suppress via when the person's primary visible role already contains "Director"
  //    (it already explains why they appear here). Only show via when the primary role
  //    doesn't contain "Director" but a secondary Staff assignment title does.
  if (bucketKey === "executive-directors") {
    const execVia = (a as any).execDirViaTitle as string | undefined;
    if (!execVia) return null;
    const primaryRole = String(a.role ?? "").trim();
    // Primary role already explains the Director membership — no via needed
    if (/\bdirector\b/i.test(primaryRole)) return null;
    // Suppress if via is a duplicate of the primary role (normalized)
    if (execVia.trim().toLowerCase() === primaryRole.toLowerCase()) return null;
    return { label: execVia, source: "dat-role" };
  }

  // ✅ Staff bucket: show specific role label when available (e.g. "Interim Manager of
  //    Community Partnerships in Czechia and Slovakia") so staff cards aren't vague.
  //    Falls back to null (no label) when only a generic "Staff" placeholder is available.
  //    Suppress via when it exactly duplicates the card's primary role (no added context).
  if (bucketKey === "staff") {
    const staffVia = (a as any).staffViaLabel as string | undefined;
    if (!staffVia) return null;
    const cardTitle = String(a.role ?? "").trim().toLowerCase();
    if (staffVia.trim().toLowerCase() === cardTitle) return null;
    return { label: staffVia, source: "dat-role" };
  }

  // If the primary role already maps to this bucket: check if it's a broad match
  // (e.g., "Artistic Director" broadly matches title:directors → show "via: Director")
  for (const t of splitRoleTokensForBuckets(a.role)) {
    if (!t.trim()) continue;
    if (bucketsForTitleToken(t).includes(bk)) {
      const canonical = canonicalViaLabelForBucket(t, bk);
      // If canonical label differs from raw token, it's a broad match — show via label
      if (canonical.toLowerCase() !== t.toLowerCase()) {
        return { label: canonical, source: "dat-role" };
      }
      // Exact match → no via label needed
      return null;
    }
  }

  // Check roles array (includes merged Role-Assignment labels)
  for (const r of a.roles ?? []) {
    for (const t of splitRoleTokensForBuckets(r)) {
      if (!t.trim()) continue;
      if (bucketsForTitleToken(t).includes(bk)) {
        return { label: canonicalViaLabelForBucket(t, bk), source: "dat-role" };
      }
    }
  }

  // Check currentTitle (self-defined present-day title)
  const ct = (a as any).currentTitle ?? (a as any)["current title"];
  if (ct && typeof ct === "string") {
    for (const t of splitTitles(ct)) {
      if (!t.trim()) continue;
      if (bucketsForTitleToken(t).includes(bk)) {
        return { label: t, source: "current-title" };
      }
    }
  }

  return null;
}

/** For a person, produce deduped links for each of their titles */
export function getBucketLinksForAlumni(a: AlumniRow): Array<{ label: string; href: string }> {
  const tokens = new Set(
    splitRoleTokensForBuckets(a.role).map((t) => t.trim()).filter(Boolean)
  );
  const links: Array<{ label: string; href: string }> = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const href = getBucketHrefForTitleToken(token);
    if (!href) continue;

    // dedupe on href (so the same bucket isn’t repeated if two tokens map to it)
    if (seen.has(href)) continue;
    seen.add(href);

    links.push({ label: token, href });
  }
  return links;
}
