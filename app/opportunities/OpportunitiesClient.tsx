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

/* ─── Path-strip mapping: which display groups each path activates ──── */
const PATH_PRESETS: Record<"artist" | "admin" | "volunteer" | "seasonal", TypeGroup[]> = {
  artist: ["artist", "audition"],
  admin: ["arts_admin", "plx"],
  volunteer: ["volunteer"],
  seasonal: [], // seasonal uses the seasonalOnly toggle instead
};

const HUB_LIST: { key: OpportunityHub; label: string }[] = [
  { key: "nyc", label: "New York" },
  { key: "quito", label: "Quito" },
  { key: "brno", label: "Brno" },
  { key: "bagamoyo", label: "Bagamoyo" },
  { key: "sydney", label: "Sydney" },
  { key: "remote", label: "Remote" },
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

/* ─── Card ──────────────────────────────────────────────────────────── */
function OpportunityCard({ o, index }: { o: Opportunity; index: number }) {
  const group = TYPE_TO_GROUP[o.type];
  const meta = TYPE_GROUP_META[group];
  const hub = HUB_META[o.hub];
  const isClosed = o.status === "closed";
  const isEvergreen = o.status === "evergreen";
  const isComingSoon = o.status === "coming_soon";

  // Learn More always goes to the detail page; explicit learnMoreUrl is a deeper override.
  const learnHref = o.learnMoreUrl || `/opportunities/${o.id}`;
  // Apply Now: prefer explicit applyUrl, otherwise the universal /apply form.
  const applyHref = o.applyUrl || `/apply?opp=${o.id}`;

  const heroImage = o.heroImage || "/images/opportunities/collaboration-joy.jpg";

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
            <span className="op-card-meta-icon">
              {o.isPaid ? <IconDollar /> : <IconHeart />}
            </span>
            <span>{o.isPaid ? o.compensation : "Volunteer"}</span>
          </div>
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

/* ─── PLX Band (bottom of page) ─────────────────────────────────────── */
function PLXBand({ items }: { items: Opportunity[] }) {
  if (!hasActivePlx(items)) return null;
  const plx = items.filter(
    (o) =>
      (o.plxProgram === "internship" || o.plxProgram === "apprenticeship") &&
      (o.status === "open" || o.status === "coming_soon"),
  );
  const intern = plx.find((p) => p.plxProgram === "internship");
  const apprentice = plx.find((p) => p.plxProgram === "apprenticeship");

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
            DAT's flagship training program for emerging arts administrators. Real-world experience,
            paid stipends, and direct mentorship — across theatre, eco-travel, and global community work.
          </p>
        </div>

        <div className="op-plx-grid">
          {intern && <PlxTile o={intern} accent="#FFCC00" />}
          {apprentice && <PlxTile o={apprentice} accent="#F23359" />}
        </div>

        <Link href="/professional-leadership-experience" className="op-plx-learnmore">
          What is PLX? →
        </Link>
      </div>
    </section>
  );
}

function PlxTile({ o, accent }: { o: Opportunity; accent: string }) {
  const applyHref = o.applyUrl || `/apply?opp=${o.id}`;
  const learnHref = o.learnMoreUrl || `/opportunities/${o.id}`;
  return (
    <div className="op-plx-tile" style={{ ["--accent" as string]: accent }}>
      <span className="op-plx-tile-tag">
        {o.plxProgram === "internship" ? "Internship" : "Apprenticeship"}
      </span>
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
          Apply for the {o.plxProgram === "internship" ? "Internship" : "Apprenticeship"}
        </a>
      </div>
    </div>
  );
}

/* ─── Main client component ─────────────────────────────────────────── */

interface FilterState {
  typeGroups: TypeGroup[];
  hubs: OpportunityHub[];
  commitments: OpportunityCommitmentType[];
  paidOnly: boolean;
  showClosed: boolean;
  seasonalOnly: boolean;
}

const EMPTY_FILTERS: FilterState = {
  typeGroups: [],
  hubs: [],
  commitments: [],
  paidOnly: false,
  showClosed: false,
  seasonalOnly: false,
};

function parseListParam(v: string | null, allowed: readonly string[]): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter((x) => allowed.includes(x));
}

