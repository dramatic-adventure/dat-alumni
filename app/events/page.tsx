"use client";

// ─────────────────────────────────────────────────────────────────────────────
// /events-prototype — redesigned DAT events experience (CLICKABLE PROTOTYPE, rev 2)
// ─────────────────────────────────────────────────────────────────────────────
// Fully isolated from the live /events pages. Everything lives under
// app/events-prototype/ — no production component is imported or modified.
//
// Page structure (models /events on the three category pages):
//   • Category-switchable HERO — reuses the EXACT existing heroes (image, copy,
//     overlay) from /events, /events/{performances,festivals,fundraisers}.
//     Switching category swaps the hero; All / In person / Online keep the
//     main /events hero.
//   • Live filter bar + quiet LOCATION STRIP (the lightweight location element).
//   • Next Up / Featured module (featured:true wins, else soonest upcoming).
//   • Horizontal swipeable RAIL of tall overlay-treated posters.
//   • Compact text LIST for the long tail (no poster cards).
//   • Muted PAST / archive section with See more / See less.
//   • Restored above-footer modules: Oscar Wilde quote band, mailing-list
//     signup, footer links (NOT a new CTA band).
//
// Where the original used white, backgrounds are transparent so the global
// kraft-paper texture (body::before) shows through.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  upcomingEvents,
  pastEvents,
  shortMonth,
  eventYear,
  isElapsed,
  eventById,
  canonicalEventPath,
  categoryMeta,
  type DatEvent,
  type EventCategory,
} from "@/lib/events";
import EventPoster, { FeaturedModule, DateChip, DateChipStyles, CAT, PLUM, CREAM, isOnlineEvent, cityLabel } from "./EventPoster";

// Two independent facets the visitor can combine: a Format (where) and a Type
// (what). Each has its own "All", so e.g. "In Person" + "All" = every in-person
// event regardless of type. A country dropdown is the third, separate facet.
type CountKey = "all" | "in-person" | "online" | EventCategory;
type FormatKey = "all" | "in-person" | "online";
type CategoryKey = "all" | EventCategory;

const FORMAT_FILTERS: { key: FormatKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in-person", label: "In Person" },
  { key: "online", label: "Online" },
];

const CATEGORY_FILTERS: { key: CategoryKey; label: string; color?: string }[] = [
  { key: "all", label: "All" },
  { key: "performance", label: "Performances", color: CAT.performance.color },
  { key: "festival", label: "Festivals", color: CAT.festival.color },
  { key: "fundraiser", label: "Community", color: CAT.fundraiser.color },
];

function matchesFormat(e: DatEvent, f: FormatKey): boolean {
  if (f === "all") return true;
  return f === "online" ? isOnlineEvent(e) : !isOnlineEvent(e);
}
function matchesCategory(e: DatEvent, c: CategoryKey): boolean {
  return c === "all" || e.category === c;
}

/** Country an event belongs to (online events grouped under "Online"). */
function eventCountry(e: DatEvent): string {
  if (isOnlineEvent(e)) return "Online";
  return e.country || e.city || "Other";
}

/** Preferred display name for a country (e.g. "Czech Republic" → "Czechia"). */
function countryDisplay(c: string): string {
  if (c === "Czech Republic") return "Czechia";
  return c;
}

