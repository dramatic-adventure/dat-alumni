// lib/opportunities.ts
// ─────────────────────────────────────────────────────────────────────────────
// ## OPPORTUNITIES PORTAL — Shared taxonomy, types, and pure helpers.
//
// This module is safe to import from anywhere (server or client). It holds
// the enums, type definitions, display metadata, and pure parsing/normalize
// helpers that power the /opportunities portal, the PLX program pages, and
// the universal /apply form.
//
// The server-only loader that reads the live Google Sheet lives in
// `lib/loadOpportunities.ts` — import `loadOpportunities` / `findOpportunity`
// from there in server components and API routes. Do not import them here.
//
// ─── Sheet shape (read by lib/loadOpportunities.ts) ──────────────────────────
//
//   Tab name: "Opportunities" (same spreadsheet as alumni, ALUMNI_SHEET_ID)
//   Row 1, exact column order (27 columns, A through AA):
//
//     id | title | type | role_types | hub | description | commitment |
//     commitment_type | is_paid | compensation | status | deadline | season |
//     featured | plx_program | apply_url | learn_more_url | order |
//     hero_image | long_description | what_youll_do | who_you_are |
//     requirements | perks | timeline | faq | contact_email
//
//   Allowed values:
//     type             →  plx | artist | audition | arts_admin | job | volunteer | participant
//     role_types       →  comma-separated, drawn from OPPORTUNITY_ROLE_TYPES below
//     hub              →  nyc | quito | brno | bagamoyo | sydney | remote
//     commitment_type  →  full-time | part-time | short-term | one-time | flexible
//     is_paid          →  TRUE | FALSE
//     status           →  open | closed | coming_soon | evergreen
//     featured         →  TRUE | FALSE
//     plx_program      →  internship | apprenticeship | (blank)
//     deadline         →  ISO date (YYYY-MM-DD) or blank for evergreen
//     order            →  integer for manual sort within a `type`
//     hero_image       →  path under /public, e.g. /images/opportunities/PLX-hero.jpg
//
//   Rich-content columns (all optional, in-cell encodings):
//     what_youll_do, who_you_are, requirements, perks  →  one item per line
//     timeline                                          →  "label :: detail" per line
//     faq                                               →  "Q :: A" per line
//     long_description                                  →  free-text paragraphs (\n\n between)
//
// ─── Reads via the Google Sheets API ─────────────────────────────────────────
//
//   No extra env vars needed — the loader reuses the same service-account
//   credentials as the alumni loader:
//     - ALUMNI_SHEET_ID       (the spreadsheet)
//     - GCP_SA_JSON_BASE64    (or GCP_SA_JSON, or the split GCP_SA_* vars)
//
//   If the API call fails or the tab is missing, the loader falls back to the
//   seeded snapshot at data/opportunities.json so the site never breaks.
//
// To add a single listing manually without touching Sheets, edit
// data/opportunities.json — each entry is one row.
// ─────────────────────────────────────────────────────────────────────────────

import seed from "@/data/opportunities.json";

/* ───────────────────────────── Taxonomies ───────────────────────────────── */

export const OPPORTUNITY_TYPES = [
  "plx",
  "artist",
  "audition",
  "arts_admin",
  "job",
  "volunteer",
  "participant",
] as const;
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_HUBS = [
  "nyc",
  "quito",
  "brno",
  "bagamoyo",
  "sydney",
  "remote",
] as const;
export type OpportunityHub = (typeof OPPORTUNITY_HUBS)[number];

export const OPPORTUNITY_COMMITMENTS = [
  "full-time",
  "part-time",
  "short-term",
  "one-time",
  "flexible",
] as const;
export type OpportunityCommitmentType = (typeof OPPORTUNITY_COMMITMENTS)[number];