export default function OpportunitiesClient({ opportunities }: { opportunities: Opportunity[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  useEffect(() => {
    setFilters({
      typeGroups: parseListParam(searchParams.get("type"), TYPE_GROUPS as readonly string[]) as TypeGroup[],
      hubs: parseListParam(searchParams.get("hub"), OPPORTUNITY_HUBS as readonly string[]) as OpportunityHub[],
      commitments: parseListParam(searchParams.get("commit"), OPPORTUNITY_COMMITMENTS as readonly string[]) as OpportunityCommitmentType[],
      paidOnly: searchParams.get("paid") === "1",
      showClosed: searchParams.get("closed") === "1",
      seasonalOnly: searchParams.get("season") === "1",
    });
  }, [searchParams]);

  const updateFilters = (next: FilterState) => {
    setFilters(next);
    const params = new URLSearchParams();
    if (next.typeGroups.length) params.set("type", next.typeGroups.join(","));
    if (next.hubs.length) params.set("hub", next.hubs.join(","));
    if (next.commitments.length) params.set("commit", next.commitments.join(","));
    if (next.paidOnly) params.set("paid", "1");
    if (next.showClosed) params.set("closed", "1");
    if (next.seasonalOnly) params.set("season", "1");
    const qs = params.toString();
    router.replace(qs ? `/opportunities?${qs}` : "/opportunities", { scroll: false });
  };

  const toggleType = (t: TypeGroup) =>
    updateFilters({
      ...filters,
      typeGroups: filters.typeGroups.includes(t) ? filters.typeGroups.filter((x) => x !== t) : [...filters.typeGroups, t],
    });
  const toggleHub = (h: OpportunityHub) =>
    updateFilters({
      ...filters,
      hubs: filters.hubs.includes(h) ? filters.hubs.filter((x) => x !== h) : [...filters.hubs, h],
    });
  const toggleCommit = (c: OpportunityCommitmentType) =>
    updateFilters({
      ...filters,
      commitments: filters.commitments.includes(c) ? filters.commitments.filter((x) => x !== c) : [...filters.commitments, c],
    });
  const togglePaid = () => updateFilters({ ...filters, paidOnly: !filters.paidOnly });
  const toggleClosed = () => updateFilters({ ...filters, showClosed: !filters.showClosed });
  const toggleSeasonal = () => updateFilters({ ...filters, seasonalOnly: !filters.seasonalOnly });
  const clearAll = () => updateFilters(EMPTY_FILTERS);

  const applyPath = (..._args: unknown[]) => {
    void _args;
    setTimeout(() => {
      const target = filterBarRef.current;
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top, behavior: "smooth" });
    }, 120);
  };

  // ── Dynamic filter availability ──
  const { availableGroups, availableHubs, availableCommitments, hasSeasonal } = useMemo(() => {
    const groups = new Set<TypeGroup>();
    const hubs = new Set<OpportunityHub>();
    const commitments = new Set<OpportunityCommitmentType>();
    let seasonalCount = 0;
    for (const o of opportunities) {
      if (o.status === "closed" && !filters.showClosed) continue;
      groups.add(TYPE_TO_GROUP[o.type]);
      hubs.add(o.hub);
      commitments.add(o.commitmentType);
      if (o.season) seasonalCount++;
    }
    return {
      availableGroups: groups,
      availableHubs: hubs,
      availableCommitments: commitments,
      hasSeasonal: seasonalCount > 0,
    };
  }, [opportunities, filters.showClosed]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      if (!filters.showClosed && o.status === "closed") return false;
      if (filters.typeGroups.length) {
        const group = TYPE_TO_GROUP[o.type];
        if (!filters.typeGroups.includes(group)) return false;
      }
      if (filters.hubs.length && !filters.hubs.includes(o.hub)) return false;
      if (filters.commitments.length && !filters.commitments.includes(o.commitmentType)) return false;
      if (filters.paidOnly && !o.isPaid) return false;
      if (filters.seasonalOnly && !o.season) return false;
      return true;
    });
  }, [opportunities, filters]);

  const activeFilterCount =
    filters.typeGroups.length +
    filters.hubs.length +
    filters.commitments.length +
    (filters.paidOnly ? 1 : 0) +
    (filters.showClosed ? 1 : 0) +
    (filters.seasonalOnly ? 1 : 0);

  const closedCount = opportunities.filter((o) => o.status === "closed").length;

  return (
    <main className="op-root">
      {/* ───────────────────────────── HERO ─────────────────────────── */}
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
            The work is happening — in NYC, in Quito, in Brno, in Bagamoyo, in Sydney, and everywhere
            in between. Find your scene with DAT.
          </p>

          <div className="op-hero-hubs">
            {HUB_LIST.map((h, i) => (
              <span key={h.key} className="op-hero-hub">
                <span className="op-hero-hub-dot" style={{ ["--i" as string]: `${i * 0.18}s` }} />
                {h.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── PATH STRIP ───────────────────────── */}
      <section className="op-pathstrip">
        <div className="op-pathstrip-inner">
          <Link
            href={`/opportunities?type=${PATH_PRESETS.artist.join(",")}`}
            scroll={false}
            className="op-pathchip op-pathchip--pink"
            onClick={() => applyPath("artist")}
          >
            I'm an Artist
          </Link>
          <Link
            href={`/opportunities?type=${PATH_PRESETS.admin.join(",")}`}
            scroll={false}
            className="op-pathchip op-pathchip--purple"
            onClick={() => applyPath("admin")}
          >
            I'm an Arts Admin
          </Link>
          <Link
            href={`/opportunities?type=${PATH_PRESETS.volunteer.join(",")}`}
            scroll={false}
            className="op-pathchip op-pathchip--green"
            onClick={() => applyPath("volunteer")}
          >
            I want to Volunteer
          </Link>
          {hasSeasonal && (
            <Link
              href={`/opportunities?season=1`}
              scroll={false}
              className="op-pathchip op-pathchip--gold"
              onClick={() => applyPath("seasonal")}
            >
              This Season's Work
            </Link>
          )}
          {activeFilterCount > 0 && (
            <Link
              href="/opportunities"
              scroll={false}
              className="op-pathchip op-pathchip--showall"
              onClick={() => applyPath()}
            >
              Show All
            </Link>
          )}
        </div>
      </section>

      {/* ───────────────────────── FILTER BAR ───────────────────────── */}
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
            {hasSeasonal && (
              <label className={`op-toggle${filters.seasonalOnly ? " op-toggle--on" : ""}`}>
                <input type="checkbox" checked={filters.seasonalOnly} onChange={toggleSeasonal} />
                <span className="op-toggle-track"><span className="op-toggle-thumb" /></span>
                <span>Seasonal only</span>
              </label>
            )}
            <label className={`op-toggle${filters.showClosed ? " op-toggle--on" : ""}`}>
              <input type="checkbox" checked={filters.showClosed} onChange={toggleClosed} />
              <span className="op-toggle-track"><span className="op-toggle-thumb" /></span>
              <span>Show closed{closedCount > 0 ? ` (${closedCount})` : ""}</span>
            </label>
          </div>

          {activeFilterCount > 0 && (
            <button className="op-clearall" onClick={clearAll}>
              Clear all <span>×</span>
            </button>
          )}
        </div>
      </div>

      {/* ───────────────────────── GRID ─────────────────────────────── */}
      <section className="op-grid-section">
        <div className="op-grid-shell">
          <div className="op-grid-header">
            <span className="op-grid-count">
              <strong>{filtered.length}</strong> {filtered.length === 1 ? "opportunity" : "opportunities"}
              {activeFilterCount > 0 ? " matching your filters" : " open right now"}
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

      {/* ───────────────────────── PLX BAND (BOTTOM) ─────────────────── */}
      <PLXBand items={opportunities} />

      {/* ───────────────────────── FOOTER CTA ────────────────────── */}
      <section className="op-footercta">
        <div className="op-footercta-inner">
          <span className="op-footercta-eyebrow">DON'T SEE THE RIGHT FIT?</span>
          <h2 className="op-footercta-title">Start a conversation.</h2>
          <p className="op-footercta-body">
            DAT is always making something somewhere. Tell us who you are, what you make, and where you're
            headed — and we'll find the door.
          </p>
          <a
            href="mailto:hello@dramaticadventure.com?subject=Opportunities%20Portal%20—%20Reaching%20Out"
            className="op-footercta-btn"
          >
            hello@dramaticadventure.com
          </a>
        </div>
      </section>

      {/* ───────────────────────── STYLES ────────────────────────── */}
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
        /* Whisper-light overlay — the photo carries the page, text legibility comes from shadows */
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
          background:
            radial-gradient(ellipse 50% 60% at 80% 40%, rgba(255,204,0,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .op-hero-content {
          position: relative; z-index: 2;
          padding: clamp(5rem, 11vw, 8rem) clamp(1.5rem, 6vw, 5rem);
          max-width: 760px;
        }
        .op-hero-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #FFCC00;
          margin-bottom: 1rem;
          display: inline-block;
          text-shadow: 0 2px 14px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7);
        }
        .op-hero-headline {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(3.5rem, 10vw, 8.5rem);
          line-height: 0.92;
          font-weight: 400;
          color: #fff;
          margin: 0 0 1.5rem;
          letter-spacing: 0.01em;
          text-shadow:
            0 10px 36px rgba(0,0,0,0.95),
            0 3px 12px rgba(0,0,0,0.85),
            0 0 2px rgba(0,0,0,0.6);
        }
        .op-hero-headline-yellow {
          color: #FFCC00;
          text-shadow:
            0 0 40px rgba(255,204,0,0.45),
            0 10px 36px rgba(0,0,0,0.95),
            0 3px 12px rgba(0,0,0,0.85);
        }
        .op-hero-sub {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: #fff;
          line-height: 1.65;
          max-width: 580px;
          margin: 0 0 2.25rem;
          text-shadow: 0 3px 14px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.75);
        }
        .op-hero-hubs {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
          align-items: center;
        }
        .op-hero-hub {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.85);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-shadow: 0 2px 8px rgba(0,0,0,0.85);
        }
        .op-hero-hub-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #FFCC00;
          box-shadow: 0 0 8px rgba(255,204,0,0.9);
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
          max-width: 1180px;
          margin: 0 auto;
          padding: 1.5rem clamp(1.25rem, 5vw, 3rem);
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
        }
        .op-pathchip {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          background: transparent;
          border: 1.5px solid;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
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
        .op-pathchip--showall {
          color: rgba(255,255,255,0.65);
          border-color: rgba(255,255,255,0.25);
          border-style: dashed;
          margin-left: auto;
        }
        .op-pathchip--showall:hover {
          color: #fff;
          background: rgba(255,255,255,0.08);
          border-style: solid;
          box-shadow: 0 6px 18px rgba(255,255,255,0.05);
        }

        /* ────────────── Filter bar (dark glass) ────────────── */
        .op-filterbar-wrap {
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(28,12,28,0.78);
          backdrop-filter: blur(16px) saturate(140%);
          -webkit-backdrop-filter: blur(16px) saturate(140%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 6px 24px rgba(0,0,0,0.18);
        }
        .op-filterbar {
          max-width: 1180px;
          margin: 0 auto;
          padding: 1.25rem clamp(1.25rem, 5vw, 3rem);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1.5rem;
        }
        .op-filter-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .op-filter-group-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }
        .op-filter-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .op-pill {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 0.4rem 0.85rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.82);
          border: 1.5px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease, transform 160ms ease;
        }
        .op-pill:hover { background: rgba(255,255,255,0.14); color: #fff; transform: translateY(-1px); }
        .op-pill--active {
          background: var(--pa);
          color: #fff;
          border-color: var(--pa);
        }
        .op-pill--active:hover { background: var(--pa); opacity: 0.9; }

        .op-filter-toggles {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }
        .op-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255,255,255,0.72);
          user-select: none;
        }
        .op-toggle input { display: none; }
        .op-toggle-track {
          width: 32px; height: 18px;
          background: rgba(255,255,255,0.18);
          border-radius: 999px;
          position: relative;
          transition: background 180ms ease;
        }
        .op-toggle-thumb {
          position: absolute; top: 2px; left: 2px;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          transition: left 180ms ease;
        }
        .op-toggle--on .op-toggle-track { background: #2FA873; }
        .op-toggle--on .op-toggle-thumb { left: 16px; }
        .op-toggle--on { color: #fff; }

        .op-clearall {
          margin-left: auto;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 0.5rem 0.95rem;
          border-radius: 999px;
          background: transparent;
          border: 1.5px solid rgba(242,51,89,0.55);
          color: #ff5577;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: background 160ms ease, transform 160ms ease, color 160ms ease;
        }
        .op-clearall:hover { background: rgba(242,51,89,0.18); color: #fff; transform: translateY(-1px); }
        .op-clearall span { font-size: 1.05rem; line-height: 1; }

        /* ────────────── Grid section ────────────── */
        .op-grid-section {
          padding: clamp(2rem, 4vw, 3rem) clamp(1.25rem, 5vw, 3rem);
        }
        .op-grid-shell {
          max-width: 1220px;
          margin: 0 auto;
          background: rgba(254,250,242,0.78);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.5);
          box-shadow: 0 6px 32px rgba(36,17,35,0.05), inset 0 1px 0 rgba(255,255,255,0.5);
          padding: clamp(1.5rem, 3vw, 2.25rem);
        }
        .op-grid-header { margin-bottom: 1.25rem; }
        .op-grid-count {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.86rem;
          color: rgba(36,17,35,0.7);
          letter-spacing: 0.02em;
        }
        .op-grid-count strong {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.5rem;
          color: #241123;
          font-weight: 400;
          margin-right: 0.25rem;
        }
        .op-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 1000px) { .op-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 620px)  { .op-grid { grid-template-columns: 1fr; } }

        /* ────────────── Card ────────────── */
        .op-card {
          background: #fff;
          border: 1.5px solid rgba(36,17,35,0.08);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 12px rgba(36,17,35,0.06);
          transition: transform 240ms ease, box-shadow 240ms ease, border-color 240ms ease;
          opacity: 0;
          animation: op-card-in 540ms cubic-bezier(0.2, 0.7, 0.2, 1.04) forwards;
        }
        @keyframes op-card-in {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .op-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 48px rgba(36,17,35,0.14);
          border-color: var(--cb);
        }
        .op-card--featured {
          background: linear-gradient(to bottom, rgba(255,204,0,0.05) 0%, #fff 35%);
        }
        .op-card--closed {
          opacity: 0.55;
          filter: grayscale(0.35);
        }
        .op-card--closed:hover { transform: none; box-shadow: 0 2px 12px rgba(36,17,35,0.04); }

        /* Thumbnail */
        .op-card-thumblink { position: relative; display: block; text-decoration: none; }
        .op-card-thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: #1a0d1a;
        }
        .op-card-thumb-fade {
          position: absolute; inset: 0;
          background: linear-gradient(to top,
            rgba(10,5,14,0.55) 0%,
            rgba(10,5,14,0.1) 45%,
            rgba(10,5,14,0) 100%);
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
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 0.32rem 0.65rem;
          border-radius: 6px;
          background: var(--ca);
          color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .op-card-star {
          margin-left: auto;
          color: #241123;
          font-size: 0.9rem;
          line-height: 1;
          background: #FFCC00;
          width: 26px; height: 26px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        }
        .op-card-status {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 0.28rem 0.55rem;
          border-radius: 6px;
          backdrop-filter: blur(6px);
          color: #fff;
        }
        .op-card-status--soon   { background: rgba(217,169,25,0.85); }
        .op-card-status--ever   { background: rgba(36,147,169,0.85); }
        .op-card-status--closed { background: rgba(36,17,35,0.7); }
        .op-card-status--season { background: rgba(108,0,175,0.85); }

        /* Body */
        .op-card-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 1.25rem 1.4rem 1.3rem;
          border-top: 4px solid var(--ca);
        }
        .op-card-title {
          margin: 0 0 0.55rem;
        }
        .op-card-titlelink {
          font-family: var(--font-anton), sans-serif;
          font-size: 1.45rem;
          font-weight: 400;
          line-height: 1.1;
          color: #241123;
          text-decoration: none;
          letter-spacing: 0.005em;
          transition: color 160ms ease;
        }
        .op-card-titlelink:hover { color: var(--ca); }
        .op-card-hub {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: #6C00AF;
          margin-bottom: 0.85rem;
        }
        .op-card-hub-icon { display: inline-flex; }
        .op-card-hub-country {
          color: rgba(36,17,35,0.5);
          font-weight: 500;
          margin-left: 0.05rem;
        }
        .op-card-desc {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.9rem;
          line-height: 1.6;
          color: rgba(36,17,35,0.75);
          margin: 0 0 1.1rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .op-card-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.85rem 0;
          border-top: 1px solid rgba(36,17,35,0.08);
          border-bottom: 1px solid rgba(36,17,35,0.08);
          margin-bottom: 1rem;
        }
        .op-card-meta-row {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.84rem;
          color: rgba(36,17,35,0.78);
        }
        .op-card-meta-icon { color: var(--ca); display: inline-flex; align-items: center; }
        .op-card-meta-row--deadline {
          justify-content: space-between;
          color: rgba(36,17,35,0.85);
        }
        .op-card-deadline-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(36,17,35,0.5);
        }
        .op-card-deadline-value {
          font-weight: 700;
          color: var(--ca);
        }

        .op-card-roles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-bottom: 1.15rem;
        }
        .op-card-role-tag {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 600;
          padding: 0.22rem 0.55rem;
          border-radius: 999px;
          background: rgba(36,17,35,0.05);
          color: rgba(36,17,35,0.65);
        }
        .op-card-role-tag--more {
          background: transparent;
          color: rgba(36,17,35,0.45);
          font-weight: 700;
        }

        .op-card-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: auto; }
        .op-card-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 0.7rem 1.05rem;
          border-radius: 10px;
          text-decoration: none;
          flex: 1 1 auto;
          text-align: center;
          transition: transform 160ms ease, background 160ms ease, opacity 160ms ease;
        }
        .op-card-cta--primary {
          background: var(--ca);
          color: #fff;
        }
        .op-card-cta--primary:hover { transform: translateY(-2px); opacity: 0.92; }
        .op-card-cta--ghost {
          background: transparent;
          color: var(--ca);
          border: 1.5px solid var(--cb);
        }
        .op-card-cta--ghost:hover {
          background: var(--cc);
          transform: translateY(-2px);
        }

        /* ────────────── Empty state ────────────── */
        .op-empty {
          padding: 4rem 2rem;
          background: rgba(255,255,255,0.7);
          border: 1.5px dashed rgba(36,17,35,0.18);
          border-radius: 16px;
          text-align: center;
        }
        .op-empty-mark {
          font-family: var(--font-anton), sans-serif;
          font-size: 4rem;
          color: rgba(108,0,175,0.5);
          line-height: 1;
          margin-bottom: 1rem;
        }
        .op-empty-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 400;
          color: #241123;
          margin: 0 0 0.6rem;
          letter-spacing: 0.01em;
        }
        .op-empty-body {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.95rem;
          color: rgba(36,17,35,0.6);
          margin: 0 0 1.6rem;
          line-height: 1.6;
        }
        .op-empty-btn {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 0.85rem 1.5rem;
          border-radius: 10px;
          background: #FFCC00;
          color: #241123;
          border: none;
          cursor: pointer;
          transition: transform 160ms ease, opacity 160ms ease;
        }
        .op-empty-btn:hover { transform: translateY(-2px); opacity: 0.92; }

        /* ────────────── PLX band — hero-style image overlay ────────────── */
        .op-plx-band {
          position: relative;
          padding: clamp(4rem, 9vw, 7rem) clamp(1.25rem, 5vw, 3rem);
          background: #0d0812;
          color: #fff;
          overflow: hidden;
          isolation: isolate;
        }
        .op-plx-bgimg {
          position: absolute; inset: 0; z-index: 0;
          opacity: 1;
        }
        /* A focused scrim — heavy on the bottom-left where copy lives, photo
           takes over on the right. Mirrors the hero pattern for consistency. */
        .op-plx-scrim {
          position: absolute; inset: 0; z-index: 1;
          background:
            linear-gradient(115deg,
              rgba(10,4,22,0.85) 0%,
              rgba(10,4,22,0.65) 30%,
              rgba(10,4,22,0.3) 60%,
              rgba(10,4,22,0.08) 100%),
            linear-gradient(to bottom,
              rgba(10,4,22,0.0) 0%,
              rgba(10,4,22,0.0) 35%,
              rgba(10,4,22,0.55) 100%),
            radial-gradient(ellipse 50% 60% at 78% 30%, rgba(255,204,0,0.16) 0%, transparent 70%);
          pointer-events: none;
        }
        .op-plx-inner {
          position: relative; z-index: 2;
          max-width: 1180px;
          margin: 0 auto;
        }
        .op-plx-headline { max-width: 760px; margin-bottom: 2.5rem; }
        .op-plx-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.6rem, 6vw, 4.6rem);
          font-weight: 400;
          line-height: 1;
          letter-spacing: 0.01em;
          margin: 0 0 1rem;
          color: #fff;
          text-shadow: 0 10px 36px rgba(0,0,0,0.9), 0 3px 12px rgba(0,0,0,0.8);
        }
        .op-plx-title-em {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.42em;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.78);
          vertical-align: middle;
          display: inline-block;
          margin-left: 0.4em;
          text-shadow: 0 2px 10px rgba(0,0,0,0.85);
        }
        .op-plx-sub {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 1.04rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.92);
          margin: 0;
          text-shadow: 0 3px 14px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7);
        }
        .op-plx-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 820px) { .op-plx-grid { grid-template-columns: 1fr; } }
        .op-plx-tile {
          background: rgba(15,8,28,0.55);
          border: 1.5px solid rgba(255,255,255,0.14);
          border-top: 4px solid var(--accent);
          border-radius: 18px;
          padding: 1.75rem 1.75rem 1.5rem;
          display: flex; flex-direction: column;
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          box-shadow: 0 18px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
          transition: transform 250ms ease, border-color 250ms ease, background 250ms ease;
        }
        .op-plx-tile:hover {
          transform: translateY(-4px);
          background: rgba(15,8,28,0.7);
          border-color: rgba(255,255,255,0.28);
        }
        .op-plx-tile-tag {
          align-self: flex-start;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.35rem 0.8rem;
          border-radius: 6px;
          background: var(--accent);
          color: #241123;
          margin-bottom: 1rem;
        }
        .op-plx-tile-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(1.5rem, 2.6vw, 2rem);
          font-weight: 400;
          line-height: 1.05;
          margin: 0 0 0.85rem;
          color: #fff;
        }
        .op-plx-tile-desc {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.78);
          margin: 0 0 1.5rem;
        }
        .op-plx-tile-meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin: 0 0 1.5rem;
          padding: 0;
        }
        @media (max-width: 480px) { .op-plx-tile-meta { grid-template-columns: 1fr; } }
        .op-plx-tile-meta div { display: flex; flex-direction: column; gap: 0.15rem; }
        .op-plx-tile-meta dt {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
        }
        .op-plx-tile-meta dd {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }
        .op-plx-tile-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .op-plx-tile-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 0.85rem 1.3rem;
          border-radius: 10px;
          text-decoration: none;
          transition: transform 160ms ease, opacity 160ms ease, background 160ms ease;
        }
        .op-plx-tile-cta--primary { background: var(--accent); color: #241123; }
        .op-plx-tile-cta--primary:hover { transform: translateY(-2px); opacity: 0.94; }
        .op-plx-tile-cta--ghost { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.35); }
        .op-plx-tile-cta--ghost:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }

        .op-plx-learnmore {
          display: inline-block;
          margin-top: 2rem;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
          border-bottom: 1.5px solid rgba(255,204,0,0.6);
          padding-bottom: 0.15rem;
          text-decoration: none;
          transition: color 160ms ease, border-color 160ms ease;
        }
        .op-plx-learnmore:hover { color: #FFCC00; border-color: #FFCC00; }

        /* ────────────── Footer CTA ────────────── */
        .op-footercta {
          background: #6C00AF;
          background-image: radial-gradient(ellipse at top right, rgba(255,204,0,0.18) 0%, transparent 60%);
          padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 3rem);
          color: #fff;
        }
        .op-footercta-inner {
          max-width: 760px;
          margin: 0 auto;
          text-align: center;
        }
        .op-footercta-eyebrow {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #FFCC00;
          display: block;
          margin-bottom: 1rem;
        }
        .op-footercta-title {
          font-family: var(--font-anton), sans-serif;
          font-size: clamp(2.4rem, 5vw, 4rem);
          font-weight: 400;
          line-height: 1.02;
          margin: 0 0 1.2rem;
          color: #fff;
        }
        .op-footercta-body {
          font-family: var(--font-space-grotesk), sans-serif;
          font-size: clamp(1rem, 1.8vw, 1.15rem);
          line-height: 1.7;
          color: rgba(255,255,255,0.85);
          margin: 0 0 2.25rem;
        }
        .op-footercta-btn {
          display: inline-block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          padding: 1.1rem 1.9rem;
          background: #FFCC00;
          color: #241123;
          border-radius: 12px;
          text-decoration: none;
          transition: transform 180ms ease, opacity 180ms ease;
        }
        .op-footercta-btn:hover { transform: translateY(-2px); opacity: 0.94; }
      `}</style>
    </main>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="op-filter-group">
      <span className="op-filter-group-label">{label}</span>
      <div className="op-filter-pills">{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
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

// `TYPE_META` is imported for parity with the data layer (and for future card
// variants that need the per-type eyebrow copy). Reference it once so the
// linter sees it as in-use.
void TYPE_META;