/** Country phrase for the "Next Up in …" heading (adds "the" where it reads right). */
function nextUpCountry(c: string): string {
  const name = countryDisplay(c);
  const needsThe = new Set(["USA", "UK", "Netherlands", "UAE", "Philippines"]);
  return needsThe.has(name) ? `the ${name}` : name;
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO — exact reproductions of the live heroes, switched by active category.
// ─────────────────────────────────────────────────────────────────────────────

type HeroConfig = {
  image: string; pos: string; overlay: string; glow: string; grid?: boolean;
  breadcrumb?: string; eyebrow: string; eyebrowColor: string;
  headline: string[]; sub: string; extra: "cats" | "perfnote" | "feststrip" | "fundpills";
};

const HEROES: Record<"all" | EventCategory, HeroConfig> = {
  all: {
    image: "/images/performing-zanzibar.jpg", pos: "center 30%",
    overlay: "linear-gradient(to right, rgba(8,3,12,0.62) 0%, rgba(8,3,12,0.3) 45%, rgba(8,3,12,0) 100%)",
    glow: "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(242,51,89,0.06) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 20% 80%, rgba(36,147,169,0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 20%, rgba(217,169,25,0.04) 0%, transparent 60%)",
    grid: true,
    eyebrow: "Events", eyebrowColor: "rgba(255,255,255,0.92)",
    headline: ["THE STAGE", "IS EVERYWHERE."],
    sub: "Performances, festivals, and community nights — live and in the room with you. Find DAT near you, or join us from wherever you are.",
    extra: "cats",
  },
  performance: {
    image: "/images/performing-zanzibar.jpg", pos: "center 40%",
    overlay: "linear-gradient(to top, rgba(13,8,18,0.72) 0%, rgba(13,8,18,0.5) 22%, rgba(8,3,12,0.28) 48%, rgba(8,3,12,0.05) 75%, transparent 100%)",
    glow: "radial-gradient(ellipse 60% 50% at 20% 80%, rgba(242,51,89,0.18) 0%, transparent 60%)",
    breadcrumb: "Performances",
    eyebrow: "Upcoming Performances", eyebrowColor: "#F23359",
    headline: ["LIVE.", "IN THE ROOM.", "WITH YOU."],
    sub: "Original theatre created in communities across the world — now coming to a stage near you. These are stories that travelled a long way to reach you.",
    extra: "perfnote",
  },
  festival: {
    image: "/images/Andean_Mask_Work.jpg", pos: "center 35%",
    overlay: "linear-gradient(to top, rgba(5,20,26,0.72) 0%, rgba(5,20,26,0.5) 22%, rgba(5,15,20,0.28) 48%, rgba(5,15,20,0.05) 75%, transparent 100%)",
    glow: "radial-gradient(ellipse 70% 55% at 10% 85%, rgba(36,147,169,0.2) 0%, transparent 60%)",
    breadcrumb: "Festivals",
    eyebrow: "Festivals & Showcases", eyebrowColor: "#2493A9",
    headline: ["WHERE", "THEATRE", "MEETS", "THE WORLD."],
    sub: "DAT performs and participates in festivals across the globe — from Edinburgh to Bogotá, from Reykjavík to regional stages you've never heard of yet.",
    extra: "feststrip",
  },
  fundraiser: {
    image: "/images/teaching-amazon.jpg", pos: "center 30%",
    overlay: "linear-gradient(to top, rgba(20,12,4,0.72) 0%, rgba(20,12,4,0.5) 22%, rgba(20,12,4,0.28) 48%, rgba(20,12,4,0.05) 75%, transparent 100%)",
    glow: "radial-gradient(ellipse 65% 55% at 15% 85%, rgba(217,169,25,0.18) 0%, transparent 65%)",
    breadcrumb: "Fundraisers",
    eyebrow: "Fundraisers & Community Nights", eyebrowColor: "#D9A919",
    headline: ["MAKE IT", "POSSIBLE."],
    sub: "Every gala, every community screening, every late-night conversation — these are the events that keep DAT in the field. Come for the night. Stay for the mission.",
    extra: "fundpills",
  },
};

// Deep background colours = the dark colour each hero's overlay fades to at its
// bottom, so the listing surface flows out of the hero with no seam.
const HERO_DEEP: Record<"all" | EventCategory, string> = {
  all: "#08030c",
  performance: "#0d0812",
  festival: "#05141a",
  fundraiser: "#140c04",
};

function HeroBanner({
  activeKey,
  counts,
  festivals,
  setFilter,
  advOpen,
  onToggleAdv,
}: {
  activeKey: "all" | EventCategory;
  counts: Record<CountKey, number>;
  festivals: DatEvent[];
  setFilter: (f: CategoryKey) => void;
  advOpen: boolean;
  onToggleAdv: () => void;
}) {
  const h = HEROES[activeKey];
  return (
    <header
      className="eh-hero"
      style={{ backgroundImage: `url('${h.image}')`, backgroundPosition: h.pos }}
    >
      <div className="eh-hero-overlay" style={{ background: h.overlay }} />
      <div className="eh-hero-glow" style={{ background: h.glow }} />
      <div className="eh-hero-scrim" aria-hidden="true" />
      {h.grid && <div className="eh-hero-grid" aria-hidden="true" />}
      <div
        className="eh-hero-fade"
        aria-hidden="true"
        style={{ background: `linear-gradient(to bottom, transparent 0%, ${HERO_DEEP[activeKey]} 100%)` }}
      />
      <div className="eh-hero-content">
        {h.breadcrumb ? (
          <nav className="eh-breadcrumb">
            <button onClick={() => setFilter("all")}>Events</button>
            <span>/</span>
            <span>{h.breadcrumb}</span>
          </nav>
        ) : (
          <p className="eh-hero-eyebrow" style={{ color: h.eyebrowColor }}>{h.eyebrow}</p>
        )}
        {h.breadcrumb && (
          <p className="eh-hero-eyebrow" style={{ color: h.eyebrowColor }}>{h.eyebrow}</p>
        )}
        <h1 className="eh-hero-headline">
          {h.headline.map((line, i) => (
            <span key={i}>{line}{i < h.headline.length - 1 && <br />}</span>
          ))}
        </h1>
        <p className="eh-hero-sub">{h.sub}</p>

        {h.extra === "cats" && (
          <div className="eh-hero-cats">
            <button className="eh-hero-cat eh-cat-pink" onClick={() => setFilter("performance")}>
              <span className="eh-hero-cat-count">{counts.performance}</span> Performances
            </button>
            <button className="eh-hero-cat eh-cat-teal" onClick={() => setFilter("festival")}>
              <span className="eh-hero-cat-count">{counts.festival}</span> Festivals
            </button>
            <button className="eh-hero-cat eh-cat-gold" onClick={() => setFilter("fundraiser")}>
              <span className="eh-hero-cat-count">{counts.fundraiser}</span> Community Nights
            </button>
          </div>
        )}
        {h.extra === "perfnote" && (
          <p className="eh-hero-note" style={{ color: h.eyebrowColor }}>
            Come for the story. Stay for the world it opens. ↓
          </p>
        )}
        {h.extra === "feststrip" && (
          <div className="eh-hero-strip">
            {festivals.slice(0, 3).map((ev) => (
              <div key={ev.id} className="eh-strip-item">
                <span className="eh-strip-city">{ev.city}</span>
                <span className="eh-strip-date">{shortMonth(ev.date)} {eventYear(ev.date)}</span>
              </div>
            ))}
          </div>
        )}
        {h.extra === "fundpills" && (
          <div className="eh-hero-pills">
            <span className="eh-pill">🎟️ Live Events</span>
            <span className="eh-pill">🌐 Online Streams</span>
            <span className="eh-pill">🤲 Pay What You Can</span>
          </div>
        )}

        <button className="eh-hero-advtoggle" onClick={onToggleAdv} aria-expanded={advOpen}>
          <span className="eh-hero-advtoggle-icon" aria-hidden="true">⌗</span>
          {advOpen ? "Hide filters" : "Advanced filters"}
          <span className="eh-hero-advtoggle-caret" aria-hidden="true">{advOpen ? "▴" : "▾"}</span>
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact list row (long tail) — no poster, just essentials.
// ─────────────────────────────────────────────────────────────────────────────

function ListRow({ event, onOpen }: { event: DatEvent; onOpen: (id: string) => void }) {
  const cat = CAT[event.category];
  return (
    <button className="eh-row" onClick={() => onOpen(event.id)}>
      <span className="eh-row-date"><DateChip event={event} size="sm" /></span>
      <span className="eh-row-main">
        <span className="eh-row-cat" style={{ color: cat.color }}>{cat.label}</span>
        <span className="eh-row-title">{event.title}</span>
      </span>
      <span className="eh-row-meta">{cityLabel(event)}</span>
      <span className="eh-row-arrow" aria-hidden="true">→</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mailing list form (restored from /events).
// ─────────────────────────────────────────────────────────────────────────────

function MailingListForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/mailing-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source: "events-prototype", website: honey }),
      });
      if (!res.ok) throw new Error("submit-failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="eh-ml-success">
        <span className="eh-ml-check">✓</span>
        <div>
          <p className="eh-ml-success-title">You&apos;re on the list.</p>
          <p className="eh-ml-success-sub">We&apos;ll be in touch when something exciting is happening.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="eh-ml-form" onSubmit={handleSubmit} noValidate>
      <input aria-hidden="true" tabIndex={-1} name="website" value={honey}
        onChange={(e) => setHoney(e.target.value)} style={{ display: "none" }} autoComplete="off" />
      <div className="eh-ml-inputs">
        <input type="text" placeholder="Your name (optional)" value={name}
          onChange={(e) => setName(e.target.value)} className="eh-ml-input" autoComplete="name" />
        <input type="email" required placeholder="your@email.com" value={email}
          onChange={(e) => setEmail(e.target.value)} className="eh-ml-input eh-ml-input--email" autoComplete="email" />
      </div>
      <button type="submit" className="eh-ml-btn" disabled={status === "loading"}>
        {status === "loading" ? "Signing up…" : "Join the List →"}
      </button>
      {status === "error" && (
        <p className="eh-ml-error">
          Something went wrong — email us at{" "}
          <a href="mailto:hello@dramaticadventure.com">hello@dramaticadventure.com</a>
        </p>
      )}
      <p className="eh-ml-fine">No spam, ever. Unsubscribe any time by replying to any email.</p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category context band — the "rich category page" content, reproduced verbatim
// from the live /events/{category} pages. Shown only when a category is selected,
// so picking a category turns the hub into a fuller, category-flavoured page.
// ─────────────────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, a: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

type CtxItem = { icon: string; title: string; body: string };
const CATEGORY_CONTEXT: Record<EventCategory, {
  eyebrow: string; title: string[]; body?: string[];
  items?: CtxItem[]; stats?: { num: string; label: string }[];
}> = {
  performance: {
    eyebrow: "What to Expect",
    title: ["Theatre Made in the World"],
    items: [
      { icon: "🌍", title: "Born in community", body: "Every DAT production is devised on location — in the places and with the people whose stories it tells. You're seeing something built across continents." },
      { icon: "🎵", title: "Live music & physical theatre", body: "No passive watching. DAT performances are immersive, musical, and physical — built from the ground up by ensemble artists." },
      { icon: "💬", title: "Post-show conversations", body: "Most performances include a post-show Q&A or community conversation. The performance is just the beginning." },
    ],
  },
  festival: {
    eyebrow: "DAT & The Festival Circuit",
    title: ["The Whole World", "Is a Stage"],
    body: [
      "Festivals are where theatre communities find each other. For DAT, the festival circuit is how we take work made in rural Ecuador or coastal Tanzania to audiences in Edinburgh, New York, and beyond — and how we stay connected to the global conversation about what theatre can do.",
      "We also perform in cities, communities, and venues that don't have a festival attached. Anywhere there's an audience ready to lean forward.",
    ],
    stats: [{ num: "16+", label: "International festivals" }, { num: "24+", label: "Countries performed in" }],
  },
  fundraiser: {
    eyebrow: "Why It Matters",
    title: ["Your Night Out", "Funds the Work"],
    body: [
      "DAT fundraisers are not galas for galas' sake. They're how we tell the story of what we do — and how we raise the resources to keep doing it.",
      "Every ticket, every donation, every table bought at the gala directly funds artist stipends, drama club materials, travel costs, and community residencies in places where cultural programming is scarce.",
    ],
    items: [
      { icon: "🎭", title: "Funds artist stipends", body: "Every dollar raised supports the artists who make the field work possible." },
      { icon: "📚", title: "Sustains drama clubs", body: "Materials, space, and facilitation for clubs in under-resourced communities." },
      { icon: "✈️", title: "Enables field seasons", body: "Production, travel, and logistics for DAT's next international season." },
    ],
  },
};

function CategoryContext({ category }: { category: EventCategory }) {
  const c = CATEGORY_CONTEXT[category];
  const accent = CAT[category].color;
  return (
    <section
      className="eh-ctx"
      style={{ background: `linear-gradient(${hexToRgba(accent, 0.13)}, ${hexToRgba(accent, 0.13)}), rgba(10,6,14,0.72)` }}
    >
      <div className="eh-ctx-inner">
        <div className="eh-ctx-headbox" style={{ borderColor: accent }}>
          <p className="eh-ctx-eyebrow" style={{ color: accent }}>{c.eyebrow}</p>
          <h2 className="eh-ctx-title">
            {c.title.map((l, i) => <span key={i}>{l}{i < c.title.length - 1 && <br />}</span>)}
          </h2>
        </div>
        {c.body && (
          <div className="eh-ctx-body">
            {c.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}
        {c.stats && (
          <div className="eh-ctx-stats">
            {c.stats.map((s, i) => (
              <div key={i} className="eh-ctx-stat">
                <span className="eh-ctx-statnum" style={{ color: accent }}>{s.num}</span>
                <span className="eh-ctx-statlabel">{s.label}</span>
              </div>
            ))}
          </div>
        )}
        {c.items && (
          <div className="eh-ctx-items">
            {c.items.map((it, i) => (
              <div key={i} className="eh-ctx-item">
                <span className="eh-ctx-itemicon" aria-hidden="true">{it.icon}</span>
                <h3>{it.title}</h3>
                <p>{it.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hub page
// ─────────────────────────────────────────────────────────────────────────────

export default function EventsPrototypePage() {
  const router = useRouter();
  const [format, setFormat] = useState<FormatKey>(() => {
    if (typeof window === "undefined") return "all";
    const v = new URLSearchParams(window.location.search).get("format");
    return (v === "in-person" || v === "online") ? v : "all";
  });
  const [category, setCategory] = useState<CategoryKey>(() => {
    if (typeof window === "undefined") return "all";
    const v = new URLSearchParams(window.location.search).get("cat");
    return (v === "performance" || v === "festival" || v === "fundraiser") ? v : "all";
  });
  const [location, setLocation] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("loc") ?? null;
  });

  // Keep URL in sync with filter state so every combination is shareable/bookmarkable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("cat", category);
    if (format !== "all") params.set("format", format);
    if (location) params.set("loc", location);
    const search = params.toString();
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    history.replaceState(null, "", url);
  }, [format, category, location]);
  const [advOpen, setAdvOpen] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  const events = useMemo(
    () =>
      upcomingEvents
        .filter((e) => !isElapsed(e))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    []
  );

  // Represented countries (quiet location element). Online is handled by the
  // Online chip, so it is intentionally excluded here to avoid a duplicate control.
  const locations = useMemo(() => {
    const seen = new Set<string>();
    for (const e of events) {
      const c = eventCountry(e);
      if (c !== "Online") seen.add(c);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const matchesLocation = (e: DatEvent) => {
    if (!location) return true;
    return eventCountry(e) === location;
  };

  const visible = useMemo(
    () => events.filter((e) => matchesFormat(e, format) && matchesCategory(e, category) && matchesLocation(e)),
    [events, format, category, location]
  );

  const counts = useMemo(() => {
    const c: Record<CountKey, number> = {
      all: events.length, "in-person": 0, online: 0, performance: 0, festival: 0, fundraiser: 0,
    };
    for (const e of events) {
      if (isOnlineEvent(e)) c.online++; else c["in-person"]++;
      c[e.category]++;
    }
    return c;
  }, [events]);

  // Past / archive — most recent first; explicit + derived. Quiet section.
  const past = useMemo(
    () => [...pastEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    []
  );

  const open = (id: string) => {
    const event = eventById(id);
    if (event) router.push(canonicalEventPath(event));
  };

  // Next Up / Featured: featured:true wins, else soonest upcoming (within filter).
  const featured = visible.find((e) => e.featured) ?? visible[0];

  // Heading for the featured block, phrased naturally for the active narrowing.
  const featuredTitle = (() => {
    const base =
      format === "online" ? "Next Up Online" : format === "in-person" ? "Next Up In-Person" : "Next Up";
    if (location) return `${base} in ${nextUpCountry(location)}`;
    return base === "Next Up" && featured?.featured ? "Featured" : base;
  })();
  const remaining = visible.filter((e) => e.id !== featured?.id);
  const railItems = remaining.slice(0, 6);
  const listItems = remaining.slice(6);

  const activeHeroKey: "all" | EventCategory = category === "all" ? "all" : category;

  // Active-filter tags (so it's always clear what narrowing is applied + clearable).
  const activeTags: { label: string; clear: () => void }[] = [];
  if (format !== "all") {
    const f = FORMAT_FILTERS.find((x) => x.key === format);
    activeTags.push({ label: f?.label ?? String(format), clear: () => setFormat("all") });
  }
  if (category !== "all") {
    const c = CATEGORY_FILTERS.find((x) => x.key === category);
    activeTags.push({ label: c?.label ?? String(category), clear: () => setCategory("all") });
  }
  if (location) {
    activeTags.push({ label: countryDisplay(location), clear: () => setLocation(null) });
  }
  const clearAll = () => { setFormat("all"); setCategory("all"); setLocation(null); };

  const scrollRail = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  // Dark listing surface: full opacity at the top fading to 40% by the bottom
  // (the page sits on a constant dark base, so this stays dark throughout).
  const surfaceBg = `linear-gradient(to bottom, ${HERO_DEEP[activeHeroKey]} 0%, ${hexToRgba(HERO_DEEP[activeHeroKey], 0.4)} 100%)`;

  return (
    <div className="eh">
      <DateChipStyles />
      <HeroBanner
        activeKey={activeHeroKey}
        counts={counts}
        festivals={events.filter((e) => e.category === "festival")}
        setFilter={(c) => { setCategory(c); setLocation(null); setAdvOpen(true); }}
        advOpen={advOpen}
        onToggleAdv={() => setAdvOpen((o) => !o)}
      />

      {/* Surface: top half = hero's deep overlay colour, bottom half fades to
          transparent so the kraft paper shows through under the listing. */}
      <div className="eh-surface" style={{ background: surfaceBg }}>

      {/* ── Advanced filter panel (opened from the hero) ───────────────────── */}
      {advOpen && (
        <div className="eh-nav">
          <div className="eh-nav-inner">
            <div className="eh-filterbar">
              <div className="eh-filtergroup" role="group" aria-label="Format">
                <span className="eh-filtergroup-label">Format</span>
                {FORMAT_FILTERS.map((f) => {
                  const active = format === f.key;
                  return (
                    <button
                      key={f.key}
                      className={`eh-chip ${active ? "is-active" : ""}`}
                      style={active ? { background: CREAM, borderColor: CREAM, color: PLUM } : undefined}
                      onClick={() => setFormat(f.key)}
                      aria-pressed={active}
                    >
                      {f.label}<span className="eh-chip-count">{counts[f.key]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="eh-filtergroup" role="group" aria-label="Type">
                <span className="eh-filtergroup-label">Type</span>
                {CATEGORY_FILTERS.map((f) => {
                  const active = category === f.key;
                  return (
                    <button
                      key={f.key}
                      className={`eh-chip ${active ? "is-active" : ""}`}
                      style={active ? { background: f.color ?? CREAM, borderColor: f.color ?? CREAM, color: !f.color ? PLUM : f.key === "fundraiser" ? PLUM : "#fff" }
                        : f.color ? { ["--chip-color" as string]: f.color } : undefined}
                      onClick={() => setCategory(f.key)}
                      aria-pressed={active}
                    >
                      {f.label}<span className="eh-chip-count">{counts[f.key]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="eh-filtergroup" role="group" aria-label="Country">
                <span className="eh-filtergroup-label">Country</span>
                <label className="eh-locselect" data-active={location ? "1" : "0"}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  <span className="eh-locselect-value">
                    {location ? countryDisplay(location) : "All countries"}
                  </span>
                  <span className="eh-locselect-caret" aria-hidden="true">▾</span>
                  <select
                    className="eh-locselect-native"
                    aria-label="Filter by country"
                    value={location ?? ""}
                    onChange={(e) => setLocation(e.target.value || null)}
                  >
                    <option value="">All countries</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{countryDisplay(loc)}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTags.length > 0 && (
        <div className="eh-activefilters">
          <div className="eh-af-inner">
            <span className="eh-af-label">Showing</span>
            {activeTags.map((t, i) => (
              <button key={i} className="eh-af-tag" onClick={t.clear} aria-label={`Remove filter: ${t.label}`}>
                {t.label}<span className="eh-af-x" aria-hidden="true">✕</span>
              </button>
            ))}
            <span className="eh-af-count">{visible.length} {visible.length === 1 ? "event" : "events"}</span>
            {activeTags.length > 1 && (
              <button className="eh-af-clear" onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      <main className="eh-main">
        {visible.length === 0 ? (
          <p className="eh-empty">No events match this filter yet.</p>
        ) : (
          <>
            {/* ── Next Up / Featured ─────────────────────────────────────── */}
            {featured && (
              <section className="eh-section">
                <div className="eh-section-head">
                  <h2 className="eh-section-title">{featuredTitle}</h2>
                </div>
                <FeaturedModule event={featured} onOpen={open} isFeaturedPick={!!featured.featured} />
              </section>
            )}

            {/* ── Rail ───────────────────────────────────────────────────── */}
            {railItems.length > 0 && (
              <section className="eh-section eh-section--rail">
                <div className="eh-section-head">
                  <h2 className="eh-section-title">Coming Up</h2>
                  <div className="eh-rail-nav">
                    <button onClick={() => scrollRail(-1)} aria-label="Scroll left">←</button>
                    <button onClick={() => scrollRail(1)} aria-label="Scroll right">→</button>
                  </div>
                </div>
                <div className="eh-rail" ref={railRef}>
                  {railItems.map((e) => (
                    <EventPoster key={e.id} event={e} variant="rail" onOpen={open} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Long-tail list ─────────────────────────────────────────── */}
            {listItems.length > 0 && (
              <section className="eh-section eh-section--panel">
                <div className="eh-section-head">
                  <h2 className="eh-section-title">More Events</h2>
                </div>
                <div className="eh-list">
                  {listItems.map((e) => (
                    <ListRow key={e.id} event={e} onOpen={open} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Past / archive (revealed on demand; sits right under More Events) ── */}
        {past.length > 0 && (
          !pastOpen ? (
            <div className="eh-pastreveal-row">
              <button className="eh-pastreveal" onClick={() => setPastOpen(true)}>
                Past &amp; Archive <span aria-hidden="true">↓</span>
              </button>
            </div>
          ) : (
            <section className="eh-section eh-section--panel eh-past">
              <div className="eh-section-head">
                <h2 className="eh-section-title eh-past-title">Past &amp; Archive</h2>
                <button
                  className="eh-past-close"
                  onClick={() => { setPastOpen(false); setShowAllPast(false); }}
                  aria-label="Hide past events"
                >
                  ✕
                </button>
              </div>
              <div className="eh-past-list">
                {(showAllPast ? past.slice(0, 20) : past.slice(0, 4)).map((e) => (
                  <a key={e.id} href={canonicalEventPath(e)} className="eh-past-row">
                    <span className="eh-past-year">{eventYear(e.date)}</span>
                    <span className="eh-past-main">
                      <span className="eh-past-name">{e.title}</span>
                      <span className="eh-past-loc">{e.city}{e.country ? `, ${e.country}` : ""}</span>
                    </span>
                    <span className="eh-past-arrow" aria-hidden="true">→</span>
                  </a>
                ))}
              </div>
              {past.length > 4 && (
                <button className="eh-past-toggle" onClick={() => setShowAllPast((s) => !s)}>
                  {showAllPast ? "See less" : "See more"}
                </button>
              )}
            </section>
          )
        )}

        {/* ── Rich category content (hub → category page) ───────────────── */}
        {category !== "all" && (
          <CategoryContext category={category} />
        )}
      </main>
      </div>{/* /eh-surface */}

      {/* ── Oscar Wilde quote band (restored) ──────────────────────────────── */}
      <section className="eh-quote-band">
        <div className="eh-quote-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/dat-logo7.svg" alt="Dramatic Adventure Theatre" />
        </div>
        <div className="eh-quote-wrap">
          <div className="eh-quote-photo" aria-hidden="true" />
          <div className="eh-quote-overlay" />
          <div className="eh-quote-content">
            <blockquote className="eh-quote">
              <p className="eh-quote-text">
                &ldquo;I regard the theatre as the greatest of all art forms, the most immediate
                way in which a human being can share with another the sense of what it is
                to be a human being.&rdquo;
              </p>
              <footer className="eh-quote-attr">— Oscar Wilde</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── Mailing-list signup (restored) ─────────────────────────────────── */}
      <section className="eh-bottom-band">
        <div className="eh-container">
          <p className="eh-bottom-eyebrow">Stay in the Loop</p>
          <h2 className="eh-bottom-title">Never miss a curtain.</h2>
          <p className="eh-bottom-body">
            Events are announced first to our community list. Be the first to know
            when new shows, festivals, and community nights are announced.
          </p>
          <MailingListForm />
          <div className="eh-bottom-links">
            <a href="/donate" className="eh-bottom-link">Support the Work</a>
            <a href="/theatre" className="eh-bottom-link">Theatre Archive →</a>
          </div>
        </div>
      </section>

      <Styles />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

function Styles() {
  return (
    <style>{`
      .eh { background: transparent; min-height: 100vh; }  /* kraft shows where the surface fades to 40% */
      .eh-container { max-width: 1140px; margin: 0 auto; padding: 0 clamp(1.25rem, 5vw, 3rem); }

      /* ── Hero ───────────────────────────────────────────────────────────── */
      .eh-hero {
        position: relative; min-height: 72vh; background-color: #0d0812;
        background-size: cover; display: flex; align-items: flex-end; overflow: hidden;
      }
      .eh-hero-overlay, .eh-hero-glow, .eh-hero-grid { position: absolute; inset: 0; z-index: 1; }
      /* Bottom-anchored scrim: keeps the headline + sub legible while the rest of
         the image stays bright and prominent. */
      .eh-hero-scrim {
        position: absolute; left: 0; right: 0; bottom: 0; height: 100%; z-index: 2; pointer-events: none;
        background:
          /* organic dark core in the bottom-left corner, fading outward */
          radial-gradient(108% 112% at 0% 100%, rgba(4,1,7,0.9) 0%, rgba(4,1,7,0.64) 30%, rgba(4,1,7,0.36) 52%, rgba(4,1,7,0.14) 74%, transparent 90%),
          /* soft vertical band shading the left column where the text lives */
          linear-gradient(to right, rgba(4,1,7,0.52) 0%, rgba(4,1,7,0.27) 34%, rgba(4,1,7,0.1) 56%, transparent 72%),
          /* faint bottom wash so the right side keeps a touch of grounding */
          linear-gradient(to top, rgba(5,2,8,0.3) 0%, rgba(5,2,8,0.08) 28%, transparent 48%);
      }
      .eh-hero-grid {
        background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
        background-size: 80px 80px; pointer-events: none;
      }
      /* Seam: fade the hero base into the matching deep section colour. */
      .eh-hero-fade { position: absolute; left: 0; right: 0; bottom: 0; height: 20%; z-index: 2; pointer-events: none; }
      .eh-hero-content {
        position: relative; z-index: 3; max-width: 820px;
        padding: clamp(5rem, 11vw, 8rem) clamp(1.5rem, 6vw, 5rem) clamp(3.5rem, 7vw, 6rem) clamp(1.25rem, 5vw, 3rem);
      }
      /* ── Hero text alignment ────────────────────────────────────────────────
         Catch-all: every direct child of the hero content box shares the same
         left edge — the padding-box left of .eh-hero-content. Nothing moves it.
      ─────────────────────────────────────────────────────────────────────── */
      .eh-hero-content > * { margin-left: 0; padding-left: 0; }
      .eh-breadcrumb {
        display: flex; align-items: center; gap: 0.5rem;
        margin: 0 0 1rem 0; padding-left: 0;
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.74rem; font-weight: 600;
        letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.78);
        text-shadow: 0 1px 12px rgba(0,0,0,0.75);
      }
      .eh-breadcrumb button { background: none; border: none; padding: 0; margin: 0; color: rgba(255,255,255,0.78); cursor: pointer; font: inherit; letter-spacing: inherit; text-transform: inherit; }
      .eh-breadcrumb button:hover { color: #fff; }
      .eh-hero-eyebrow {
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.74rem; font-weight: 700;
        letter-spacing: 0.28em; text-transform: uppercase;
        margin: 0 0 1rem 0; padding-left: 0;
        text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 2px 14px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.7);
      }
      /* Advanced-filters toggle, sitting under the hero category buttons. */
      .eh-hero-advtoggle {
        display: inline-flex; align-items: center; gap: 0.45rem; margin-top: 1.4rem; cursor: pointer;
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.68rem; font-weight: 700;
        letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.72);
        background: rgba(8,3,12,0.4); border: 1px solid rgba(255,255,255,0.18);
        padding: 0.5rem 1rem; border-radius: 50px; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
        transition: color 0.18s, border-color 0.18s, background 0.18s;
      }
      .eh-hero-advtoggle:hover { color: #fff; border-color: rgba(255,255,255,0.4); background: rgba(8,3,12,0.55); }
      .eh-hero-advtoggle-icon { font-size: 0.85rem; opacity: 0.85; }
      .eh-hero-advtoggle-caret { font-size: 0.58rem; }
      .eh-hero-headline {
        font-family: var(--font-anton), sans-serif; font-size: clamp(3rem, 8.5vw, 7.5rem);
        font-weight: 400; line-height: 0.9; color: #fff;
        margin: 0 0 1.4rem -0.03em; padding-left: 0; letter-spacing: 0.01em;
        text-shadow: 0 2px 24px rgba(0,0,0,0.5);
      }
      .eh-hero-sub {
        font-family: var(--font-space-grotesk), sans-serif; font-size: clamp(1rem, 2vw, 1.18rem);
        color: rgba(255,255,255,0.68); line-height: 1.65; max-width: 540px;
        margin: 0 0 2rem 0; padding-left: 0;
      }
      .eh-hero-cat {
        display: inline-flex; align-items: center; gap: 0.6rem; cursor: pointer;
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem; font-weight: 700;
        letter-spacing: 0.1em; text-transform: uppercase; padding: 0.6rem 1.25rem; border-radius: 50px;
        transition: transform 0.2s, opacity 0.2s;
      }
      .eh-hero-cat:hover { transform: translateY(-2px); opacity: 0.88; }
      .eh-hero-cat-count { font-family: var(--font-anton), sans-serif; font-size: 1.1rem; font-weight: 400; }
      .eh-cat-pink { background: rgba(242,51,89,0.15); color: #F23359; border: 1px solid rgba(242,51,89,0.35); }
      .eh-cat-teal { background: rgba(36,147,169,0.15); color: #2493A9; border: 1px solid rgba(36,147,169,0.35); }
      .eh-cat-gold { background: rgba(217,169,25,0.15); color: #D9A919; border: 1px solid rgba(217,169,25,0.35); }
      .eh-hero-note { font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 0 0; padding-left: 0; }
      .eh-hero-cats { display: flex; flex-wrap: wrap; gap: 0.75rem; padding-left: 0; margin-left: 0; }
      .eh-hero-strip { display: flex; flex-wrap: wrap; gap: 0 2rem; padding-left: 0; margin-left: 0; }
      .eh-hero-pills { display: flex; flex-wrap: wrap; gap: 0.6rem; padding-left: 0; margin-left: 0; }
      .eh-strip-item { display: flex; flex-direction: column; padding: 0.5rem 0; border-top: 1px solid rgba(36,147,169,0.4); min-width: 90px; }
      .eh-strip-city { font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem; font-weight: 700; color: rgba(255,255,255,0.78); letter-spacing: 0.06em; }
      .eh-strip-date { font-family: var(--font-dm-sans), sans-serif; font-size: 0.68rem; font-weight: 600; color: rgba(36,147,169,0.85); letter-spacing: 0.12em; text-transform: uppercase; }
      .eh-pill { font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.06em; padding: 0.4rem 0.9rem; border-radius: 50px; border: 1px solid rgba(217,169,25,0.4); color: rgba(217,169,25,0.9); }

      /* ── Navigation cluster (not sticky) ────────────────────────────────── */
      .eh-nav { }
      .eh-nav-inner { max-width: 1140px; margin: 0 auto; padding: 0.9rem clamp(1.25rem, 5vw, 3rem); display: flex; flex-direction: column; align-items: flex-start; gap: 0.7rem; }
      /* Stacked segments: Format / Type / Country, each on its own row. */
      .eh-filterbar { display: flex; flex-direction: column; gap: 0.7rem; align-items: flex-start; }
      .eh-filtergroup { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
      .eh-filtergroup-label {
        flex: 0 0 auto; width: 4.75rem;
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.62rem; font-weight: 700;
        letter-spacing: 0.16em; text-transform: uppercase; color: rgba(247,244,239,0.4);
      }
      @media (max-width: 480px) { .eh-filtergroup-label { width: 100%; } }
      .eh-chip {
        display: inline-flex; align-items: center; gap: 0.45rem; cursor: pointer; white-space: nowrap;
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.74rem; font-weight: 700;
        letter-spacing: 0.1em; text-transform: uppercase; color: rgba(247,244,239,0.78);
        background: rgba(247,244,239,0.06); border: 1.5px solid rgba(247,244,239,0.2);
        padding: 0.45rem 0.95rem; border-radius: 50px;
        transition: color 0.18s, border-color 0.18s, background 0.18s, transform 0.15s;
      }
      .eh-chip:hover { transform: translateY(-1px); color: #fff; border-color: var(--chip-color, rgba(247,244,239,0.5)); }
      .eh-chip-count { font-family: var(--font-space-grotesk), sans-serif; font-size: 0.66rem; font-weight: 500; opacity: 0.7; }
      /* Single quiet location dropdown */
      .eh-locselect {
        display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; position: relative;
        color: rgba(247,244,239,0.78); padding: 0.4rem 0.7rem; border-radius: 50px;
        border: 1.5px solid rgba(247,244,239,0.22); background: rgba(247,244,239,0.06);
        transition: border-color 0.18s, color 0.18s;
      }
      .eh-locselect:hover { border-color: rgba(247,244,239,0.5); color: #fff; }
      .eh-locselect[data-active="1"] { border-color: ${CREAM}; color: ${CREAM}; }
      /* The native select covers the whole pill so a click anywhere opens it. */
      .eh-locselect-native {
        position: absolute; inset: 0; width: 100%; height: 100%;
        opacity: 0; cursor: pointer; border: none; margin: 0; padding: 0;
        font-size: 16px; /* avoids iOS zoom-on-focus */
      }
      .eh-locselect-native option { color: #241123; }
      .eh-locselect-value {
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.74rem; font-weight: 700;
        letter-spacing: 0.1em; text-transform: uppercase; color: inherit; white-space: nowrap;
      }
      .eh-locselect-caret { font-size: 0.7rem; color: inherit; pointer-events: none; }

      /* ── Active-filter summary (combinable filters made visible) ─────────── */
      .eh-activefilters { }
      .eh-af-inner {
        max-width: 1140px; margin: 0 auto; padding: 0.2rem clamp(1.25rem, 5vw, 3rem) 0;
        display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
      }
      .eh-af-label {
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.68rem; font-weight: 700;
        letter-spacing: 0.16em; text-transform: uppercase; color: rgba(247,244,239,0.45);
      }
      .eh-af-tag {
        display: inline-flex; align-items: center; gap: 0.45rem; cursor: pointer;
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.74rem; font-weight: 700;
        letter-spacing: 0.04em; color: ${PLUM}; background: ${CREAM}; border: 1.5px solid ${CREAM};
        padding: 0.35rem 0.4rem 0.35rem 0.85rem; border-radius: 50px; transition: opacity 0.15s;
      }
      .eh-af-tag:hover { opacity: 0.82; }
      .eh-af-x {
        display: inline-flex; align-items: center; justify-content: center;
        width: 1.05rem; height: 1.05rem; border-radius: 50%; background: rgba(36,17,35,0.12);
        font-size: 0.62rem; line-height: 1;
      }
      .eh-af-count {
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.74rem; font-weight: 600;
        color: rgba(247,244,239,0.6); letter-spacing: 0.02em;
      }
      .eh-af-clear {
        margin-left: 0.1rem; background: none; border: none; cursor: pointer;
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.1em; text-transform: uppercase; color: rgba(247,244,239,0.5);
        text-decoration: underline; text-underline-offset: 3px; transition: color 0.15s;
      }
      .eh-af-clear:hover { color: ${CREAM}; }

      /* ── Main / sections ────────────────────────────────────────────────── */
      /* Extra bottom padding so the centered Past button clears the quote logo,
         which overhangs upward into the bottom of this surface. */
      .eh-main { max-width: 1140px; margin: 0 auto; padding: clamp(2rem, 4vw, 3rem) clamp(1.25rem, 5vw, 3rem) clamp(6.5rem, 10vw, 9rem); }
      .eh-section { margin-bottom: clamp(2.5rem, 5vw, 4rem); }
      .eh-section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
      .eh-section-title { font-family: var(--font-anton), sans-serif; font-weight: 400; font-size: clamp(1.5rem, 3vw, 2.1rem); color: ${CREAM}; margin: 0; text-transform: uppercase; letter-spacing: 0.01em; }
      .eh-empty { font-family: var(--font-space-grotesk), sans-serif; font-size: 1.05rem; color: rgba(247,244,239,0.6); text-align: center; padding: 4rem 1rem; }
      /* Distinct container panels (More Events, Past archive). Solid-enough dark
         so light text stays legible where the surface gradient turns transparent
         (kraft showing through). */
      .eh-section--panel {
        background: rgba(10,6,14,0.72);
        border: 1px solid rgba(247,244,239,0.1);
        border-radius: 18px;
        padding: clamp(1.5rem, 3vw, 2.25rem);
      }

      /* ── Rail ───────────────────────────────────────────────────────────── */
      .eh-rail-nav { display: flex; gap: 0.4rem; }
      .eh-rail-nav button {
        width: 38px; height: 38px; border-radius: 50%; cursor: pointer;
        background: rgba(247,244,239,0.06); border: 1.5px solid rgba(247,244,239,0.22); color: ${CREAM};
        font-size: 1rem; transition: background 0.18s, border-color 0.18s;
      }
      .eh-rail-nav button:hover { background: rgba(247,244,239,0.12); border-color: rgba(247,244,239,0.45); }
      /* Full-bleed to both viewport edges; first card indented to line up with the
         section content (matches where the cards sat before). Generous vertical
         padding so the hover lift + category glow never clip. */
      .eh-rail {
        display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory;
        scrollbar-width: thin; -webkit-overflow-scrolling: touch;
        position: relative; left: 50%; width: 100vw; margin-left: -50vw;
        padding: 3.75rem clamp(4rem, 22vw, 14rem) 4rem calc(max((100vw - 1140px) / 2, 0px) + clamp(1.25rem, 5vw, 3rem));
        scroll-padding-left: calc(max((100vw - 1140px) / 2, 0px) + clamp(1.25rem, 5vw, 3rem));
      }
      /* Pull the rail's header/arrows down so the gap to the first card matches
         the other sections (compensates for the rail's tall top padding). */
      .eh-section--rail .eh-section-head { margin-bottom: -2.25rem; }
      .eh-rail::-webkit-scrollbar { height: 6px; }
      .eh-rail::-webkit-scrollbar-thumb { background: rgba(247,244,239,0.2); border-radius: 50px; }

      /* ── Long-tail list ─────────────────────────────────────────────────── */
      .eh-list { display: flex; flex-direction: column; border-top: 1px solid rgba(247,244,239,0.12); }
      .eh-row {
        display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 1rem;
        width: 100%; text-align: left; cursor: pointer; background: none;
        border: none; border-bottom: 1px solid rgba(247,244,239,0.1);
        padding: 0.95rem 0.5rem; transition: background 0.15s, padding-left 0.2s;
      }
      .eh-row:hover { background: rgba(247,244,239,0.05); padding-left: 0.9rem; }
      /* Fixed-width date column so every row's date occupies the same width
         (single days, double-digit days, and same-month ranges like "16–24"
         all line up, and the titles start at a consistent left edge). */
      .eh-row-date { display: flex; flex-direction: column; align-items: stretch; width: 6rem; flex: 0 0 6rem; }
      .eh-row-date .ep-datechip { width: 100%; justify-content: center; box-sizing: border-box; }
      .eh-row-day { font-family: var(--font-anton), sans-serif; font-size: 1.4rem; color: ${CREAM}; line-height: 1; }
      .eh-row-mon { font-family: var(--font-dm-sans), sans-serif; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em; color: rgba(247,244,239,0.5); }
      .eh-row-dot { width: 8px; height: 8px; border-radius: 50%; }
      .eh-row-main { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
      .eh-row-cat { font-family: var(--font-dm-sans), sans-serif; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
      .eh-row-title { font-family: var(--font-space-grotesk), sans-serif; font-size: 1rem; font-weight: 600; color: ${CREAM}; }
      .eh-row-meta { font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem; color: rgba(247,244,239,0.55); white-space: nowrap; }
      .eh-row-arrow { color: rgba(247,244,239,0.45); transition: transform 0.2s, color 0.2s; }
      .eh-row:hover .eh-row-arrow { color: ${CREAM}; transform: translateX(3px); }
      @media (max-width: 600px) { .eh-row { grid-template-columns: auto 1fr auto; } .eh-row-meta { display: none; } }

      /* ── Category context band (rich category page) ─────────────────────── */
      .eh-ctx { border-radius: 18px; border: 1px solid rgba(247,244,239,0.1); padding: clamp(2rem, 4vw, 3.25rem); margin-bottom: clamp(2.5rem, 5vw, 4rem); }
      .eh-ctx-inner { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
      .eh-ctx-headbox { border-left: 4px solid; padding: 0.3rem 0 0.3rem 1.1rem; }
      .eh-ctx-eyebrow { font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase; margin: 0 0 0.4rem; }
      .eh-ctx-title { font-family: var(--font-anton), sans-serif; font-weight: 400; font-size: clamp(1.9rem, 4vw, 3rem); line-height: 1; color: ${CREAM}; margin: 0; text-transform: uppercase; }
      .eh-ctx-body { display: flex; flex-direction: column; gap: 1rem; max-width: 70ch; }
      .eh-ctx-body p { font-family: var(--font-space-grotesk), sans-serif; font-size: 1rem; line-height: 1.75; color: rgba(247,244,239,0.8); margin: 0; }
      .eh-ctx-stats { display: flex; gap: 2.5rem; flex-wrap: wrap; }
      .eh-ctx-stat { display: flex; flex-direction: column; gap: 0.1rem; }
      .eh-ctx-statnum { font-family: var(--font-anton), sans-serif; font-size: 2.6rem; line-height: 1; }
      .eh-ctx-statlabel { font-family: var(--font-dm-sans), sans-serif; font-size: 0.76rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(247,244,239,0.6); }
      .eh-ctx-items { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
      @media (max-width: 760px) { .eh-ctx-items { grid-template-columns: 1fr; } }
      .eh-ctx-item { background: rgba(255,255,255,0.05); border: 1px solid rgba(247,244,239,0.1); border-radius: 12px; padding: 1.25rem 1.4rem; }
      .eh-ctx-itemicon { font-size: 1.6rem; display: block; margin-bottom: 0.5rem; }
      .eh-ctx-item h3 { font-family: var(--font-space-grotesk), sans-serif; font-size: 1rem; font-weight: 700; color: ${CREAM}; margin: 0 0 0.4rem; }
      .eh-ctx-item p { font-family: var(--font-space-grotesk), sans-serif; font-size: 0.88rem; line-height: 1.6; color: rgba(247,244,239,0.7); margin: 0; }
      .eh-ctx-link { font-family: var(--font-dm-sans), sans-serif; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; justify-self: start; }
      .eh-ctx-link:hover { opacity: 0.75; }

      /* ── Past / archive (muted) ─────────────────────────────────────────── */
      .eh-pastreveal-row { display: flex; justify-content: flex-end; padding: 0 clamp(1.25rem, 5vw, 3rem) clamp(1.5rem, 3vw, 2.5rem); }
      .eh-pastreveal {
        display: flex; align-items: center; gap: 0.5rem; width: fit-content;
        background: rgba(247,244,239,0.06); border: 1.5px solid rgba(247,244,239,0.2);
        color: rgba(247,244,239,0.7); cursor: pointer;
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem; font-weight: 700;
        letter-spacing: 0.14em; text-transform: uppercase; padding: 0.65rem 1.5rem; border-radius: 50px;
        transition: border-color 0.18s, color 0.18s;
      }
      .eh-pastreveal:hover { border-color: rgba(247,244,239,0.45); color: ${CREAM}; }
      .eh-past-close {
        background: none; border: none; cursor: pointer; color: rgba(247,244,239,0.5);
        font-size: 0.9rem; line-height: 1; padding: 0.25rem; transition: color 0.18s;
      }
      .eh-past-close:hover { color: ${CREAM}; }
      .eh-past { opacity: 0.85; }
      .eh-past-title { color: rgba(247,244,239,0.6); }
      .eh-past-list { display: flex; flex-direction: column; border-top: 1px solid rgba(247,244,239,0.1); }
      .eh-past-row {
        display: grid; grid-template-columns: 60px 1fr auto; align-items: center; gap: 1rem;
        text-decoration: none; padding: 0.7rem 0.5rem; border-bottom: 1px solid rgba(247,244,239,0.07);
        transition: background 0.15s;
      }
      .eh-past-row:hover { background: rgba(247,244,239,0.05); }
      .eh-past-year { font-family: var(--font-anton), sans-serif; font-size: 1.05rem; color: rgba(247,244,239,0.3); }
      .eh-past-main { display: flex; flex-direction: column; gap: 0.1rem; }
      .eh-past-name { font-family: var(--font-space-grotesk), sans-serif; font-size: 0.92rem; font-weight: 600; color: rgba(247,244,239,0.72); }
      .eh-past-loc { font-family: var(--font-dm-sans), sans-serif; font-size: 0.74rem; color: rgba(247,244,239,0.42); }
      .eh-past-arrow { color: rgba(247,244,239,0.4); }
      .eh-past-toggle {
        margin-top: 1rem; background: none; border: 1.5px solid rgba(247,244,239,0.2); cursor: pointer;
        font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em;
        text-transform: uppercase; color: rgba(247,244,239,0.65); padding: 0.55rem 1.3rem; border-radius: 50px; transition: border-color 0.18s, color 0.18s;
      }
      .eh-past-toggle:hover { border-color: rgba(247,244,239,0.45); color: ${CREAM}; }

      /* ── Oscar Wilde quote band ─────────────────────────────────────────── */
      .eh-quote-band { position: relative; padding: 0; }
      /* DAT logo seated on the crisp top edge of the quote image: bottom half over
         the image, top half over the background above — sized like /theatre (~18vw). */
      .eh-quote-logo {
        position: absolute; top: 0; left: 50%; transform: translate(-50%, -50%); z-index: 6;
        width: clamp(150px, 18vw, 230px); height: clamp(150px, 18vw, 230px);
        display: flex; align-items: center; justify-content: center; pointer-events: none;
      }
      .eh-quote-logo img {
        width: 100%; height: 100%; display: block;
        filter: drop-shadow(0 4px 18px rgba(0,0,0,0.6));
      }
      .eh-quote-wrap { position: relative; height: clamp(260px, 38vw, 460px); overflow: hidden; }
      @media (max-width: 600px) { .eh-quote-wrap { height: clamp(380px, 92vw, 480px); } }
      .eh-quote-photo { position: absolute; inset: 0; background-image: url('/images/performing-zanzibar.jpg'); background-size: cover; background-position: center 35%; }
      .eh-quote-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(10,5,14,0.82) 0%, rgba(10,5,14,0.6) 50%, rgba(10,5,14,0.35) 100%); }
      .eh-quote-content { position: absolute; inset: 0; display: flex; align-items: center; padding: 0 clamp(1.5rem, 6vw, 5rem); max-width: 860px; }
      .eh-quote { margin: 0; border-left: 3px solid rgba(217,169,25,0.6); padding-left: clamp(1.25rem, 3vw, 2.5rem); }
      .eh-quote-text { font-family: var(--font-space-grotesk), sans-serif; font-size: 1.4rem; font-style: italic; color: rgba(255,255,255,0.9); line-height: 1.7; margin: 0 0 0.75rem; max-width: 660px; text-shadow: 0 1px 8px rgba(0,0,0,0.5); }
      .eh-quote-attr { font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.5); }

      /* ── Mailing-list band ──────────────────────────────────────────────── */
      .eh-bottom-band { background: #145c37; padding: clamp(3rem, 6vw, 5rem) 0; }
      .eh-bottom-eyebrow { font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin: 0 0 0.6rem; }
      .eh-bottom-title { font-family: var(--font-anton), sans-serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 400; color: #fff; margin: 0 0 0.75rem; }
      .eh-bottom-body { font-family: var(--font-space-grotesk), sans-serif; font-size: 0.95rem; color: rgba(255,255,255,0.55); line-height: 1.65; margin: 0 0 1.5rem; max-width: 540px; }
      .eh-bottom-links { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
      .eh-bottom-link { font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; color: rgba(255,255,255,0.6); border: 1.5px solid rgba(255,255,255,0.18); padding: 0.7rem 1.5rem; border-radius: 10px; transition: color 0.2s, border-color 0.2s; }
      .eh-bottom-link:hover { color: #fff; border-color: rgba(255,255,255,0.45); }
      .eh-ml-form { display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; }
      .eh-ml-inputs { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .eh-ml-input { font-family: var(--font-space-grotesk), sans-serif; font-size: 0.9rem; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.18); color: #fff; padding: 0.7rem 1rem; border-radius: 8px; flex: 1 1 160px; min-width: 0; outline: none; transition: border-color 0.18s; }
      .eh-ml-input::placeholder { color: rgba(255,255,255,0.35); }
      .eh-ml-input:focus { border-color: rgba(217,169,25,0.6); }
      .eh-ml-input--email { flex: 2 1 200px; }
      .eh-ml-btn { font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; background: #D9A919; color: #241123; border: none; padding: 0.7rem 1.4rem; border-radius: 8px; cursor: pointer; transition: opacity 0.18s, transform 0.15s; }
      .eh-ml-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
      .eh-ml-btn:disabled { opacity: 0.55; cursor: default; }
      .eh-ml-fine { font-family: var(--font-dm-sans), sans-serif; font-size: 0.72rem; color: rgba(255,255,255,0.28); margin: 0; }
      .eh-ml-error { font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem; color: #F23359; margin: 0; }
      .eh-ml-error a { color: #F23359; }
      .eh-ml-success { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: rgba(47,168,115,0.12); border: 1.5px solid rgba(47,168,115,0.3); border-radius: 10px; }
      .eh-ml-check { font-size: 1.1rem; color: #2FA873; }
      .eh-ml-success-title { font-family: var(--font-space-grotesk), sans-serif; font-size: 0.95rem; font-weight: 700; color: #2FA873; margin: 0 0 0.2rem; }
      .eh-ml-success-sub { font-family: var(--font-dm-sans), sans-serif; font-size: 0.82rem; color: rgba(255,255,255,0.55); margin: 0; }
    `}</style>
  );
}