export const OPPORTUNITY_STATUSES = [
  "open",
  "coming_soon",
  "evergreen",
  "closed",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export type PlxProgram = "internship" | "apprenticeship" | "";

/**
 * Canonical role-type taxonomy for opportunities. This is intentionally a
 * superset of the alumni statusFlags / canonical roles used elsewhere — it
 * also covers community-facing roles (community_engagement, general) that
 * don't exist in the artist roster.
 *
 * If you add a value here, also add a display label in OPPORTUNITY_ROLE_LABELS.
 */
export const OPPORTUNITY_ROLE_TYPES = [
  "actor",
  "performer",
  "singer",
  "storyteller",
  "ensemble_artist",
  "director",
  "designer",
  "teaching_artist",
  "arts_admin",
  "development",
  "marketing",
  "community_engagement",
  "general",
] as const;
export type OpportunityRoleType = (typeof OPPORTUNITY_ROLE_TYPES)[number];

export const OPPORTUNITY_ROLE_LABELS: Record<OpportunityRoleType, string> = {
  actor: "Actor",
  performer: "Performer",
  singer: "Singer",
  storyteller: "Storyteller",
  ensemble_artist: "Ensemble Artist",
  director: "Director",
  designer: "Designer",
  teaching_artist: "Teaching Artist",
  arts_admin: "Arts Admin",
  development: "Development",
  marketing: "Marketing",
  community_engagement: "Community Engagement",
  general: "General",
};

/* ───────────────────────────── Display metadata ─────────────────────────── */

export const TYPE_META: Record<
  OpportunityType,
  { label: string; eyebrow: string; color: string; bg: string; border: string }
> = {
  plx:        { label: "PLX",         eyebrow: "Professional Leadership", color: "#FFCC00", bg: "rgba(255,204,0,0.14)",  border: "rgba(255,204,0,0.45)" },
  artist:     { label: "Artist",      eyebrow: "Make the Work",            color: "#F23359", bg: "rgba(242,51,89,0.12)",  border: "rgba(242,51,89,0.4)"  },
  audition:   { label: "Audition",    eyebrow: "Casting Call",              color: "#F23359", bg: "rgba(242,51,89,0.12)",  border: "rgba(242,51,89,0.4)"  },
  arts_admin: { label: "Arts Admin",  eyebrow: "Run the Engine",            color: "#6C00AF", bg: "rgba(108,0,175,0.12)",  border: "rgba(108,0,175,0.4)"  },
  // Job listings display as "Arts Admin" — same color, same family — but kept as a
  // distinct underlying type so the Sheet can express the difference between
  // training (arts_admin) and paid staff role (job).
  job:        { label: "Arts Admin",  eyebrow: "On the Team",               color: "#6C00AF", bg: "rgba(108,0,175,0.12)",  border: "rgba(108,0,175,0.4)"  },
  volunteer:  { label: "Volunteer",   eyebrow: "Lend a Hand",               color: "#2FA873", bg: "rgba(47,168,115,0.12)", border: "rgba(47,168,115,0.4)" },
  // Participant listings display as "Artist" — community participants are
  // artists in DAT's frame, just on a different commitment shape.
  participant:{ label: "Artist",      eyebrow: "Join the Work",             color: "#F23359", bg: "rgba(242,51,89,0.12)",  border: "rgba(242,51,89,0.4)"  },
};

/**
 * Display groups — used by the filter bar so the user sees one button per
 * meaningful audience instead of one button per underlying type. Each group
 * folds in one or more types from OPPORTUNITY_TYPES.
 */
export const TYPE_GROUPS = ["plx", "artist", "audition", "arts_admin", "volunteer"] as const;
export type TypeGroup = (typeof TYPE_GROUPS)[number];

export const TYPE_GROUP_TO_TYPES: Record<TypeGroup, OpportunityType[]> = {
  plx: ["plx"],
  artist: ["artist", "participant"],
  audition: ["audition"],
  arts_admin: ["arts_admin", "job"],
  volunteer: ["volunteer"],
};

export const TYPE_TO_GROUP: Record<OpportunityType, TypeGroup> = {
  plx: "plx",
  artist: "artist",
  participant: "artist",
  audition: "audition",
  arts_admin: "arts_admin",
  job: "arts_admin",
  volunteer: "volunteer",
};

export const TYPE_GROUP_META: Record<TypeGroup, { label: string; color: string; bg: string; border: string }> = {
  plx:        { label: "PLX",        color: "#FFCC00", bg: "rgba(255,204,0,0.14)",  border: "rgba(255,204,0,0.45)" },
  artist:     { label: "Artist",     color: "#F23359", bg: "rgba(242,51,89,0.12)",  border: "rgba(242,51,89,0.4)"  },
  audition:   { label: "Audition",   color: "#F23359", bg: "rgba(242,51,89,0.12)",  border: "rgba(242,51,89,0.4)"  },
  arts_admin: { label: "Arts Admin", color: "#6C00AF", bg: "rgba(108,0,175,0.12)",  border: "rgba(108,0,175,0.4)"  },
  volunteer:  { label: "Volunteer",  color: "#2FA873", bg: "rgba(47,168,115,0.12)", border: "rgba(47,168,115,0.4)" },
};

export const HUB_META: Record<OpportunityHub, { label: string; country: string }> = {
  nyc:      { label: "United States",  country: "NYC, Baltimore & Beyond" },
  quito:    { label: "Ecuador",        country: "Quito + Field Sites" },
  brno:     { label: "Central Europe", country: "Czechia / Slovakia · Prague → Košice" },
  bagamoyo: { label: "Tanzania",       country: "Bagamoyo, Dar & Zanzibar" },
  sydney:   { label: "Sydney",         country: "Australia" },
  remote:   { label: "Remote",         country: "Global / Distributed" },
};

export const COMMITMENT_LABELS: Record<OpportunityCommitmentType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  "short-term": "Short-term",
  "one-time": "One-time",
  "flexible": "Flexible",
};

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  open: "Open",
  coming_soon: "Coming Soon",
  evergreen: "Rolling Basis",
  closed: "Closed",
};

