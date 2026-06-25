"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  COMMITMENT_LABELS,
  HUB_META,
  OPPORTUNITY_COMMITMENTS,
  OPPORTUNITY_HUBS,
  OPPORTUNITY_ROLE_LABELS,
  TYPE_GROUPS,
  TYPE_GROUP_META,
  TYPE_GROUP_TO_TYPES,
  TYPE_META,
  TYPE_TO_GROUP,
  formatDeadline,
  hasActivePlx,
  type Opportunity,
  type OpportunityCommitmentType,
  type OpportunityHub,
  type TypeGroup,
} from "@/lib/opportunities";

/* ─── Path-strip presets (browse mode) ─────────────────────────────── */
const PATH_PRESETS: Record<"artist" | "admin" | "volunteer" | "seasonal", TypeGroup[]> = {
  artist: ["artist", "audition"],
  admin: ["arts_admin", "plx"],
  volunteer: ["volunteer"],
  seasonal: [],
};

const HUB_LIST: { key: OpportunityHub; label: string }[] = [
  { key: "nyc",      label: "United States" },
  { key: "quito",    label: "Ecuador" },
  { key: "brno",     label: "Central Europe" },
  { key: "bagamoyo", label: "Tanzania" },
  { key: "sydney",   label: "Sydney" },
  { key: "remote",   label: "Remote" },
];

/* ─── Icons ─────────────────────────────────────────────────────────── */
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const IconDollar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const IconHeart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
// Neutral fee/ticket icon — used for fee-based programs (participant pays).
const IconTicket = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" /><path d="M13 7v10" />
  </svg>
);

/* ─── Funding (money-direction) display ─────────────────────────────────
 * paid      → dollar icon + the compensation pay line
 * fee       → neutral ticket icon + the compensation fee line (NEVER "Volunteer")
 * volunteer → heart icon + the word "Volunteer"
 */
function fundingDisplay(o: Opportunity): { icon: React.ReactNode; text: string } {
  if (o.funding === "paid") return { icon: <IconDollar />, text: o.compensation || "Paid" };
  if (o.funding === "fee") return { icon: <IconTicket />, text: o.compensation || "Participation fee" };
  return { icon: <IconHeart />, text: "Volunteer" };
}

