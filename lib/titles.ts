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
    .split(/[,\u2215/|;·•—–]+/g) // keep hyphenated titles intact
    .map((s) => s.trim())
    .filter(Boolean);
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
  "founding member",
  "co-founder",
  "cofounder",
  "co-founders",
  "cofounders",
  "cos", // no COS button
]);

/** Canonical buckets (keys → display label, icon, color) */
export type TitleBucketKey =
  | "managers-community-partnerships"
  | "partners"
  | "teaching-artists"
  | "executive-directors"
  | "stage-managers"
  | "designers"
  | "travel-writers"
  | "playwrights"
  | "special-event-hosts"
  // dynamic fallbacks:
  | `title:${string}`;

export interface BucketMeta {
  key: TitleBucketKey;
  label: string;
  icon: string;
  color: string;
}

/** Core, fixed buckets — ALL unique emoji + color (curated) */
export const FIXED_BUCKETS: Record<
  Exclude<TitleBucketKey, `title:${string}`>,
  BucketMeta
> = {
  "executive-directors": {
    key: "executive-directors",
    label: "Executive Directors",
    icon: "🏛️",
    color: "#8B0000", // dark red
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

  const buckets: TitleBucketKey[] = [];

  // Partners (specific)
  if (t === "artistic director (rotm theatre)") {
    buckets.push("partners");
    return buckets; // suppress standalone button
  }

  /** --- Merge-prone fixed buckets: force to fixed & early return --- */

  // Teaching Artists: singular + plural, and Director of Creative Learning
  if (/\bteaching artist(s)?\b/i.test(t) || t === "director of creative learning") {
    buckets.push("teaching-artists");
    return buckets; // ✅ always fixed, no dynamic variant
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
  if (/\bdesigner\b/i.test(t)) {
    buckets.push("designers");
    return buckets;
  }

  // Executive Directors: singular + plural, plus other leadership variants below
  if (/\bexecutive director(s)?\b/i.test(t)) {
    buckets.push("executive-directors");
    return buckets; // ✅ always fixed, no dynamic variant
  }

  /** --- Remaining fixed-bucket rules --- */

  // Playwrights: anything with "playwright" (incl. Resident Playwright)
  if (/\bplaywright\b/i.test(t)) {
    buckets.push("playwrights");
    if (t === "resident playwright") {
      buckets.push("executive-directors"); // per your rule
    }
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
  if (
    /\b(Manager|Director)\b.*\bof\b.*\bCommunity Partnerships\b/i.test(token) ||
    /\bCommunity Partnerships\b.*\b(Manager|Director)\b/i.test(token)
  ) {
    buckets.push("managers-community-partnerships");
    buckets.push("executive-directors");
    return buckets;
  }

  // Special Event Hosts: Travelogue Moderators / Emcees
  if (/\btravelogue\b/i.test(t) && (/\bmoderator\b/i.test(t) || /\bemcee\b/i.test(t))) {
    buckets.push("special-event-hosts");
    return buckets;
  }

  // Executive Directors bucket: other leadership forms
  if (
    t === "artistic director" ||
    t === "associate artistic director" ||
    t === "director of creative learning" ||
    /^director of\s+.+/i.test(token) ||
    /^.+\s+director$/i.test(token)
  ) {
    if (t !== "director") {
      buckets.push("executive-directors");
      return buckets;
    }
  }

  // Resident <X> → include in the <X>s default bucket as well
  if (/^resident\s+(.+)/i.test(token)) {
    const base = norm(token.replace(/^resident\s+/i, ""));
    const label = pluralizeToken(base);
    buckets.push(`title:${label.toLowerCase()}` as TitleBucketKey);
    return buckets;
  }

  // Fallback: make a button for the token itself (pluralized)
  const plural = pluralizeToken(token);
  buckets.push(`title:${plural.toLowerCase()}` as TitleBucketKey);
  return buckets;
}

/** Bucket record type used in the map below */
type BucketRecord = {
  meta: BucketMeta;
  people: Set<string>;
  subcats?: Map<string, Set<string>>; // used by Designers only now
};

/** Build all buckets from alumni rows */
export function buildTitleBuckets(alumni: AlumniRow[]) {
  // Map<bucketKey, BucketRecord>
  const buckets = new Map<TitleBucketKey, BucketRecord>();

  // Track taken colors so we don’t duplicate (start with fixed)
  const usedColors = new Set<string>(
    Object.values(FIXED_BUCKETS).map((b) => b.color.toLowerCase())
  );

  // Seed fixed buckets (Designers gets subcats Map)
  for (const key of Object.keys(FIXED_BUCKETS) as (keyof typeof FIXED_BUCKETS)[]) {
    const obj: BucketRecord = {
      meta: FIXED_BUCKETS[key],
      people: new Set<string>(),
    };
    if (key === "designers") {
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
    const v: BucketRecord = { meta, people: new Set<string>() };
    buckets.set(key, v);
    return v;
  }

  for (const a of alumni) {
    const tokens = new Set(splitTitles(a.role).map((t) => t.trim()).filter(Boolean));

    for (const rawToken of tokens) {
      const keys = bucketsForTitleToken(rawToken);
      if (!keys.length) continue;

      for (const key of keys) {
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

/** For a person, produce deduped links for each of their titles */
export function getBucketLinksForAlumni(a: AlumniRow): Array<{ label: string; href: string }> {
  const tokens = new Set(splitTitles(a.role).map((t) => t.trim()).filter(Boolean));
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