/* ───────────────────────────── Shape ────────────────────────────────────── */

export interface TimelineItem {
  label: string;
  detail: string;
}
export interface FaqItem {
  q: string;
  a: string;
}

export interface Opportunity {
  id: string;
  title: string;
  type: OpportunityType;
  roleTypes: OpportunityRoleType[];
  hub: OpportunityHub;
  description: string;
  commitment: string;
  commitmentType: OpportunityCommitmentType;
  isPaid: boolean;
  compensation: string;
  status: OpportunityStatus;
  /** ISO date string or "" */
  deadline: string;
  season: string;
  featured: boolean;
  plxProgram: PlxProgram;
  applyUrl: string;
  learnMoreUrl: string;
  order: number;

  // ── Optional rich detail-page fields (used by /opportunities/[id]) ──
  heroImage: string;
  longDescription: string;
  whatYoullDo: string[];
  whoYouAre: string[];
  requirements: string[];
  perks: string[];
  timeline: TimelineItem[];
  faq: FaqItem[];
  contactEmail: string;
}

/* ───────────────────────────── Normalization ────────────────────────────── */

function coerceType(v: unknown): OpportunityType {
  const s = String(v ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  return (OPPORTUNITY_TYPES as readonly string[]).includes(s)
    ? (s as OpportunityType)
    : "artist";
}

function coerceHub(v: unknown): OpportunityHub {
  const s = String(v ?? "").trim().toLowerCase();
  return (OPPORTUNITY_HUBS as readonly string[]).includes(s)
    ? (s as OpportunityHub)
    : "remote";
}

function coerceCommitment(v: unknown): OpportunityCommitmentType {
  const s = String(v ?? "").trim().toLowerCase();
  return (OPPORTUNITY_COMMITMENTS as readonly string[]).includes(s)
    ? (s as OpportunityCommitmentType)
    : "flexible";
}

function coerceStatus(v: unknown): OpportunityStatus {
  const s = String(v ?? "").trim().toLowerCase();
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(s)
    ? (s as OpportunityStatus)
    : "open";
}

function coercePlx(v: unknown): PlxProgram {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "internship" || s === "apprenticeship") return s;
  return "";
}

function coerceBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1";
}

function coerceRoleTypes(v: unknown): OpportunityRoleType[] {
  const raw = String(v ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase().replace(/[\s-]+/g, "_"))
    .filter(Boolean);
  const valid = new Set<string>(OPPORTUNITY_ROLE_TYPES as readonly string[]);
  return raw.filter((r) => valid.has(r)) as OpportunityRoleType[];
}

function coerceNum(v: unknown, fallback = 99): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/* ───────────────────────────── Normalize seed JSON ─────────────────────── */

export type SeedRow = {
  id: string;
  title: string;
  type: string;
  role_types: string;
  hub: string;
  description: string;
  commitment: string;
  commitment_type: string;
  is_paid: boolean | string;
  compensation: string;
  status: string;
  deadline: string;
  season: string;
  featured: boolean | string;
  plx_program: string;
  apply_url: string;
  learn_more_url: string;
  order: number | string;
  // Optional rich detail fields
  hero_image?: string;
  long_description?: string;
  what_youll_do?: string | string[];
  who_you_are?: string | string[];
  requirements?: string | string[];
  perks?: string | string[];
  timeline?: string | TimelineItem[];
  faq?: string | FaqItem[];
  contact_email?: string;
};

function parseLines(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  return String(v ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseTimeline(v: unknown): TimelineItem[] {
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] && "label" in (v[0] as object)) {
    return (v as TimelineItem[]).map((t) => ({
      label: String(t.label ?? "").trim(),
      detail: String(t.detail ?? "").trim(),
    })).filter((t) => t.label || t.detail);
  }
  return parseLines(v).map((line) => {
    const [label, ...rest] = line.split("::");
    return { label: (label ?? "").trim(), detail: rest.join("::").trim() };
  }).filter((t) => t.label);
}

function parseFaq(v: unknown): FaqItem[] {
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] && "q" in (v[0] as object)) {
    return (v as FaqItem[]).map((t) => ({
      q: String(t.q ?? "").trim(),
      a: String(t.a ?? "").trim(),
    })).filter((t) => t.q);
  }
  return parseLines(v).map((line) => {
    const [q, ...rest] = line.split("::");
    return { q: (q ?? "").trim(), a: rest.join("::").trim() };
  }).filter((t) => t.q);
}