/* ─── Full opportunity card (unchanged) ─────────────────────────────── */
function OpportunityCard({ o, index }: { o: Opportunity; index: number }) {
  const group = TYPE_TO_GROUP[o.type];
  const meta = TYPE_GROUP_META[group];
  const hub = HUB_META[o.hub];
  const isClosed = o.status === "closed";
  const isEvergreen = o.status === "evergreen";
  const isComingSoon = o.status === "coming_soon";

  const learnHref = o.learnMoreUrl || `/opportunities/${o.id}`;
  const applyHref = o.applyUrl || `/apply?opp=${o.id}`;
  const heroImage = o.heroImage || "/images/opportunities/collaboration-joy.jpg";
  const money = fundingDisplay(o);

  return (
    <article
      className={`op-card${isClosed ? " op-card--closed" : ""}${o.featured ? " op-card--featured" : ""}`}
      style={{
        ["--ca" as string]: meta.color,
        ["--cb" as string]: meta.border,
        ["--cc" as string]: meta.bg,
        animationDelay: `${Math.min(index * 60, 600)}ms`,
      }}
    >
      <Link href={learnHref} className="op-card-thumblink" aria-label={`Read about ${o.title}`}>
        <div className="op-card-thumb">
          <Image
            src={heroImage}
            alt=""
            fill
            sizes="(min-width:1024px) 33vw, (min-width:620px) 50vw, 100vw"
            style={{ objectFit: "cover", objectPosition: "center 35%" }}
          />
          <div className="op-card-thumb-fade" />
          <div className="op-card-thumb-badges">
            <span className="op-card-typebadge">{meta.label}</span>
            {o.featured && o.status !== "closed" && <span className="op-card-star" aria-label="Featured">★</span>}
          </div>
          <div className="op-card-thumb-statusrow">
            {isComingSoon && <span className="op-card-status op-card-status--soon">Coming Soon</span>}
            {isEvergreen && <span className="op-card-status op-card-status--ever">Rolling Basis</span>}
            {isClosed && <span className="op-card-status op-card-status--closed">Closed</span>}
            {o.season && o.status === "open" && <span className="op-card-status op-card-status--season">{o.season}</span>}
          </div>
        </div>
      </Link>

      <div className="op-card-body">
        <h3 className="op-card-title">
          <Link href={learnHref} className="op-card-titlelink">{o.title}</Link>
        </h3>

        <div className="op-card-hub">
          <span className="op-card-hub-icon"><IconPin /></span>
          <span>{hub.label}</span>
          <span className="op-card-hub-country">· {hub.country}</span>
        </div>

        <p className="op-card-desc">{o.description}</p>

        <div className="op-card-meta">
          <div className="op-card-meta-row">
            <span className="op-card-meta-icon"><IconClock /></span>
            <span>{o.commitment}</span>
          </div>
          <div className="op-card-meta-row">
            <span className="op-card-meta-icon">{money.icon}</span>
            <span>{money.text}</span>
          </div>
          {o.earnsCredit && (
            <div className="op-card-meta-row">
              <span className="op-card-credit-badge">Earns academic credit</span>
            </div>
          )}
          {o.deadline && o.status === "open" && (
            <div className="op-card-meta-row op-card-meta-row--deadline">
              <span className="op-card-deadline-label">Apply by</span>
              <span className="op-card-deadline-value">{formatDeadline(o.deadline)}</span>
            </div>
          )}
        </div>

        {o.roleTypes.length > 0 && (
          <div className="op-card-roles">
            {o.roleTypes.slice(0, 3).map((r) => (
              <span key={r} className="op-card-role-tag">{OPPORTUNITY_ROLE_LABELS[r]}</span>
            ))}
            {o.roleTypes.length > 3 && (
              <span className="op-card-role-tag op-card-role-tag--more">+{o.roleTypes.length - 3}</span>
            )}
          </div>
        )}

        <div className="op-card-actions">
          <Link href={learnHref} className="op-card-cta op-card-cta--ghost">
            Learn More
          </Link>
          {!isClosed && (
            <a
              href={applyHref}
              className="op-card-cta op-card-cta--primary"
              target={applyHref.startsWith("http") ? "_blank" : undefined}
              rel={applyHref.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {isComingSoon ? "Get Notified" : "Apply Now"}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── Compact opportunity row (Zone 2) ─────────────────────────────── */
function CompactOpportunityRow({ o }: { o: Opportunity }) {
  const group = TYPE_TO_GROUP[o.type];
  const meta = TYPE_GROUP_META[group];
  const learnHref = o.learnMoreUrl || `/opportunities/${o.id}`;

  const statusLabel =
    o.status === "open" ? "Open"
    : o.status === "coming_soon" ? "Coming soon"
    : o.status === "evergreen" ? "Rolling"
    : "";

  return (
    <Link href={learnHref} className={`op-compact-row op-compact-row--${o.status}`}>
      <span className="op-compact-dot" aria-hidden="true" />
      <span className="op-compact-title">{o.title}</span>
      {o.hub !== "remote" && (
        <span className="op-compact-hub">{HUB_META[o.hub].label}</span>
      )}
      {o.deadline && o.status === "open" && (
        <span className="op-compact-deadline">Due {formatDeadline(o.deadline)}</span>
      )}
      {statusLabel && (
        <span className={`op-compact-badge op-compact-badge--${o.status}`}>
          {statusLabel}
        </span>
      )}
    </Link>
  );
}

/* ─── PLX Band (bottom of page, unchanged) ──────────────────────────── */
function PLXBand({ items }: { items: Opportunity[] }) {
  if (!hasActivePlx(items)) return null;
  const plx = items.filter(
    (o) =>
      (o.plxProgram === "internship" ||
        o.plxProgram === "apprenticeship" ||
        o.plxProgram === "fellowship") &&
      (o.status === "open" || o.status === "coming_soon"),
  );
  const intern = plx.find((p) => p.plxProgram === "internship");
  const apprentice = plx.find((p) => p.plxProgram === "apprenticeship");
  const fellow = plx.find((p) => p.plxProgram === "fellowship");
  const allPlxCount = items.filter((o) => o.type === "plx" && o.status !== "closed").length;

  return (
    <section className="op-plx-band">
      <div className="op-plx-bgimg" aria-hidden="true">
        <Image
          src="/images/opportunities/PLX-hero.jpg"
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center 30%" }}
        />
      </div>
      <div className="op-plx-scrim" aria-hidden="true" />
      <div className="op-plx-inner">
        <div className="op-plx-headline">
          <h2 className="op-plx-title">
            PLX <span className="op-plx-title-em">— Professional Leadership Experience</span>
          </h2>
          <p className="op-plx-sub">
            DAT's flagship training ladder for emerging arts administrators and artists — from a
            credit-bearing entry Internship to paid Apprenticeships and Fellowships. Real-world experience
            and direct mentorship across theatre, eco-travel, and global community work.
          </p>
          <Link href="/professional-leadership-experience" className="op-plx-learnmore" style={{ display: "inline-block", marginTop: "1rem" }}>
            What is PLX? →
          </Link>
          {allPlxCount > 2 && (
            <p className="op-plx-band-note">
              {allPlxCount}{" "}total listings — internships, apprenticeships &amp; fellowships across
              development, comms, production, teaching, and more.
            </p>
          )}
        </div>

        <div className="op-plx-grid">
          {intern && <PlxTile o={intern} accent="#0FB5A8" />}
          {apprentice && <PlxTile o={apprentice} accent="#FFCC00" />}
          {fellow && <PlxTile o={fellow} accent="#F23359" />}
        </div>

        <div className="op-plx-footer-links">
          <Link href="/opportunities?browse=1&type=plx" className="op-plx-learnmore op-plx-learnmore--dim">
            Browse all {allPlxCount} listings →
          </Link>
        </div>
      </div>
    </section>
  );
}

const PLX_RUNG_LABEL: Record<string, string> = {
  internship: "Internship",
  apprenticeship: "Apprenticeship",
  fellowship: "Fellowship",
};

function PlxTile({ o, accent }: { o: Opportunity; accent: string }) {
  const applyHref = o.applyUrl || `/apply?opp=${o.id}`;
  const learnHref = o.learnMoreUrl || `/opportunities/${o.id}`;
  const rungLabel = PLX_RUNG_LABEL[o.plxProgram] ?? "Apprenticeship";
  return (
    <div className="op-plx-tile" style={{ ["--accent" as string]: accent }}>
      <span className="op-plx-tile-tag">{rungLabel}</span>
      <h3 className="op-plx-tile-title">{o.title}</h3>
      <p className="op-plx-tile-desc">{o.description}</p>
      <dl className="op-plx-tile-meta">
        <div><dt>Commitment</dt><dd>{o.commitment}</dd></div>
        <div><dt>Compensation</dt><dd>{o.compensation}</dd></div>
        {o.deadline && <div><dt>Apply By</dt><dd>{formatDeadline(o.deadline)}</dd></div>}
      </dl>
      <div className="op-plx-tile-actions">
        <Link href={learnHref} className="op-plx-tile-cta op-plx-tile-cta--ghost">
          Learn More
        </Link>
        <a href={applyHref} className="op-plx-tile-cta op-plx-tile-cta--primary">
          Apply for the {rungLabel}
        </a>
      </div>
    </div>
  );
}

/* ─── Filter state ──────────────────────────────────────────────────── */
interface FilterState {
  typeGroups: TypeGroup[];
  hubs: OpportunityHub[];
  commitments: OpportunityCommitmentType[];
  paidOnly: boolean;
  creditOnly: boolean;
  seasonalOnly: boolean;
}

/* ─── DAT academic season helper ────────────────────────────────────────
 * DAT's season runs Sep 1 → Aug 31 (like an academic year).
 * We identify a season by its END year: e.g. the 2025-26 season → 2026.
 * That end-year digit appears in any reasonable sheet format:
 *   "2025-26", "AY2026", "Season 2026", etc.
 * 8 weeks before Sep 1 we start surfacing the upcoming season's listings too.
 */
function getActiveDatSeasonEndYears(now: Date = new Date()): number[] {
  const month = now.getMonth() + 1; // 1-indexed
  const year  = now.getFullYear();
  // If Sep or later, the current season ends NEXT year; otherwise it ends THIS year.
  const currentEndYear = month >= 9 ? year + 1 : year;
  const result = [currentEndYear];
  // 8 weeks (56 days) lead-in: start showing next season's listings early.
  const nextSeasonSep   = new Date(currentEndYear, 8, 1); // Sep 1 of currentEndYear
  const leadStart       = new Date(nextSeasonSep.getTime() - 56 * 24 * 60 * 60 * 1000);
  if (now >= leadStart) result.push(currentEndYear + 1);
  return result;
}

const EMPTY_FILTERS: FilterState = {
  typeGroups: [],
  hubs: [],
  commitments: [],
  paidOnly: false,
  creditOnly: false,
  seasonalOnly: false,
};

function parseListParam(v: string | null, allowed: readonly string[]): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter((x) => allowed.includes(x));
}

/* ─── Main client component ─────────────────────────────────────────── */
export default function OpportunitiesClient({ opportunities }: { opportunities: Opportunity[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Section refs for curated-mode scroll anchors
  const staffRef = useRef<HTMLDivElement>(null);
  const artistRef = useRef<HTMLDivElement>(null);
  const volunteerRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (searchParams.get("notice") === "closed") setShowNotice(true);
  }, [searchParams]);

  // Browse mode: activated by ?browse=1 or any filter param in the URL
  const isBrowseMode =
    searchParams.get("browse") === "1" ||
    !!(
      searchParams.get("type") ||
      searchParams.get("hub") ||
      searchParams.get("commit") ||
      searchParams.get("paid") ||
      searchParams.get("credit") ||
      searchParams.get("season")
    );

  useEffect(() => {
    setFilters({
      typeGroups: parseListParam(searchParams.get("type"), TYPE_GROUPS as readonly string[]) as TypeGroup[],
      hubs: parseListParam(searchParams.get("hub"), OPPORTUNITY_HUBS as readonly string[]) as OpportunityHub[],
      commitments: parseListParam(searchParams.get("commit"), OPPORTUNITY_COMMITMENTS as readonly string[]) as OpportunityCommitmentType[],
      paidOnly: searchParams.get("paid") === "1",
      creditOnly: searchParams.get("credit") === "1",
      seasonalOnly: searchParams.get("season") === "1",
    });
  }, [searchParams]);

  // updateFilters always writes browse=1 so filter changes stay in browse mode
  const updateFilters = (next: FilterState) => {
    setFilters(next);
    const params = new URLSearchParams();
    params.set("browse", "1");
    if (next.typeGroups.length) params.set("type", next.typeGroups.join(","));
    if (next.hubs.length) params.set("hub", next.hubs.join(","));
    if (next.commitments.length) params.set("commit", next.commitments.join(","));
    if (next.paidOnly) params.set("paid", "1");
    if (next.creditOnly) params.set("credit", "1");
    if (next.seasonalOnly) params.set("season", "1");
    router.replace(`/opportunities?${params.toString()}`, { scroll: false });
  };

  // Enter browse mode, optionally with pre-applied filters
  const enterBrowseMode = (prefilter?: Partial<FilterState>) => {
    const next: FilterState = { ...EMPTY_FILTERS, ...prefilter };
    setFilters(next);
    const params = new URLSearchParams();
    params.set("browse", "1");
    if (next.typeGroups.length) params.set("type", next.typeGroups.join(","));
    if (next.hubs.length) params.set("hub", next.hubs.join(","));
    if (next.commitments.length) params.set("commit", next.commitments.join(","));
    if (next.paidOnly) params.set("paid", "1");
    if (next.creditOnly) params.set("credit", "1");
    if (next.seasonalOnly) params.set("season", "1");
    router.push(`/opportunities?${params.toString()}`, { scroll: false });
    // Scroll to filter bar after navigation settles
    setTimeout(() => {
      const target = filterBarRef.current;
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top, behavior: "smooth" });
    }, 160);
  };

  // Exit browse mode — return to curated landing
  const exitBrowseMode = () => {
    setFilters(EMPTY_FILTERS);
    router.push("/opportunities", { scroll: true });
  };

  // Smooth-scroll to a Zone 2 section ref (curated mode)
  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }, 80);
  };

  const toggleType = (t: TypeGroup) =>
    updateFilters({ ...filters, typeGroups: filters.typeGroups.includes(t) ? filters.typeGroups.filter((x) => x !== t) : [...filters.typeGroups, t] });
  const toggleHub = (h: OpportunityHub) =>
    updateFilters({ ...filters, hubs: filters.hubs.includes(h) ? filters.hubs.filter((x) => x !== h) : [...filters.hubs, h] });
  const toggleCommit = (c: OpportunityCommitmentType) =>
    updateFilters({ ...filters, commitments: filters.commitments.includes(c) ? filters.commitments.filter((x) => x !== c) : [...filters.commitments, c] });
  const togglePaid = () => updateFilters({ ...filters, paidOnly: !filters.paidOnly });
  const toggleCredit = () => updateFilters({ ...filters, creditOnly: !filters.creditOnly });
  const toggleSeasonal = () => updateFilters({ ...filters, seasonalOnly: !filters.seasonalOnly });

  // Clear filters — stays in browse mode if active
  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    router.replace(isBrowseMode ? "/opportunities?browse=1" : "/opportunities", { scroll: false });
  };

  // Scroll to filter bar (used by browse-mode path chips)
  const applyPath = (..._args: unknown[]) => {
    void _args;
    setTimeout(() => {
      const target = filterBarRef.current;
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top, behavior: "smooth" });
    }, 120);
  };

  // ── Zone categorization ──────────────────────────────────────────────
  // Zone 1: featured + currently open → full card treatment
  const zone1Items = useMemo(
    () => opportunities.filter((o) => o.featured && o.status === "open"),
    [opportunities],
  );
  const zone1Ids = useMemo(() => new Set(zone1Items.map((o) => o.id)), [zone1Items]);

  // Zone 2: everything else, grouped by category
  const zone2Staff = useMemo(
    () =>
      opportunities.filter(
        (o) =>
          (o.type === "job" || o.type === "arts_admin") &&
          !zone1Ids.has(o.id) &&
          o.status !== "closed",
      ),
    [opportunities, zone1Ids],
  );

  const zone2Artist = useMemo(
    () =>
      opportunities.filter(
        (o) =>
          (o.type === "artist" ||
            o.type === "audition" ||
            (o.type === "participant" && o.status === "evergreen")) &&
          !zone1Ids.has(o.id) &&
          o.status !== "closed",
      ),
    [opportunities, zone1Ids],
  );

  const zone2Volunteer = useMemo(
    () => opportunities.filter((o) => o.type === "volunteer" && o.status !== "closed"),
    [opportunities],
  );

  const activeHubs = useMemo(
    () => new Set(opportunities.filter(o => o.status !== "closed").map(o => o.hub)),
    [opportunities]
  );

  // Active DAT season end-years (never changes within a session)
  const activeDatSeasonEndYears = useMemo(() => getActiveDatSeasonEndYears(), []);

  // ── Dynamic filter availability (browse mode) ────────────────────────
  const { availableGroups, availableHubs, availableCommitments, hasSeasonal, hasCredit } = useMemo(() => {
    const groups = new Set<TypeGroup>();
    const hubs = new Set<OpportunityHub>();
    const commitments = new Set<OpportunityCommitmentType>();
    let seasonalCount = 0;
    let creditCount = 0;
    for (const o of opportunities) {
      if (o.status === "closed") continue;
      groups.add(TYPE_TO_GROUP[o.type]);
      hubs.add(o.hub);
      commitments.add(o.commitmentType);
      if (o.earnsCredit) creditCount++;
      // Only count listings that match the current (or imminent) DAT season
      if (o.season && activeDatSeasonEndYears.some(y => o.season.includes(String(y)))) seasonalCount++;
    }
    return { availableGroups: groups, availableHubs: hubs, availableCommitments: commitments, hasSeasonal: seasonalCount > 0, hasCredit: creditCount > 0 };
  }, [opportunities, activeDatSeasonEndYears]);

  // ── Filtered list (browse mode) ──────────────────────────────────────
  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      if (o.status === "closed") return false;
      if (filters.typeGroups.length) {
        const group = TYPE_TO_GROUP[o.type];
        if (!filters.typeGroups.includes(group)) return false;
      }
      if (filters.hubs.length && !filters.hubs.includes(o.hub)) return false;
      if (filters.commitments.length && !filters.commitments.includes(o.commitmentType)) return false;
      if (filters.paidOnly && o.funding !== "paid") return false;
      if (filters.creditOnly && !o.earnsCredit) return false;
      if (filters.seasonalOnly) {
        // Match listings whose season field contains the current (or upcoming) DAT season end-year.
        // Works with formats like "2025-26", "AY2026", "Season 2026", etc.
        if (!o.season || !activeDatSeasonEndYears.some(y => o.season.includes(String(y)))) return false;
      }
      return true;
    });
  }, [opportunities, filters]);

  const activeFilterCount =
    filters.typeGroups.length +
    filters.hubs.length +
    filters.commitments.length +
    (filters.paidOnly ? 1 : 0) +
    (filters.creditOnly ? 1 : 0) +
    (filters.seasonalOnly ? 1 : 0);

  const visibleTotal = opportunities.filter((o) => o.status !== "closed").length;

  return (
    <main className="op-root">

      {/* ─────────────────────────── HERO ────────────────────────────── */}
      <section className="op-hero">
        <div className="op-hero-imgwrap" aria-hidden="true">
          <Image
            src="/images/opportunities/team-adventure.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center 28%" }}
          />
        </div>
        <div className="op-hero-overlay" aria-hidden="true" />
        <div className="op-hero-glow" aria-hidden="true" />

        <div className="op-hero-content">
          <span className="op-hero-eyebrow">Opportunities Portal</span>
          <h1 className="op-hero-headline">
            PLACES,<br />
            <span className="op-hero-headline-yellow">EVERYONE.</span>
          </h1>
          <p className="op-hero-sub">
            The work is happening — across the United States, in Ecuador, through Czechia and Slovakia,
            in Tanzania, in Sydney, and everywhere in between. Find your scene with DAT.
          </p>

          <div className="op-hero-hubs">
            {HUB_LIST.filter(h => activeHubs.has(h.key)).map((h, i) => (
              <Link
                key={h.key}
                href={`/opportunities?browse=1&hub=${h.key}`}
                className="op-hero-hub"
              >
                <span className="op-hero-hub-dot" style={{ ["--i" as string]: `${i * 0.18}s` }} />
                {h.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── CLOSED NOTICE ──────────────────────── */}
      {showNotice && (
        <div style={{
          background: "rgba(36,17,35,0.92)",
          color: "#fff",
          padding: "0.75rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          fontSize: "0.95rem",
        }}>
          <span>That opportunity is no longer available.</span>
          <button
            onClick={() => setShowNotice(false)}
            aria-label="Dismiss"
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }}
          >×</button>
        </div>
      )}

      {/* ─────────────────────── BROWSE MODE ─────────────────────────── */}
      {isBrowseMode ? (
        <>
          {/* Path strip — filter chips + back button */}
          <section className="op-pathstrip">
            <div className="op-pathstrip-inner">
              <button
                className="op-pathchip op-pathchip--back"
                onClick={exitBrowseMode}
              >
                ← Overview
              </button>
              <Link
                href={`/opportunities?browse=1&type=${PATH_PRESETS.artist.join(",")}`}
                scroll={false}
                className="op-pathchip op-pathchip--pink"
                onClick={() => applyPath("artist")}
              >
                I'm an Artist
              </Link>
              <Link
                href={`/opportunities?browse=1&type=${PATH_PRESETS.admin.join(",")}`}
                scroll={false}
                className="op-pathchip op-pathchip--purple"
                onClick={() => applyPath("admin")}
              >
                I'm an Arts Admin
              </Link>
              <Link
                href={`/opportunities?browse=1&type=${PATH_PRESETS.volunteer.join(",")}`}
                scroll={false}
                className="op-pathchip op-pathchip--green"
                onClick={() => applyPath("volunteer")}
              >
                I want to Volunteer
              </Link>
              {hasSeasonal && (
                <Link
                  href="/opportunities?browse=1&season=1"
                  scroll={false}
                  className="op-pathchip op-pathchip--gold"
                  onClick={() => applyPath("seasonal")}
                >
                  This Season's Work
                </Link>
              )}
              {activeFilterCount > 0 && (
                <button className="op-pathchip op-pathchip--showall" onClick={clearAll}>
                  Show All <span>×</span>
                </button>
              )}
            </div>
          </section>

          {/* Sticky filter bar */}
          <div ref={filterBarRef} className="op-filterbar-wrap">
            <div className="op-filterbar">
              <FilterGroup label="Type">
                {TYPE_GROUPS.filter((g) => availableGroups.has(g)).map((g) => (
                  <FilterPill
                    key={g}
                    active={filters.typeGroups.includes(g)}
                    color={TYPE_GROUP_META[g].color}
                    onClick={() => toggleType(g)}
                  >
                    {TYPE_GROUP_META[g].label}
                  </FilterPill>
                ))}
              </FilterGroup>

              <FilterGroup label="Hub">
                {OPPORTUNITY_HUBS.filter((h) => availableHubs.has(h)).map((h) => (
                  <FilterPill
                    key={h}
                    active={filters.hubs.includes(h)}
                    color="#2493A9"
                    onClick={() => toggleHub(h)}
                  >
                    {HUB_META[h].label}
                  </FilterPill>
                ))}
              </FilterGroup>

              <FilterGroup label="Commitment">
                {OPPORTUNITY_COMMITMENTS.filter((c) => availableCommitments.has(c)).map((c) => (
                  <FilterPill
                    key={c}
                    active={filters.commitments.includes(c)}
                    color="#6C00AF"
                    onClick={() => toggleCommit(c)}
                  >
                    {COMMITMENT_LABELS[c]}
                  </FilterPill>
                ))}
              </FilterGroup>

              <div className="op-filter-toggles">
                <label className={`op-toggle${filters.paidOnly ? " op-toggle--on" : ""}`}>
                  <input type="checkbox" checked={filters.paidOnly} onChange={togglePaid} />
                  <span className="op-toggle-track"><span className="op-toggle-thumb" /></span>
                  <span>Paid only</span>
                </label>
                {hasCredit && (
                  <label className={`op-toggle${filters.creditOnly ? " op-toggle--on" : ""}`}>
                    <input type="checkbox" checked={filters.creditOnly} onChange={toggleCredit} />
                    <span className="op-toggle-track"><span className="op-toggle-thumb" /></span>
                    <span>For credit</span>
                  </label>
                )}
                {hasSeasonal && (
                  <label className={`op-toggle${filters.seasonalOnly ? " op-toggle--on" : ""}`}>
                    <input type="checkbox" checked={filters.seasonalOnly} onChange={toggleSeasonal} />
                    <span className="op-toggle-track"><span className="op-toggle-thumb" /></span>
                    <span>This season</span>
                  </label>
                )}
              </div>

              {activeFilterCount > 0 && (
                <button className="op-clearall" onClick={clearAll}>
                  Clear all <span>×</span>
                </button>
              )}
            </div>
          </div>

          {/* Full card grid */}
          <section className="op-grid-section">
            <div className="op-grid-shell">
              <div className="op-grid-header">
                <span className="op-grid-count">
                  <strong>{filtered.length}</strong>{" "}
                  {filtered.length === 1 ? "opportunity" : "opportunities"}
                  {activeFilterCount > 0 ? " matching your filters" : " in the full directory"}
                </span>
              </div>
              {filtered.length === 0 ? (
                <EmptyState onClear={clearAll} />
              ) : (
                <div ref={gridRef} className="op-grid">
                  {filtered.map((o, i) => (
                    <OpportunityCard key={o.id} o={o} index={i} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : (

        /* ────────────────────── CURATED MODE ────────────────────────── */
        <>
          {/* Path strip — scroll anchors */}
          <section className="op-pathstrip">
            <div className="op-pathstrip-inner">
              <button
                className="op-pathchip op-pathchip--pink"
                onClick={() => scrollToRef(artistRef)}
              >
                I'm an Artist
              </button>
              <button
                className="op-pathchip op-pathchip--purple"
                onClick={() => scrollToRef(staffRef)}
              >
                I'm an Arts Admin
              </button>
              <button
                className="op-pathchip op-pathchip--green"
                onClick={() => scrollToRef(volunteerRef)}
              >
                I want to Volunteer
              </button>
              {hasSeasonal && (
                <button
                  className="op-pathchip op-pathchip--gold"
                  onClick={() => enterBrowseMode({ seasonalOnly: true })}
                >
                  This Season's Work
                </button>
              )}
            </div>
          </section>

          {/* ─── Grid shell wraps both Zone 1 and Zone 2 ─────────────── */}
          <section className="op-grid-section">
            <div className="op-grid-shell">

              {/* ── Zone 1: Priority listings ─────────────────────────── */}
              {zone1Items.length > 0 && (
                <>
                  <div className="op-zone1-header">
                    <span className="op-zone1-eyebrow">Now — what DAT is building</span>
                  </div>
                  <div className="op-zone1-grid">
                    {zone1Items.map((o, i) => (
                      <OpportunityCard key={o.id} o={o} index={i} />
                    ))}
                  </div>
                  <div className="op-zone-divider" role="separator" />
                </>
              )}

              {/* ── Zone 2: Library sections ──────────────────────────── */}

              {/* Staff & contract */}
              {zone2Staff.length > 0 && (
                <div ref={staffRef} className="op-lib-sec op-lib-sec--staff">
                  <div className="op-lib-sec-imgcol" aria-hidden="true">
                    <Image
                      src="/images/opportunities/admin-collab.jpg"
                      alt=""
                      fill
                      sizes="(max-width:600px) 100vw, clamp(280px,44%,440px)"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="op-lib-sec-content">
                    <div className="op-lib-hd">
                      <h2 className="op-lib-name">Staff &amp; contract</h2>
                      <span className="op-lib-count">{zone2Staff.length} roles</span>
                    </div>
                    {zone2Staff.slice(0, 4).map((o) => (
                      <CompactOpportunityRow key={o.id} o={o} />
                    ))}
                    {zone2Staff.length > 4 && (
                      <button
                        className="op-see-all"
                        onClick={() => enterBrowseMode({ typeGroups: ["arts_admin"] })}
                      >
                        See all {zone2Staff.length} staff &amp; contract roles →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Artist rosters */}
              {zone2Artist.length > 0 && (
                <div ref={artistRef} className="op-lib-sec op-lib-sec--artist">
                  <div className="op-lib-sec-imgcol" aria-hidden="true">
                    <Image
                      src="/images/opportunities/artist-development.jpg"
                      alt=""
                      fill
                      sizes="(max-width:600px) 100vw, clamp(280px,44%,440px)"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="op-lib-sec-content">
                    <div className="op-lib-hd">
                      <h2 className="op-lib-name">Artist rosters</h2>
                      <span className="op-lib-count">{zone2Artist.length} open calls · rolling</span>
                    </div>
                    {zone2Artist.slice(0, 4).map((o) => (
                      <CompactOpportunityRow key={o.id} o={o} />
                    ))}
                    {zone2Artist.length > 4 && (
                      <button
                        className="op-see-all"
                        onClick={() => enterBrowseMode({ typeGroups: ["artist"] })}
                      >
                        See all {zone2Artist.length} artist rosters →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Volunteer & community */}
              {zone2Volunteer.length > 0 && (
                <div ref={volunteerRef} className="op-lib-sec op-lib-sec--volunteer">
                  <div className="op-lib-sec-imgcol" aria-hidden="true">
                    <Image
                      src="/images/opportunities/volunteer-popup.jpg"
                      alt=""
                      fill
                      sizes="(max-width:600px) 100vw, clamp(280px,44%,440px)"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="op-lib-sec-content">
                    <div className="op-lib-hd">
                      <h2 className="op-lib-name">Volunteer &amp; community</h2>
                      <span className="op-lib-count">{zone2Volunteer.length} roles · flexible · year-round</span>
                    </div>
                    {zone2Volunteer.slice(0, 4).map((o) => (
                      <CompactOpportunityRow key={o.id} o={o} />
                    ))}
                    {zone2Volunteer.length > 4 && (
                      <button
                        className="op-see-all"
                        onClick={() => enterBrowseMode({ typeGroups: ["volunteer"] })}
                      >
                        See all {zone2Volunteer.length} volunteer roles →
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="op-browse-inline">
                <span className="op-browse-inline-label">Looking for something specific?</span>
                <button className="op-browse-inline-btn" onClick={() => enterBrowseMode()}>
                  Browse all {visibleTotal} opportunities with full filters →
                </button>
              </div>

            </div>
          </section>
        </>
      )}

      {/* ─────────────────────── PLX BAND (bottom) ────────────────────── */}
      <PLXBand items={opportunities} />

      {/* ─────────────────────── FOOTER CTA ──────────────────────────── */}
      <section className="op-footercta">
        <div className="op-footercta-inner">
          <span className="op-footercta-eyebrow">DON'T SEE THE RIGHT FIT?</span>
          <h2 className="op-footercta-title">Start a conversation.</h2>
          <p className="op-footercta-body">
            DAT is always making something somewhere. Tell us who you are, what you make, and where
            you're headed — and we'll find the door.
          </p>
          <a
            href="mailto:hello@dramaticadventure.com?subject=Opportunities%20Portal%20—%20Reaching%20Out"
            className="op-footercta-btn"
          >
            hello@dramaticadventure.com
          </a>
        </div>
      </section>

      {/* ─────────────────────── STYLES ──────────────────────────────── */}
      <style>{`
        .op-root {
          background: transparent;
          color: #241123;
          overflow-x: hidden;
        }

        /* ────────────── Hero ────────────── */
        .op-hero {
          position: relative;
          min-height: 78vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          background: #0d0812;
        }
        .op-hero-imgwrap {
          position: absolute;
          inset: -6% 0;
          z-index: 0;
          animation: op-hero-pan 18s ease-in-out infinite alternate;
        }
        @keyframes op-hero-pan {
          0%   { transform: scale(1.02) translateY(0); }
          100% { transform: scale(1.06) translateY(-1.2%); }
        }
        .op-hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background:
            linear-gradient(to right,
              rgba(8,3,12,0.55) 0%,
              rgba(8,3,12,0.28) 32%,
              rgba(8,3,12,0.04) 62%,
              rgba(8,3,12,0) 100%),
            linear-gradient(to bottom,
              rgba(8,3,12,0) 0%,
              rgba(8,3,12,0) 55%,
              rgba(8,3,12,0.4) 100%);
        }
        .op-hero-glow {
          position: absolute; inset: 0; z-index: 1;
          background: radial-gradient(ellipse 50% 60% at 80% 40%, rgba(255,204,0,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .op-hero-content {
          position: relative; z-index: 2;
          padding: clamp(5rem, 11vw, 8rem) clamp(1.5rem, 6vw, 5rem);
          max-width: 760px;
        }
        .op-hero-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.28em;
          text-transform: uppercase; color: #FFCC00; margin-bottom: 1rem;
          display: inline-block;
          text-shadow: 0 2px 14px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7);
        }
        .op-hero-headline {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(3.5rem, 10vw, 8.5rem); line-height: 0.92; font-weight: 400;
          color: #fff; margin: 0 0 1.5rem; letter-spacing: 0.01em;
          text-shadow: 0 10px 36px rgba(0,0,0,0.95), 0 3px 12px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.6);
        }
        .op-hero-headline-yellow {
          color: #FFCC00;
          text-shadow: 0 0 40px rgba(255,204,0,0.45), 0 10px 36px rgba(0,0,0,0.95), 0 3px 12px rgba(0,0,0,0.85);
        }
        .op-hero-sub {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 2vw, 1.25rem); color: #fff; line-height: 1.65;
          max-width: 580px; margin: 0 0 2.25rem;
          text-shadow: 0 3px 14px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.75);
        }
        .op-hero-hubs { display: flex; flex-wrap: wrap; gap: 1.25rem; align-items: center; }
        .op-hero-hub {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.74rem; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(255,255,255,0.85);
          display: inline-flex; align-items: center; gap: 0.5rem;
          text-shadow: 0 2px 8px rgba(0,0,0,0.85);
          text-decoration: none;
          transition: color 180ms ease, letter-spacing 220ms ease;
        }
        .op-hero-hub:hover {
          color: #FFCC00;
          letter-spacing: 0.26em;
        }
        .op-hero-hub:hover .op-hero-hub-dot {
          background: #fff;
          box-shadow: 0 0 14px rgba(255,255,255,0.95), 0 0 6px rgba(255,204,0,0.7);
          animation-play-state: paused;
          opacity: 1;
          transform: scale(1.3);
        }
        .op-hero-hub-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #FFCC00; box-shadow: 0 0 8px rgba(255,204,0,0.9);
          animation: op-pulse 2.4s ease-in-out infinite;
          animation-delay: var(--i);
        }
        @keyframes op-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }

        /* ────────────── Path strip ────────────── */
        .op-pathstrip {
          background: #241123;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .op-pathstrip-inner {
          max-width: 1180px; margin: 0 auto;
          padding: 1.5rem clamp(1.25rem, 5vw, 3rem);
          display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;
        }
        .op-pathchip {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem; font-weight: 700; letter-spacing: 0.04em;
          padding: 0.6rem 1.2rem; border-radius: 999px;
          background: transparent; border: 1.5px solid;
          cursor: pointer; display: inline-flex; align-items: center;
          text-decoration: none;
          transition: transform 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease;
        }
        .op-pathchip:hover { transform: translateY(-2px); }
        .op-pathchip--pink   { color: #F23359; border-color: rgba(242,51,89,0.55);  }
        .op-pathchip--pink:hover   { background: rgba(242,51,89,0.18); box-shadow: 0 6px 18px rgba(242,51,89,0.18); }
        .op-pathchip--purple { color: #c089ff; border-color: rgba(192,137,255,0.5); }
        .op-pathchip--purple:hover { background: rgba(108,0,175,0.28); box-shadow: 0 6px 18px rgba(108,0,175,0.2); }
        .op-pathchip--green  { color: #4ed999; border-color: rgba(78,217,153,0.5);  }
        .op-pathchip--green:hover  { background: rgba(47,168,115,0.2); box-shadow: 0 6px 18px rgba(47,168,115,0.18); }
        .op-pathchip--gold   { color: #FFCC00; border-color: rgba(255,204,0,0.5);  }
        .op-pathchip--gold:hover   { background: rgba(255,204,0,0.18); box-shadow: 0 6px 18px rgba(255,204,0,0.22); }
        .op-pathchip--back {
          color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.2);
          font-size: 0.78rem;
        }
        .op-pathchip--back:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .op-pathchip--showall {
          color: rgba(255,255,255,0.65); border-color: rgba(255,255,255,0.25);
          border-style: dashed; margin-left: auto;
        }
        .op-pathchip--showall:hover {
          color: #fff; background: rgba(255,255,255,0.08); border-style: solid;
          box-shadow: 0 6px 18px rgba(255,255,255,0.05);
        }
        .op-pathchip--showall span { font-size: 1.05rem; line-height: 1; margin-left: 0.2rem; }

        /* ────────────── Filter bar (browse mode) ────────────── */
        .op-filterbar-wrap {
          position: sticky; top: 0; z-index: 30;
          background: rgba(28,12,28,0.78);
          backdrop-filter: blur(16px) saturate(140%);
          -webkit-backdrop-filter: blur(16px) saturate(140%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 6px 24px rgba(0,0,0,0.18);
        }
        .op-filterbar {
          max-width: 1180px; margin: 0 auto;
          padding: 1.25rem clamp(1.25rem, 5vw, 3rem);
          display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem;
        }
        .op-filter-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .op-filter-group-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.2em;
          text-transform: uppercase; color: rgba(255,255,255,0.5);
        }
        .op-filter-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .op-pill {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.74rem; font-weight: 700; letter-spacing: 0.06em;
          padding: 0.4rem 0.85rem; border-radius: 999px;
          background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.82);
          border: 1.5px solid rgba(255,255,255,0.1); cursor: pointer;
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease;
        }
        .op-pill:hover { background: rgba(255,255,255,0.14); color: #fff; transform: translateY(-1px); }
        .op-pill--active { background: var(--pa); color: #fff; border-color: var(--pa); }
        .op-pill--active:hover { background: var(--pa); opacity: 0.9; }
        .op-filter-toggles { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
        .op-toggle {
          display: inline-flex; align-items: center; gap: 0.55rem; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.72);
          user-select: none;
        }
        .op-toggle input { display: none; }
        .op-toggle-track {
          width: 32px; height: 18px; background: rgba(255,255,255,0.18);
          border-radius: 999px; position: relative; transition: background 180ms ease;
        }
        .op-toggle-thumb {
          position: absolute; top: 2px; left: 2px;
          width: 14px; height: 14px; border-radius: 50%;
          background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          transition: left 180ms ease;
        }
        .op-toggle--on .op-toggle-track { background: #2FA873; }
        .op-toggle--on .op-toggle-thumb { left: 16px; }
        .op-toggle--on { color: #fff; }
        .op-clearall {
          margin-left: auto;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.74rem; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; padding: 0.5rem 0.95rem; border-radius: 999px;
          background: transparent; border: 1.5px solid rgba(242,51,89,0.55);
          color: #ff5577; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;
          transition: background 160ms ease, transform 160ms ease, color 160ms ease;
        }
        .op-clearall:hover { background: rgba(242,51,89,0.18); color: #fff; transform: translateY(-1px); }
        .op-clearall span { font-size: 1.05rem; line-height: 1; }

        /* ────────────── Grid section + shell (shared) ────────────── */
        .op-grid-section {
          padding: clamp(2rem, 4vw, 3rem) clamp(1.25rem, 5vw, 3rem);
        }
        .op-grid-shell {
          max-width: 1220px; margin: 0 auto;
          background: rgba(36,17,35,0.52);
          border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.07);
          padding: clamp(1.5rem, 3vw, 2.25rem);
          display: flex; flex-direction: column; gap: 1.75rem;
        }
        .op-grid-header { margin-bottom: 1.25rem; }
        .op-grid-count {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.86rem; color: rgba(255,255,255,0.6); letter-spacing: 0.02em;
        }
        .op-grid-count strong {
          font-family: var(--font-anton), sans-serif; font-size: 1.5rem;
          color: #fff; font-weight: 400; margin-right: 0.25rem;
        }
        .op-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem;
        }
        @media (max-width: 1000px) { .op-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 620px)  { .op-grid { grid-template-columns: 1fr; } }

        /* ────────────── Zone 1 ────────────── */
        .op-zone1-header { margin-bottom: 1.1rem; }
        .op-zone1-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.28em;
          text-transform: uppercase; color: #FFCC00;
          display: inline-block;
          background: rgba(255,204,0,0.12);
          border: 1px solid rgba(255,204,0,0.3);
          padding: 0.3rem 0.7rem;
          border-radius: 5px;
        }
        .op-zone1-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 820px)  { .op-zone1-grid { grid-template-columns: 1fr; } }

        /* ── Zone 1: compact, full-bleed, exciting ── */
        .op-zone1-grid .op-card {
          border: none;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
        }
        .op-zone1-grid .op-card .op-card-thumb { aspect-ratio: 16 / 5; }
        .op-zone1-grid .op-card .op-card-body {
          border-top: none;
          background: #fff;
          padding: 0.8rem 1.1rem 0.9rem;
          min-height: clamp(90px, 10vw, 130px);
        }
        /* Clamp zone1 titles to 2 lines — prevents same-row height mismatch */
        .op-zone1-grid .op-card .op-card-titlelink {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-width: 100%;
        }
        /* Image zoom on hover */
        .op-zone1-grid .op-card-thumblink img {
          transition: transform 520ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .op-zone1-grid .op-card:hover .op-card-thumblink img { transform: scale(1.07); }
        /* More dramatic lift + coloured ring */
        .op-zone1-grid .op-card:hover {
          transform: translateY(-10px) scale(1.012);
          box-shadow: 0 32px 68px rgba(0,0,0,0.26), 0 0 0 2.5px var(--ca), 0 8px 20px rgba(0,0,0,0.14);
        }

        /* ── Zone 1 hover-expand (each card independent) ── */
        .op-zone1-grid .op-card .op-card-desc,
        .op-zone1-grid .op-card .op-card-meta,
        .op-zone1-grid .op-card .op-card-roles {
          max-height: 0; overflow: hidden; opacity: 0;
          margin: 0; padding: 0;
          border-top-width: 0; border-bottom-width: 0;
          transition: max-height 300ms ease, opacity 240ms ease;
        }
        .op-zone1-grid .op-card:hover .op-card-desc {
          max-height: 140px; opacity: 1; margin: 0 0 1.1rem;
        }
        .op-zone1-grid .op-card:hover .op-card-meta {
          max-height: 110px; opacity: 1;
          padding: 0.85rem 0; margin: 0 0 1rem;
          border-top-width: 1px; border-bottom-width: 1px;
        }
        .op-zone1-grid .op-card:hover .op-card-roles {
          max-height: 70px; opacity: 1; margin: 0 0 1.15rem;
        }

        .op-zone-divider {
          border: none; border-top: 1px solid rgba(255,255,255,0.08);
          margin: 2rem 0;
        }

        /* ────────────── Zone 2 library sections ────────────── */
        .op-lib-sec {
          border-radius: 14px;
          overflow: hidden;
          display: flex;
          flex-direction: row;
          align-items: stretch;
        }
        /* Image column — left side. Height is driven by the content column;
           photo crops from the bottom via object-position: center top. */
        .op-lib-sec-imgcol {
          position: relative;
          width: clamp(200px, 36%, 440px);
          min-height: 150px;
          overflow: hidden;
          flex-shrink: 0;
          align-self: stretch;
        }
        /* Content column — right side */
        .op-lib-sec-content {
          flex: 1;
          padding: 1.25rem 1.4rem;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        /* Desktop: anchor top — if image is taller than content, crop the bottom */
        .op-lib-sec-imgcol img { object-position: center top; }
        /* Stack on small tablets and mobile */
        @media (max-width: 820px) {
          .op-lib-sec { flex-direction: column; }
          .op-lib-sec-imgcol { width: 100%; min-height: 0; height: 200px; }
          /* Stacked landscape: bias focus toward top so heads stay in frame */
          .op-lib-sec-imgcol img { object-position: center 20%; }
        }
        .op-lib-sec--staff {
          background: rgba(108,0,175,0.22);
          border: 1px solid rgba(108,0,175,0.38);
          --section-accent: #c089ff;
        }
        .op-lib-sec--artist {
          background: rgba(242,51,89,0.16);
          border: 1px solid rgba(242,51,89,0.32);
          --section-accent: #f2718a;
        }
        .op-lib-sec--volunteer {
          background: rgba(47,168,115,0.18);
          border: 1px solid rgba(47,168,115,0.34);
          --section-accent: #4ed999;
        }
        .op-lib-hd {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-bottom: 0.9rem;
        }
        .op-lib-name {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.25rem; font-weight: 700; color: rgba(255,255,255,0.95);
          letter-spacing: -0.01em; margin: 0;
          border-left: 3px solid var(--section-accent);
          padding-left: 0.65rem;
          border-radius: 0;
        }
        .op-lib-count {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem; color: rgba(255,255,255,0.45);
        }

        /* ── Compact opportunity row ── */
        .op-compact-row {
          display: flex; align-items: center; gap: 0.65rem;
          padding: 0.6rem 0;
          border-bottom: 0.5px solid rgba(255,255,255,0.07);
          text-decoration: none;
          transition: padding-left 140ms ease;
        }
        .op-compact-row:last-of-type { border-bottom: none; }
        .op-compact-row:hover { padding-left: 0.25rem; }
        .op-compact-row:hover .op-compact-title { color: var(--section-accent, #c089ff); }
        .op-compact-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
          background: var(--section-accent, #c089ff);
        }
        .op-compact-title {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.9);
          flex: 1; line-height: 1.3;
          transition: color 140ms ease;
        }
        .op-compact-hub {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; color: rgba(255,255,255,0.42); flex-shrink: 0;
        }
        .op-compact-deadline {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem; font-weight: 700; color: #ffab87; flex-shrink: 0;
        }
        .op-compact-badge {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; padding: 0.22rem 0.52rem;
          border-radius: 5px; flex-shrink: 0; white-space: nowrap;
        }
        .op-compact-badge--open     { background: rgba(47,168,115,0.28); color: #5ee8a8; border: 1px solid rgba(47,168,115,0.5); }
        .op-compact-badge--coming_soon { background: rgba(180,130,15,0.28); color: #ffd666; border: 1px solid rgba(180,130,15,0.48); }
        .op-compact-badge--evergreen { background: rgba(36,147,169,0.28); color: #6dd8ec; border: 1px solid rgba(36,147,169,0.48); }

        /* ── See all link ── */
        .op-see-all {
          display: inline-block; margin-top: 0.8rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.74rem; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--section-accent, #c089ff);
          background: transparent; border: none; cursor: pointer; padding: 0;
          transition: opacity 150ms ease;
        }
        .op-see-all:hover { opacity: 0.75; }
        .op-see-all--light { color: rgba(255,255,255,0.75); }
        .op-see-all--light:hover { opacity: 0.9; }

        /* ────────────── Browse inline (inside op-grid-shell) ────────────── */
        .op-browse-inline {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 0.75rem;
          padding: 1rem 0; border-top: 1px solid rgba(255,255,255,0.08);
        }
        .op-browse-inline-label {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem; color: rgba(255,255,255,0.42);
        }
        .op-browse-inline-btn {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #c089ff;
          background: transparent; border: none; cursor: pointer;
          text-decoration: underline; text-underline-offset: 3px;
        }

        /* ────────────── Card ────────────── */
        .op-card {
          background: #fff; border: none;
          border-radius: 16px; overflow: hidden; display: flex; flex-direction: column;
          box-shadow: 0 2px 12px rgba(36,17,35,0.06);
          transition: transform 240ms ease, box-shadow 240ms ease;
          opacity: 0; animation: op-card-in 540ms cubic-bezier(0.2, 0.7, 0.2, 1.04) forwards;
        }
        @keyframes op-card-in {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .op-card:hover { transform: translateY(-6px); box-shadow: 0 18px 48px rgba(36,17,35,0.14); }
        .op-card--featured { background: linear-gradient(to bottom, rgba(255,204,0,0.05) 0%, #fff 35%); }
        .op-card--closed { opacity: 0.55; filter: grayscale(0.35); }
        .op-card--closed:hover { transform: none; box-shadow: 0 2px 12px rgba(36,17,35,0.04); }

        .op-card-thumblink { position: relative; display: block; text-decoration: none; }
        .op-card-thumb {
          position: relative; width: 100%; aspect-ratio: 16 / 9;
          overflow: hidden; background: #1a0d1a;
        }
        .op-card-thumb-fade {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(10,5,14,0.55) 0%, rgba(10,5,14,0.1) 45%, rgba(10,5,14,0) 100%);
          z-index: 1;
        }
        .op-card-thumb-badges {
          position: absolute; top: 0.85rem; left: 0.85rem; right: 0.85rem;
          display: flex; align-items: center; gap: 0.45rem; z-index: 2;
        }
        .op-card-thumb-statusrow {
          position: absolute; bottom: 0.85rem; left: 0.85rem; right: 0.85rem;
          display: flex; flex-wrap: wrap; gap: 0.4rem; z-index: 2;
        }
        .op-card-typebadge {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; padding: 0.32rem 0.65rem; border-radius: 6px;
          background: var(--ca); color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .op-card-star {
          margin-left: auto; color: #241123; font-size: 0.9rem; line-height: 1;
          background: #FFCC00; width: 26px; height: 26px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        }
        .op-card-status {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; padding: 0.28rem 0.55rem; border-radius: 6px;
          backdrop-filter: blur(6px); color: #fff;
        }
        .op-card-status--soon   { background: rgba(217,169,25,0.85); }
        .op-card-status--ever   { background: rgba(36,147,169,0.85); }
        .op-card-status--closed { background: rgba(36,17,35,0.7); }
        .op-card-status--season { background: rgba(108,0,175,0.85); }

        .op-card-body {
          display: flex; flex-direction: column; flex: 1;
          padding: 1.25rem 1.4rem 1.3rem; border-top: none;
        }
        .op-card-title { margin: 0 0 0.55rem; }
        .op-card-titlelink {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.45rem; font-weight: 400; line-height: 1.1;
          color: #241123; text-decoration: none; letter-spacing: 0.005em;
          transition: color 160ms ease;
        }
        .op-card-titlelink:hover { color: var(--ca); }
        .op-card-hub {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem; font-weight: 600; color: #6C00AF; margin-bottom: 0.85rem;
        }
        .op-card-hub-icon { display: inline-flex; }
        .op-card-hub-country { color: rgba(36,17,35,0.5); font-weight: 500; margin-left: 0.05rem; }
        .op-card-desc {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.9rem; line-height: 1.6; color: rgba(36,17,35,0.75);
          margin: 0 0 1.1rem; display: -webkit-box;
          -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .op-card-meta {
          display: flex; flex-direction: column; gap: 0.5rem;
          padding: 0.85rem 0; border-top: 1px solid rgba(36,17,35,0.08);
          border-bottom: 1px solid rgba(36,17,35,0.08); margin-bottom: 1rem;
        }
        .op-card-meta-row {
          display: flex; align-items: center; gap: 0.55rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.84rem; color: rgba(36,17,35,0.78);
        }
        .op-card-meta-icon { color: var(--ca); display: inline-flex; align-items: center; }
        .op-card-meta-row--deadline { justify-content: space-between; color: rgba(36,17,35,0.85); }
        .op-card-deadline-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.18em;
          text-transform: uppercase; color: rgba(36,17,35,0.5);
        }
        .op-card-deadline-value { font-weight: 700; color: var(--ca); }
        .op-card-credit-badge {
          display: inline-flex; align-items: center;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.64rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; padding: 0.28rem 0.6rem; border-radius: 999px;
          background: rgba(36,147,169,0.12); color: #1a7a8c;
          border: 1px solid rgba(36,147,169,0.4);
        }
        .op-card-roles { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 1.15rem; }
        .op-card-role-tag {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem; font-weight: 600; padding: 0.22rem 0.55rem;
          border-radius: 999px; background: rgba(36,17,35,0.05); color: rgba(36,17,35,0.65);
        }
        .op-card-role-tag--more { background: transparent; color: rgba(36,17,35,0.45); font-weight: 700; }
        .op-card-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: auto; }
        .op-card-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.74rem; font-weight: 700; letter-spacing: 0.14em;
          text-transform: uppercase; padding: 0.7rem 1.05rem; border-radius: 10px;
          text-decoration: none; flex: 1 1 auto; text-align: center;
          transition: transform 160ms ease, background 160ms ease, opacity 160ms ease;
        }
        .op-card-cta--primary { background: var(--ca); color: #fff; }
        .op-card-cta--primary:hover { transform: translateY(-2px); opacity: 0.92; }
        .op-card-cta--ghost { background: transparent; color: var(--ca); border: 1.5px solid var(--cb); }
        .op-card-cta--ghost:hover { background: var(--cc); transform: translateY(-2px); }

        /* ────────────── Empty state ────────────── */
        .op-empty {
          padding: 4rem 2rem; background: rgba(255,255,255,0.04);
          border: 1.5px dashed rgba(255,255,255,0.14); border-radius: 16px; text-align: center;
        }
        .op-empty-mark { font-family: var(--font-anton), sans-serif; font-size: 4rem; color: rgba(192,137,255,0.7); line-height: 1; margin-bottom: 1rem; }
        .op-empty-title { font-family: var(--font-anton), sans-serif; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 400; color: #fff; margin: 0 0 0.6rem; letter-spacing: 0.01em; }
        .op-empty-body { font-family: var(--font-space-grotesk), sans-serif; font-size: 0.95rem; color: rgba(255,255,255,0.55); margin: 0 0 1.6rem; line-height: 1.6; }
        .op-empty-btn { font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; padding: 0.85rem 1.5rem; border-radius: 10px; background: #FFCC00; color: #241123; border: none; cursor: pointer; transition: transform 160ms ease, opacity 160ms ease; }
        .op-empty-btn:hover { transform: translateY(-2px); opacity: 0.92; }

        /* ────────────── PLX band ────────────── */
        .op-plx-band {
          position: relative; padding: clamp(4rem, 9vw, 7rem) clamp(1.25rem, 5vw, 3rem);
          background: #0d0812; color: #fff; overflow: hidden; isolation: isolate;
        }
        .op-plx-bgimg { position: absolute; inset: 0; z-index: 0; opacity: 1; }
        .op-plx-scrim {
          position: absolute; inset: 0; z-index: 1;
          background:
            linear-gradient(115deg, rgba(10,4,22,0.85) 0%, rgba(10,4,22,0.65) 30%, rgba(10,4,22,0.3) 60%, rgba(10,4,22,0.08) 100%),
            linear-gradient(to bottom, rgba(10,4,22,0) 0%, rgba(10,4,22,0) 35%, rgba(10,4,22,0.55) 100%),
            radial-gradient(ellipse 50% 60% at 78% 30%, rgba(255,204,0,0.16) 0%, transparent 70%);
          pointer-events: none;
        }
        .op-plx-inner { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; }
        .op-plx-headline { max-width: 760px; margin-bottom: 2.5rem; }
        .op-plx-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.6rem, 6vw, 4.6rem); font-weight: 400; line-height: 1;
          letter-spacing: 0.01em; margin: 0 0 1rem; color: #fff;
          text-shadow: 0 10px 36px rgba(0,0,0,0.9), 0 3px 12px rgba(0,0,0,0.8);
        }
        .op-plx-title-em {
          font-family: var(--font-space-grotesk), sans-serif; font-size: 0.42em; font-weight: 600;
          letter-spacing: 0.04em; color: rgba(255,255,255,0.78); vertical-align: middle;
          display: inline-block; margin-left: 0.4em;
          text-shadow: 0 2px 10px rgba(0,0,0,0.85);
        }
        .op-plx-sub { font-family: var(--font-space-grotesk), sans-serif; font-size: 1.04rem; line-height: 1.7; color: rgba(255,255,255,0.92); margin: 0; text-shadow: 0 3px 14px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7); }
        .op-plx-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        @media (max-width: 820px) { .op-plx-grid { grid-template-columns: 1fr; } }
        .op-plx-tile {
          background: rgba(15,8,28,0.55); border: 1.5px solid rgba(255,255,255,0.14);
          border-top: 4px solid var(--accent); border-radius: 18px; padding: 1.75rem 1.75rem 1.5rem;
          display: flex; flex-direction: column;
          backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%);
          box-shadow: 0 18px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
          transition: transform 250ms ease, border-color 250ms ease, background 250ms ease;
        }
        .op-plx-tile:hover { transform: translateY(-4px); background: rgba(15,8,28,0.7); border-color: rgba(255,255,255,0.28); }
        .op-plx-tile-tag { align-self: flex-start; font-family: var(--font-dm-sans), sans-serif; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; padding: 0.35rem 0.8rem; border-radius: 6px; background: var(--accent); color: #241123; margin-bottom: 1rem; }
        .op-plx-tile-title { font-family: var(--font-anton), sans-serif; font-size: clamp(1.5rem, 2.6vw, 2rem); font-weight: 400; line-height: 1.05; margin: 0 0 0.85rem; color: #fff; }
        .op-plx-tile-desc { font-family: var(--font-space-grotesk), sans-serif; font-size: 0.92rem; line-height: 1.65; color: rgba(255,255,255,0.78); margin: 0 0 1.5rem; }
        .op-plx-tile-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 0 0 1.5rem; padding: 0; }
        @media (max-width: 480px) { .op-plx-tile-meta { grid-template-columns: 1fr; } }
        .op-plx-tile-meta div { display: flex; flex-direction: column; gap: 0.15rem; }
        .op-plx-tile-meta dt { font-family: var(--font-dm-sans), sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.5); }
        .op-plx-tile-meta dd { font-family: var(--font-space-grotesk), sans-serif; font-size: 0.92rem; font-weight: 600; color: #fff; margin: 0; }
        .op-plx-tile-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .op-plx-tile-cta { font-family: var(--font-dm-sans), sans-serif; font-size: 0.76rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 0.85rem 1.3rem; border-radius: 10px; text-decoration: none; transition: transform 160ms ease, opacity 160ms ease, background 160ms ease; }
        .op-plx-tile-cta--primary { background: var(--accent); color: #241123; }
        .op-plx-tile-cta--primary:hover { transform: translateY(-2px); opacity: 0.94; }
        .op-plx-tile-cta--ghost { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.35); }
        .op-plx-tile-cta--ghost:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .op-plx-band-note {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem; color: rgba(255,255,255,0.55);
          margin: 0.6rem 0 0; line-height: 1.5;
        }
        .op-plx-footer-links {
          display: flex; align-items: center; gap: 2rem; margin-top: 2rem; flex-wrap: wrap;
        }
        .op-plx-learnmore { display: inline-block; font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.7); border-bottom: 1.5px solid rgba(255,204,0,0.6); padding-bottom: 0.15rem; text-decoration: none; transition: color 160ms ease, border-color 160ms ease; }
        .op-plx-learnmore:hover { color: #FFCC00; border-color: #FFCC00; }
        .op-plx-learnmore--dim { color: rgba(255,255,255,0.45); border-bottom-color: rgba(255,255,255,0.2); }
        .op-plx-learnmore--dim:hover { color: rgba(255,255,255,0.8); border-bottom-color: rgba(255,255,255,0.5); }

        /* ────────────── Footer CTA ────────────── */
        .op-footercta {
          background: #6C00AF;
          background-image: radial-gradient(ellipse at top right, rgba(255,204,0,0.18) 0%, transparent 60%);
          padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 3rem); color: #fff;
        }
        .op-footercta-inner { max-width: 760px; margin: 0 auto; text-align: center; }
        .op-footercta-eyebrow { font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: #FFCC00; display: block; margin-bottom: 1rem; }
        .op-footercta-title { font-family: var(--font-anton), sans-serif; font-size: clamp(2.4rem, 5vw, 4rem); font-weight: 400; line-height: 1.02; margin: 0 0 1.2rem; color: #fff; }
        .op-footercta-body { font-family: var(--font-space-grotesk), sans-serif; font-size: clamp(1rem, 1.8vw, 1.15rem); line-height: 1.7; color: rgba(255,255,255,0.85); margin: 0 0 2.25rem; }
        .op-footercta-btn { display: inline-block; font-family: var(--font-dm-sans), sans-serif; font-size: 0.9rem; font-weight: 700; letter-spacing: 0.12em; padding: 1.1rem 1.9rem; background: #FFCC00; color: #241123; border-radius: 12px; text-decoration: none; transition: transform 180ms ease, opacity 180ms ease; }
        .op-footercta-btn:hover { transform: translateY(-2px); opacity: 0.94; }
      `}</style>
    </main>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────── */

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="op-filter-group">
      <span className="op-filter-group-label">{label}</span>
      <div className="op-filter-pills">{children}</div>
    </div>
  );
}

function FilterPill({
  active, color, onClick, children,
}: {
  active: boolean; color: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      className={`op-pill${active ? " op-pill--active" : ""}`}
      style={{ ["--pa" as string]: color }}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="op-empty">
      <div className="op-empty-mark">∅</div>
      <h3 className="op-empty-title">No adventures match those filters — yet.</h3>
      <p className="op-empty-body">
        Try widening your search. New opportunities open at the start of every season —
        and we keep general-interest rosters open year-round.
      </p>
      <button className="op-empty-btn" onClick={onClear}>
        Clear all filters
      </button>
    </div>
  );
}

// `TYPE_META` and `TYPE_GROUP_TO_TYPES` are imported for parity with the data layer.
// Reference them once so the linter sees them as in-use.
void TYPE_META;
void TYPE_GROUP_TO_TYPES;