export function normalize(row: Partial<SeedRow>): Opportunity {
  return {
    id: String(row.id ?? "").trim(),
    title: String(row.title ?? "").trim(),
    type: coerceType(row.type),
    roleTypes: coerceRoleTypes(row.role_types),
    hub: coerceHub(row.hub),
    description: String(row.description ?? "").trim(),
    commitment: String(row.commitment ?? "").trim(),
    commitmentType: coerceCommitment(row.commitment_type),
    isPaid: coerceBool(row.is_paid),
    compensation: String(row.compensation ?? "").trim(),
    status: coerceStatus(row.status),
    deadline: String(row.deadline ?? "").trim(),
    season: String(row.season ?? "").trim(),
    featured: coerceBool(row.featured),
    plxProgram: coercePlx(row.plx_program),
    applyUrl: String(row.apply_url ?? "").trim(),
    learnMoreUrl: String(row.learn_more_url ?? "").trim(),
    order: coerceNum(row.order, 99),

    heroImage: String(row.hero_image ?? "").trim(),
    longDescription: String(row.long_description ?? "").trim(),
    whatYoullDo: parseLines(row.what_youll_do),
    whoYouAre: parseLines(row.who_you_are),
    requirements: parseLines(row.requirements),
    perks: parseLines(row.perks),
    timeline: parseTimeline(row.timeline),
    faq: parseFaq(row.faq),
    contactEmail: String(row.contact_email ?? "").trim(),
  };
}

/** All known opportunity ids — used by generateStaticParams. */
export function allOpportunityIds(): string[] {
  return getOpportunitiesSync().map((o) => o.id);
}

/* ───────────────────────────── Header-row → SeedRow mapper ───────────────── */

/**
 * Map a 2D matrix of strings (header row + data rows) into SeedRow objects.
 * Used by the server-only loader in `lib/loadOpportunities.ts` to convert
 * Sheets-API output into the shape `normalize()` expects.
 */
export function csvRowsToSeed(rows: string[][]): SeedRow[] {
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const cell = (r: string[], k: string) => {
    const i = idx(k);
    return i === -1 ? "" : (r[i] ?? "");
  };
  return rows.slice(1).map((r) => ({
    id: cell(r, "id"),
    title: cell(r, "title"),
    type: cell(r, "type"),
    role_types: cell(r, "role_types"),
    hub: cell(r, "hub"),
    description: cell(r, "description"),
    commitment: cell(r, "commitment"),
    commitment_type: cell(r, "commitment_type"),
    is_paid: cell(r, "is_paid"),
    compensation: cell(r, "compensation"),
    status: cell(r, "status"),
    deadline: cell(r, "deadline"),
    season: cell(r, "season"),
    featured: cell(r, "featured"),
    plx_program: cell(r, "plx_program"),
    apply_url: cell(r, "apply_url"),
    learn_more_url: cell(r, "learn_more_url"),
    order: cell(r, "order") || "99",
    hero_image: cell(r, "hero_image"),
    long_description: cell(r, "long_description"),
    what_youll_do: cell(r, "what_youll_do"),
    who_you_are: cell(r, "who_you_are"),
    requirements: cell(r, "requirements"),
    perks: cell(r, "perks"),
    timeline: cell(r, "timeline"),
    faq: cell(r, "faq"),
    contact_email: cell(r, "contact_email"),
  }));
}

/* ───────────────────────────── Sync seed accessor ───────────────────────── */

/**
 * Synchronous accessor for places (sitemap, static generation, fallback for
 * the server-only loader) that just need the seeded snapshot without doing
 * a live fetch. Reads from data/opportunities.json.
 */
export function getOpportunitiesSync(): Opportunity[] {
  return sortOpportunities((seed as SeedRow[]).map(normalize).filter((o) => o.id && o.title));
}

/* ───────────────────────────── Sort / helpers ────────────────────────── */

export function sortOpportunities(items: Opportunity[]): Opportunity[] {
  // Featured first, then by type bucket, then manual order, then deadline.
  const typeBucket: Record<OpportunityType, number> = {
    plx: 0,
    artist: 1,
    audition: 2,
    arts_admin: 3,
    job: 4,
    participant: 5,
    volunteer: 6,
  };
  return [...items].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const tb = typeBucket[a.type] - typeBucket[b.type];
    if (tb !== 0) return tb;
    if (a.order !== b.order) return a.order - b.order;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return a.title.localeCompare(b.title);
  });
}

/** Human-readable deadline, e.g. "Aug 15, 2026". */
export function formatDeadline(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** True if PLX band should render (any open/coming_soon PLX listing). */
export function hasActivePlx(items: Opportunity[]): boolean {
  return items.some(
    (o) =>
      (o.plxProgram === "internship" || o.plxProgram === "apprenticeship") &&
      (o.status === "open" || o.status === "coming_soon"),
  );
}
