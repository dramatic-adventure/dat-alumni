// app/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

import {
  COUNTRY_COUNT,
  CLUB_COUNT,
  SEASON_COUNT,
  ALUMNI_COUNT,
} from "@/lib/datStats";
import PhotoStrip from "@/components/shared/PhotoStrip";
import { dramaClubs } from "@/lib/dramaClubMap";
import { productionMap, getSortYear } from "@/lib/productionMap";
import { productionDetailsMap } from "@/lib/productionDetailsMap";
import {
  upcomingEvents,
  isElapsed,
  eventById,
  canonicalEventPath,
} from "@/lib/events";
import EventPoster, { DateChipStyles } from "./events/EventPoster";

/* ─── Types ─────────────────────────────────────────────────────────── */

type StoryCard = {
  Title: string;
  "Location Name": string;
  Country: string;
  Author: string;
  authorSlug: string;
  "Image URL": string;
  "Short Story": string;
  slug: string;
};

type LinkSpec = { href: string; label: string; tone: "pink" | "purple" | "green" | "yellow" };
type CardSpec = {
  tone: "pink" | "purple" | "green" | "yellow";
  title: string;
  desc: string;
  ctaHref: string;
  ctaLabel: string;
  links: LinkSpec[];
};

/* ─── Story media helper ─────────────────────────────────────────────── */

function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function StoryMedia({ url, title }: { url: string; title: string }) {
  if (!url) {
    return <div className="hp-story-img-placeholder" aria-hidden="true" />;
  }

  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <>
        <img
          src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
          alt={title}
          className="hp-story-img"
          loading="lazy"
        />
        <div className="hp-story-play-badge" aria-hidden="true">▶</div>
      </>
    );
  }

  const isVideo =
    url.includes("vimeo.com") ||
    /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  if (isVideo) {
    return (
      <div className="hp-story-video-placeholder">
        <div className="hp-story-play-badge hp-story-play-badge--static">▶</div>
        <span className="hp-story-video-label">Video</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      className="hp-story-img"
      loading="lazy"
    />
  );
}

/* ─── Home page stats ───────────────────────────────────────────────── */

const HOME_STATS = [
  { value: SEASON_COUNT,  label: "Seasons",        sub: "2006–present" },
  { value: COUNTRY_COUNT, label: "Countries",      sub: "where the work was born" },
  { value: CLUB_COUNT,    label: "Drama Clubs",    sub: "community-rooted ensembles" },
  { value: ALUMNI_COUNT,  label: "Alumni Artists", sub: "directors, actors & makers" },
];

const ARCHIVE_FALLBACK_HEADLINE = "Some stories keep echoing long after the final bow.";

/* Productions that must never surface in "From the Archives" (by slug or title) */
const ARCHIVE_EXCLUDE_SLUGS = new Set<string>(["ubinadamu"]);
const ARCHIVE_EXCLUDE_TITLES = new Set<string>(["ubinadamu"]);

/* ─── Home mailing-list form (green band, source: "home") ───────────────── */

function HomeMailingListForm() {
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
        body: JSON.stringify({ email, name, source: "home", website: honey }),
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
        {status === "loading" ? "Signing up…" : "Join the List"}
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

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function Page() {
  const router = useRouter();

  /* ── Live stories ─────────────────────────────────── */
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data.stories)) {
          setStories(data.stories.slice(0, 4));
        }
      })
      .catch(() => {})
      .finally(() => setStoriesLoading(false));
  }, []);

  /* ── Live (date-filtered) upcoming events ─────────── */
  const liveEvents = useMemo(
    () => upcomingEvents.filter((e) => !isElapsed(e)),
    []
  );

  const openEvent = (id: string) => {
    const ev = eventById(id);
    if (ev) router.push(canonicalEventPath(ev));
  };

  /* ── Drama club + archive pools ───────────────────── */
  const clubPool = useMemo(
    () => dramaClubs.filter((c) => c.heroImage || c.cardImage),
    []
  );
  const archivePool = useMemo(
    () =>
      Object.values(productionMap).filter(
        (p) =>
          p.posterUrl &&
          getSortYear(p) < new Date().getFullYear() &&
          !ARCHIVE_EXCLUDE_SLUGS.has(p.slug?.toLowerCase()) &&
          !ARCHIVE_EXCLUDE_TITLES.has(p.title?.trim().toLowerCase())
      ),
    []
  );

  /* ── Randomized indices (client-only — set after mount) ── */
  const [clubIdx, setClubIdx] = useState(0);
  const [archIdx, setArchIdx] = useState(0);

  useEffect(() => {
    try {
      const visit =
        (parseInt(sessionStorage.getItem("dat_home_visit") || "0", 10) || 0) + 1;
      sessionStorage.setItem("dat_home_visit", String(visit));

      // Drama club — re-rolls every OTHER visit
      if (clubPool.length) {
        let cIdx = parseInt(sessionStorage.getItem("dat_home_club") ?? "", 10);
        if (isNaN(cIdx) || visit % 2 === 1) {
          cIdx = Math.floor(Math.random() * clubPool.length);
          sessionStorage.setItem("dat_home_club", String(cIdx));
        }
        setClubIdx(cIdx % clubPool.length);
      }

      // Archive — re-rolls every 3rd visit (different cadence)
      if (archivePool.length) {
        let aIdx = parseInt(sessionStorage.getItem("dat_home_arch") ?? "", 10);
        if (isNaN(aIdx) || visit % 3 === 1) {
          aIdx = Math.floor(Math.random() * archivePool.length);
          sessionStorage.setItem("dat_home_arch", String(aIdx));
        }
        setArchIdx(aIdx % archivePool.length);
      }
    } catch {
      /* sessionStorage unavailable — keep deterministic defaults */
    }
  }, [clubPool.length, archivePool.length]);

  const featuredClub = clubPool.length
    ? clubPool[clubIdx % clubPool.length]
    : null;
  const archiveProd = archivePool.length
    ? archivePool[archIdx % archivePool.length]
    : null;

  /* ── Community accordion data ─────────────────────── */
  const cards: CardSpec[] = useMemo(
    () => [
      {
        tone: "pink",
        title: "DAT ALUMNI",
        desc: "Spin the globe and explore artist stories on DAT's Story Map. Find and (re)connect with artists through the Alumni Directory. Sponsor an Artist to build community-rooted work abroad — then watch the impact multiply as those artists return home to inspire others, create new work, and ignite change in their own communities.",
        ctaHref: "/alumni",
        ctaLabel: "DAT ALUMNI",
        links: [
          { href: "/story-map", label: "Explore the Story Map", tone: "pink" },
          { href: "/directory", label: "Find an Artist", tone: "pink" },
          { href: "/donate?mode=artist&freq=monthly&artistFocus=all", label: "Sponsor an Artist", tone: "pink" },
        ],
      },
      {
        tone: "purple",
        title: "PARTNERS",
        desc: "Host DAT on your campus. Build a credit-bearing study abroad that lets students devise, teach, produce, and perform theatre that tackles real-world issues. Or launch a CSR initiative or 'Adventure Day' of creativity, cross-cultural exchange, and youth mentorship.",
        ctaHref: "/partners",
        ctaLabel: "PARTNERS",
        links: [
          { href: "/partners/universities", label: "Build a University Partnership", tone: "purple" },
          { href: "/partners/corporate-giving", label: "Launch a Corporate Partnership (CSR)", tone: "purple" },
          { href: "/partners/propose-project", label: "Propose a Project or Partnership", tone: "purple" },
        ],
      },
      {
        tone: "green",
        title: "DRAMA CLUBS",
        desc: "Start a club or explore the Drama Clubs and communities we already serve. Mentor young artists. Sponsor a Club with space, materials, and workshops so youth in under-resourced communities can develop their voices and share their stories.",
        ctaHref: "/drama-club",
        ctaLabel: "DRAMA CLUBS",
        links: [
          { href: "/drama-club", label: "Find a Club", tone: "green" },
          { href: "/drama-club", label: "Become a Mentor", tone: "green" },
          { href: "/donate?mode=drama-club&freq=monthly", label: "Sponsor a Club", tone: "green" },
        ],
      },
      {
        tone: "yellow",
        title: "FRIENDS OF DAT",
        desc: "Join our circle of supporters and changemakers. Volunteer behind the scenes. Friend-raise and advocate for DAT as an Ambassador in your city. Every gift — of time, funds, or passion — helps spark transformation, one story at a time.",
        ctaHref: "/friends",
        ctaLabel: "FRIENDS OF DAT",
        links: [
          { href: "/friends/volunteer", label: "Volunteer with DAT", tone: "yellow" },
          { href: "/friends/ambassador", label: "Join as an Ambassador", tone: "yellow" },
          { href: "/donate", label: "Donate", tone: "yellow" },
        ],
      },
    ],
    []
  );

  /* ── Accordion state ──────────────────────────────── */
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [panelHeights, setPanelHeights] = useState<number[]>([]);
  const revealRefs = useRef<Array<HTMLDivElement | null>>([]);

  const setRevealRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      revealRefs.current[idx] = el;
    },
    []
  );

  const measureOpen = useCallback(() => {
    setPanelHeights(() => {
      const next = new Array(cards.length).fill(0);
      if (openIndex != null) {
        const node = revealRefs.current[openIndex];
        next[openIndex] = node ? node.scrollHeight : 0;
      }
      return next;
    });
  }, [cards.length, openIndex]);

  useEffect(() => {
    const handler = () => measureOpen();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [measureOpen]);

  useEffect(() => {
    requestAnimationFrame(measureOpen);
  }, [openIndex, measureOpen]);

  /* ── Render ───────────────────────────────────────── */
  return (
    <main style={{ background: "transparent" }}>

      {/* ════════════════════════════════════════════════
          HERO — full-bleed image, headline in lower third
      ════════════════════════════════════════════════ */}
      <div className="hp-hero">
        <Image
          src="/images/agwow-flying.webp"
          alt="A DAT performer in flight with outstretched woven wings on a darkened stage"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center 35%" }}
        />
        <div className="hp-hero-overlay" aria-hidden="true" />
        <div className="hp-hero-content-outer">
          <div className="hp-hero-content-inner">
            <p
              className="hp-hero-eyebrow"
              style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif' }}
            >
              Dramatic Adventure Theatre
            </p>
            <h1
              className="hp-hero-title"
              style={{ fontFamily: '"Anton", sans-serif' }}
            >
              EVERY STORY<br />STARTS SOMEWHERE.
            </h1>
            <p
              className="hp-hero-sub"
              style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif' }}
            >
              We develop artists, travel the world, and make theatre that matters.
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PHOTO STRIP — below hero
      ════════════════════════════════════════════════ */}
      <PhotoStrip />

      {/* ════════════════════════════════════════════════
          STORY MAP TEASER — teal, 20-year celebration
      ════════════════════════════════════════════════ */}
      <section className="hp-smt-section" aria-labelledby="hp-smt-heading">

        {/* Image is a direct child of the section so absolute positioning
            always pins it to the section's bottom-left corner */}
        <div className="hp-smt-img-col" aria-hidden="true">
          <Image
            src="/images/story-map-teaser.webp"
            alt=""
            width={2140}
            height={1038}
            className="hp-smt-img"
          />
        </div>

        <div className="hp-smt-inner">
          <div className="hp-smt-text-col">
            <p className="hp-smt-eyebrow">Celebrating</p>
            <h2 id="hp-smt-heading" className="hp-smt-years">20 YEARS</h2>
            <p className="hp-smt-subtitle">of Cross-Cultural Storytelling</p>
            <p className="hp-smt-body">
              From the Amazon to the Andes, from Slovakia to New York — for the past two decades,
              Dramatic Adventure Theatre has remained dedicated to uniting artists and communities
              through story, travel, and human connection.
            </p>
            <p className="hp-smt-body">
              Explore the experiences and moments that have changed lives along this journey.
            </p>
            <div className="hp-smt-actions">
              <Link href="/story-map" className="hp-smt-btn hp-smt-btn--pink">
                Explore Story Map
              </Link>
              <a
                href="https://www.dramaticadventure.com/who-we-are"
                target="_blank"
                rel="noopener noreferrer"
                className="hp-smt-btn hp-smt-btn--purple"
              >
                Learn More About DAT
              </a>
            </div>
          </div>
        </div>{/* /hp-smt-inner */}

      </section>

      {/* ════════════════════════════════════════════════
          FROM THE ARCHIVES — random past production
      ════════════════════════════════════════════════ */}
      {archiveProd && (
        <section className="hp-arch-section" aria-labelledby="hp-arch-heading">
          <div className="hp-arch-inner">
            <div className="hp-field-header">
              <p className="hp-eyebrow-label hp-eyebrow-gold-muted">From the Archives</p>
              <h2 id="hp-arch-heading" className="hp-arch-section-title">
                {productionDetailsMap[archiveProd.slug]?.subtitle ||
                  ARCHIVE_FALLBACK_HEADLINE}
              </h2>
            </div>
            <div className="hp-arch-grid">
              {archiveProd.posterUrl && (
                <button
                  type="button"
                  className="hp-arch-poster-wrap"
                  onClick={() =>
                    router.push(archiveProd.url || `/theatre/${archiveProd.slug}`)
                  }
                  aria-label={`Explore ${archiveProd.title}`}
                >
                  <img
                    src={archiveProd.posterUrl}
                    alt={`${archiveProd.title} poster`}
                    className="hp-arch-poster"
                  />
                </button>
              )}
              <div className="hp-arch-text">
                <h3 className="hp-arch-headline">{archiveProd.title}</h3>
                <p className="hp-arch-meta">
                  {[
                    archiveProd.location,
                    archiveProd.season ? `Season ${archiveProd.season}` : null,
                    archiveProd.festival || archiveProd.venue || null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="hp-arch-actions">
                  <button
                    className="hp-arch-btn"
                    onClick={() =>
                      router.push(archiveProd.url || `/theatre/${archiveProd.slug}`)
                    }
                  >
                    Explore the Story
                  </button>
                  <Link href="/theatre" className="hp-arch-alt-link">
                    Full archive →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          WHAT'S ON — compact editorial preview (links to /events)
      ════════════════════════════════════════════════ */}
      {liveEvents.length > 0 && (() => {
        const featuredEv = liveEvents.find((e) => e.featured) ?? liveEvents[0];
        const panelEvents = [
          featuredEv,
          ...liveEvents.filter((e) => e.id !== featuredEv.id),
        ].slice(0, 5);
        return (
          <section className="hp-whatson-section" aria-labelledby="hp-whatson-heading">
            <DateChipStyles />
            <div className="hp-whatson-inner">
              <div className="hp-whatson-header">
                <div>
                  <p className="hp-eyebrow-label hp-eyebrow-gold-muted">Live &amp; Coming Up</p>
                  <h2 id="hp-whatson-heading" className="hp-whatson-title">What&apos;s On</h2>
                </div>
              </div>

              <div className="hp-whatson-panels">
                {panelEvents.map((e) => (
                  <div key={e.id} className="hp-whatson-panel">
                    <EventPoster variant="card" event={e} onOpen={openEvent} />
                  </div>
                ))}
              </div>

              <div className="hp-whatson-gallery-foot">
                <Link href="/events" className="hp-whatson-viewall">View full season →</Link>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ════════════════════════════════════════════════
          FROM THE FIELD — editorial live stories
      ════════════════════════════════════════════════ */}
      {(storiesLoading || stories.length > 0) && (
        <section className="hp-field-section" aria-labelledby="hp-field-heading">
          <div className="hp-field-inner">
            <div className="hp-field-header">
              <p className="hp-eyebrow-label hp-eyebrow-fieldink">From the Field</p>
              <h2 id="hp-field-heading" className="hp-field-title">
                Stories that started somewhere — and didn&apos;t stop there.
              </h2>
            </div>

            {storiesLoading && (
              <div className="hp-field-grid">
                <div className="hp-skeleton-card" style={{ minHeight: 420 }} />
                <div className="hp-field-list">
                  <div className="hp-skeleton-card" style={{ minHeight: 80 }} />
                  <div className="hp-skeleton-card" style={{ minHeight: 80 }} />
                  <div className="hp-skeleton-card" style={{ minHeight: 80 }} />
                </div>
              </div>
            )}

            {!storiesLoading && stories.length > 0 && (() => {
              const s = stories[0];
              const loc = [s["Location Name"], s.Country].filter(Boolean).join(" · ");
              const excerpt = s["Short Story"];
              const more = stories.slice(1, 5);
              return (
                <>
                  {/* Newest story — editorial dispatch: photo beside excerpt + CTA */}
                  <div className="hp-dispatch">
                    <Link href={`/story/${s.slug}`} className="hp-dispatch-media" aria-label={s.Title}>
                      <StoryMedia url={s["Image URL"]} title={s.Title} />
                    </Link>
                    <div className="hp-dispatch-body">
                      {loc && <span className="hp-dispatch-loc">{loc}</span>}
                      <h3 className="hp-dispatch-title">{s.Title}</h3>
                      {excerpt && <p className="hp-dispatch-excerpt">{excerpt}</p>}
                      {s.Author && (
                        <p className="hp-dispatch-author">
                          by{" "}
                          {s.authorSlug ? (
                            <Link href={`/alumni/${s.authorSlug}`} className="hp-dispatch-author-link">
                              {s.Author}
                            </Link>
                          ) : (
                            s.Author
                          )}
                        </p>
                      )}
                      <Link href={`/story/${s.slug}`} className="hp-dispatch-cta">
                        Read the story →
                      </Link>
                    </div>
                  </div>

                  {/* More dispatches — compact thumbnail row of the remaining stories */}
                  {more.length > 0 && (
                    <div className="hp-dispatch-more">
                      <div className="hp-dispatch-more-head">
                        <span className="hp-dispatch-more-label">More Dispatches</span>
                        <Link href="/story-map" className="hp-dispatch-more-all">
                          Explore all stories →
                        </Link>
                      </div>
                      <div className="hp-dispatch-more-grid">
                        {more.map((m) => (
                          <Link key={m.slug} href={`/story/${m.slug}`} className="hp-dispatch-thumb">
                            <div className="hp-dispatch-thumb-img">
                              <StoryMedia url={m["Image URL"]} title={m.Title} />
                            </div>
                            <span className="hp-dispatch-thumb-loc">
                              {[m["Location Name"], m.Country].filter(Boolean).join(" · ")}
                            </span>
                            <span className="hp-dispatch-thumb-title">{m.Title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          STEP IN — engage primary (kraft) + Community accordion
      ════════════════════════════════════════════════ */}
      <section className="hp-engage-section" aria-labelledby="hp-engage-heading">
        <div className="hp-engage-inner">

          {/* Stat bar — mirrors /theatre, anchored to the Step In section */}
          <div className="hp-statbar">
            <div className="hp-statbar-grid">
              {HOME_STATS.map((s) => (
                <div key={s.label} className="hp-statbar-cell">
                  <div className="hp-statbar-num">{s.value}</div>
                  <div className="hp-statbar-label">{s.label}</div>
                  <div className="hp-statbar-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hp-engage-header">
            <p className="hp-eyebrow-label hp-eyebrow-ink">Step In</p>
            <h2 id="hp-engage-heading" className="hp-engage-title">Your story starts here.</h2>
          </div>

          <div className="hp-engage-grid">

            {/* Artists — permanently largest */}
            <div className="hp-engage-primary hp-engage-card">
              <div
                className="hp-engage-card-bg"
                style={{ backgroundImage: "url('/images/performing-zanzibar.jpg')" }}
                aria-hidden="true"
              />
              <div className="hp-engage-card-scrim" aria-hidden="true" />
              <div className="hp-engage-primary-body">
                <span className="hp-engage-eyebrow hp-engage-eyebrow--gold">For artists &amp; students</span>
                <h3 className="hp-engage-primary-title">Take the Stage</h3>
                <p className="hp-engage-primary-p">
                  Devise, teach, and perform theatre that matters — through residencies and
                  expeditions in Ecuador, Tanzania, Slovakia, and beyond. Credit-bearing options available.
                </p>
                <a
                  href="https://dramaticadventure.com/travel-opportunities"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hp-engage-primary-btn"
                >
                  Explore Programs
                </a>
              </div>
            </div>

            {/* Secondary column */}
            <div className="hp-engage-right">

              {/* Audiences */}
              <div className="hp-engage-sec hp-engage-card">
                <div
                  className="hp-engage-card-bg"
                  style={{ backgroundImage: "url('/images/Andean_Mask_Work.jpg')" }}
                  aria-hidden="true"
                />
                <div className="hp-engage-card-scrim" aria-hidden="true" />
                <div className="hp-engage-sec-body">
                  <span className="hp-engage-eyebrow hp-engage-eyebrow--teal">For audiences</span>
                  <h4 className="hp-engage-sec-title">Follow the Journey</h4>
                  <p className="hp-engage-sec-teaser">Catch a season of bold journeys.</p>
                  <div className="hp-engage-sec-more">
                    <p className="hp-engage-sec-more-p">
                      Deep listening, unique collaborations, and daring creativity — on tour and at home.
                    </p>
                    <button
                      className="hp-engage-sec-btn hp-engage-sec-btn--teal"
                      type="button"
                      onClick={() => router.push("/events")}
                    >
                      Experience the Work
                    </button>
                  </div>
                </div>
              </div>

              {/* Supporters */}
              <div className="hp-engage-sec hp-engage-sec--gold hp-engage-card">
                <div
                  className="hp-engage-card-bg"
                  style={{ backgroundImage: "url('/images/teaching-andes.jpg')" }}
                  aria-hidden="true"
                />
                <div className="hp-engage-card-scrim" aria-hidden="true" />
                <div className="hp-engage-sec-body">
                  <span className="hp-engage-eyebrow hp-engage-eyebrow--goldlabel">For supporters</span>
                  <h4 className="hp-engage-sec-title">Make Magic Possible</h4>
                  <p className="hp-engage-sec-teaser">Power theatre where story is needed most.</p>
                  <div className="hp-engage-sec-more">
                    <p className="hp-engage-sec-more-p">
                      Sponsor an artist or a club and watch the impact multiply as they return home to create.
                    </p>
                    <button
                      className="hp-engage-sec-btn hp-engage-sec-btn--gold"
                      type="button"
                      onClick={() => router.push("/donate")}
                    >
                      Sponsor the Story
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Divider into "More Ways In" */}
          <div className="hp-engage-divider"><span>More Ways In</span></div>

          {/* ── Community accordion (UNCHANGED) ── */}
          <div className="hp-community-grid">
            {cards.map((card, i) => {
              const expanded = openIndex === i;
              return (
                <div
                  key={card.title}
                  className="hp-community-card"
                  data-open={expanded ? "true" : "false"}
                >
                  {/* Colored pill — navigates to section */}
                  <button
                    className={`hp-card-cta-bar hp-card-cta-bar--${card.tone}`}
                    type="button"
                    onClick={() => router.push(card.ctaHref)}
                    aria-label={`Open ${card.title} portal`}
                  >
                    <span className="hp-card-cta-text">{card.title}</span>
                  </button>

                  {/* Description (clamps when closed) */}
                  <p
                    className="hp-card-desc"
                    data-open={expanded ? "true" : "false"}
                  >
                    {card.desc}
                  </p>

                  {/* Chevron toggle */}
                  <button
                    className="hp-chev-toggle"
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`hp-reveal-${i}`}
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  >
                    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                      <path d="M4 7.5 L10 13 L16 7.5" />
                    </svg>
                  </button>

                  {/* Animated reveal zone */}
                  <div
                    className="hp-reveal-wrap"
                    id={`hp-reveal-${i}`}
                    ref={setRevealRef(i)}
                    style={{ maxHeight: expanded ? (panelHeights[i] ?? 0) : 0 }}
                  >
                    <div
                      className="hp-mini-buttons-row"
                      role="group"
                      aria-label={`${card.title} links`}
                    >
                      {card.links.map((lnk) => (
                        <button
                          key={`${lnk.href}-${lnk.label}`}
                          className={`hp-mini-btn hp-mini-btn--${lnk.tone}`}
                          onClick={() => router.push(lnk.href)}
                          type="button"
                        >
                          <span>{lnk.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════
          DRAMA CLUB SPOTLIGHT — teal, community-rooted
      ════════════════════════════════════════════════ */}
      {featuredClub && (
        <section
          className="hp-club-section"
          aria-labelledby="hp-club-heading"
          style={{ background: "#2493A9" }}
        >
          <div className="hp-club-inner">

            <div className="hp-club-text">
              <p className="hp-eyebrow-label hp-eyebrow-muted">DRAMA CLUB SPOTLIGHT</p>
              <h2 id="hp-club-heading" className="hp-club-name">
                {featuredClub.name}
              </h2>
              <p className="hp-club-location">
                {[featuredClub.city, featuredClub.country].filter(Boolean).join(", ")}
              </p>
              <p className="hp-club-desc">
                {featuredClub.shortBlurb
                  ? featuredClub.shortBlurb
                  : typeof featuredClub.description === "string"
                  ? featuredClub.description.length > 240
                    ? featuredClub.description.slice(0, 240) + "…"
                    : featuredClub.description
                  : ""}
              </p>
              <div className="hp-club-actions">
                <button
                  className="hp-club-btn"
                  onClick={() => router.push(`/drama-club/${featuredClub.slug}`)}
                >
                  Meet the Club
                </button>
                <button
                  className="hp-club-btn hp-club-btn--ghost"
                  onClick={() => router.push("/donate?mode=drama-club&freq=monthly")}
                >
                  Sponsor this Club
                </button>
                <Link href="/drama-club" className="hp-club-alt-link">
                  See all clubs →
                </Link>
              </div>
            </div>

            {(featuredClub.heroImage || featuredClub.cardImage) && (
              <div className="hp-club-img-wrap">
                <img
                  src={(featuredClub.heroImage || featuredClub.cardImage) as string}
                  alt={featuredClub.name}
                  className="hp-club-img"
                />
              </div>
            )}

          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════
          SUBSCRIBE — green mailing-list band (mirrors /events)
      ════════════════════════════════════════════════ */}
      <section className="eh-bottom-band" aria-labelledby="hp-subscribe-heading">
        <div className="eh-container">
          <p className="eh-bottom-eyebrow">From the Field to Your Inbox</p>
          <h2 id="hp-subscribe-heading" className="eh-bottom-title">Don&apos;t miss the next adventure.</h2>
          <p className="eh-bottom-body">
            Stories from the field, new work taking shape, artists finding their way across the
            world, and the next dramatic adventures on the horizon — sent your way a few times a season.
          </p>
          <HomeMailingListForm />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          STYLES — plain <style>, hp- prefix throughout
      ════════════════════════════════════════════════ */}
      <style>{`

/* ── Font face ─────────────────────────────────────────── */
@font-face {
  font-family: "Anton";
  src: url("/fonts/anton-v27-latin_latin-ext_vietnamese-regular.woff2") format("woff2");
  font-display: swap;
}

/* ── Page link reset ───────────────────────────────────── */
main a,
main a:visited,
main a:hover,
main a:focus,
main a:active { text-decoration: none !important; }

/* ── Brand tokens ──────────────────────────────────────── */
:root {
  --hp-purple:  #6C00AF;
  --hp-deep:    #241123;
  --hp-teal:    #2493A9;
  --hp-pink:    #F23359;
  --hp-yellow:  #FFCC00;
  --hp-gold:    #D9A919;
  --hp-green:   #2FA873;
  --hp-kraft:   rgba(36,17,35,0.72);
}

/* ══════════════════════════════════════════════════════════
   SHARED EYEBROW LABEL
══════════════════════════════════════════════════════════ */
.hp-eyebrow-label {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: #FFCC00;
  margin: 0;
}
/* On light/kraft backgrounds */
.hp-eyebrow-ink {
  color: rgba(36,17,35,0.72) !important;
}
/* On dark backgrounds, slightly muted white */
.hp-eyebrow-muted {
  color: rgba(255,255,255,0.52) !important;
}
/* On very dark backgrounds, muted gold */
.hp-eyebrow-gold-muted {
  color: rgba(255,204,0,0.65) !important;
}

/* ══════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════ */
.hp-hero {
  position: relative;
  height: 82vh;
  min-height: 620px;
  overflow: hidden;
  z-index: 0;
}
@media (max-width: 1024px) { .hp-hero { height: 74vh; min-height: 540px; } }
@media (max-width: 767px)  { .hp-hero { height: 66vh; min-height: 440px; } }

.hp-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(36,17,35,0.20) 0%,
    rgba(36,17,35,0.0)  20%,
    rgba(36,17,35,0.38) 60%,
    rgba(36,17,35,0.94) 100%
  );
  pointer-events: none;
  z-index: 1;
}
.hp-hero-content-outer {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  z-index: 2;
  padding-bottom: 4.75rem;
}
.hp-hero-content-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
.hp-hero-eyebrow {
  /* fontFamily set inline */
  font-weight: 900;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.38em;
  color: rgba(246,228,193,0.72);
  margin: 0 0 0.6rem;
}
.hp-hero-title {
  /* fontFamily set inline */
  font-size: clamp(3rem, 8vw, 6.5rem);
  line-height: 1.0;
  text-transform: uppercase;
  color: #D9A919;
  opacity: 0.93;
  margin: 0 0 0.7rem;
  text-shadow: 0 4px 32px rgba(0,0,0,0.4);
}
.hp-hero-sub {
  /* fontFamily set inline */
  font-weight: 500;
  font-size: clamp(0.92rem, 1.9vw, 1.22rem);
  color: rgba(246,228,193,0.88);
  margin: 0;
  line-height: 1.45;
}
@media (max-width: 540px) {
  .hp-hero-content-outer { padding-bottom: 3rem; }
}

/* ══════════════════════════════════════════════════════════
   CTA SECTION — three doors with image hover reveal
══════════════════════════════════════════════════════════ */
.hp-cta-section {
  background: transparent;
  padding: 2.75rem 2rem 3.5rem;
}
.hp-cta-inner { max-width: 1200px; margin: 0 auto; }
.hp-cta-intro-label { margin-bottom: 1.4rem; }

.hp-cta-wrapper {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 960px) {
  .hp-cta-wrapper { grid-template-columns: repeat(2, 1fr); }
  .hp-cta-wrapper > .hp-cta-card:last-child {
    grid-column: 1 / -1;
    max-width: 480px;
  }
}
@media (max-width: 580px) {
  .hp-cta-wrapper { grid-template-columns: 1fr; }
  .hp-cta-wrapper > .hp-cta-card:last-child { max-width: none; }
}

/* ── Card shell ── */
.hp-cta-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: rgba(255,255,255,0.55);
  box-shadow: 0 2px 8px rgba(36,17,35,0.07), 0 8px 24px rgba(36,17,35,0.10);
  border-top: 5px solid transparent;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
  min-height: 340px;
}
.hp-cta-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(36,17,35,0.12), 0 18px 44px rgba(36,17,35,0.22);
}
.hp-cta-card--pink { border-top-color: #F23359; }
.hp-cta-card--teal { border-top-color: #2493A9; }
.hp-cta-card--gold { border-top-color: #D9A919; }

/* ── Background image (reveals on hover) ── */
.hp-cta-card-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transform: scale(1.07);
  transition: opacity 0.65s ease, transform 0.65s ease;
  z-index: 0;
}
.hp-cta-card:hover .hp-cta-card-bg {
  opacity: 1;
  transform: scale(1);
}

/* ── Dark scrim over image ── */
.hp-cta-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(20,6,22,0.74);
  opacity: 0;
  transition: opacity 0.55s ease;
  z-index: 1;
  pointer-events: none;
}
.hp-cta-card:hover .hp-cta-card-overlay { opacity: 1; }

/* ── Content sits above image + overlay ── */
.hp-cta-card-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.75rem 1.75rem 1.6rem;
  box-sizing: border-box;
  flex: 1;
}

/* ── Text group fades out on hover ── */
.hp-cta-text-group { flex: 1 1 auto; transition: opacity 0.42s ease; }
.hp-cta-card:hover .hp-cta-text-group { opacity: 0; }

/* ── Label ── */
.hp-cta-card-label {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-weight: 900;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.26em;
  margin: 0 0 0.55rem;
}
.hp-cta-card--pink .hp-cta-card-label { color: #c4163d; }
.hp-cta-card--teal .hp-cta-card-label { color: #1a7a8f; }
.hp-cta-card--gold .hp-cta-card-label { color: #9e7900; }

/* ── Headline ── */
.hp-cta-card-h3 {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif !important;
  font-weight: 800;
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  color: #241123;
  margin: 0 0 0.7rem;
  line-height: 1.12;
}

/* ── Body ── */
.hp-cta-card-p {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.62;
  color: rgba(36,17,35,0.72);
  margin: 0;
}

/* ── CTA button — stays visible on hover ── */
.hp-cta-card-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  margin-top: 1.5rem;
  padding: 0.8rem 1.65rem;
  border: none;
  border-radius: 10px;
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-weight: 700;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  cursor: pointer;
  text-decoration: none !important;
  box-shadow: 0 4px 14px rgba(0,0,0,0.14);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}
.hp-cta-card-btn:hover { transform: translateY(-2px); box-shadow: 0 7px 22px rgba(0,0,0,0.28); }
.hp-cta-card-btn--pink { background: #F23359; color: #fff; }
.hp-cta-card-btn--teal { background: #2493A9; color: #fff; }
.hp-cta-card-btn--gold { background: #D9A919; color: #241123; }
/* Button pulse when card image is showing */
.hp-cta-card:hover .hp-cta-card-btn { animation: hp-btn-pulse 1.4s ease-in-out infinite; }
@keyframes hp-btn-pulse {
  0%   { box-shadow: 0 0 0   6px rgba(255,204,0,0);   }
  50%  { box-shadow: 0 0 0  10px rgba(255,204,0,0.28); }
  100% { box-shadow: 0 0 0   6px rgba(255,204,0,0);   }
}

/* ══════════════════════════════════════════════════════════
   LIVE STORY STRIP — kraft background, ink cards
══════════════════════════════════════════════════════════ */
.hp-stories-section { padding: 3rem 2rem 3.5rem; }
.hp-stories-inner { max-width: 1200px; margin: 0 auto; }
.hp-stories-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
}
.hp-see-all-link {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  color: rgba(36,17,35,0.5) !important;
  transition: color 0.18s ease;
}
.hp-see-all-link:hover { color: #241123 !important; }

/* Grid */
.hp-stories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}
@media (max-width: 860px) { .hp-stories-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) { .hp-stories-grid { grid-template-columns: 1fr; } }

/* Story card — light treatment on kraft */
.hp-story-card {
  display: block;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255,255,255,0.62);
  border: 1px solid rgba(36,17,35,0.08);
  box-shadow: 0 2px 10px rgba(36,17,35,0.08), 0 6px 20px rgba(36,17,35,0.06);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  cursor: pointer;
}
.hp-story-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(36,17,35,0.14), 0 14px 36px rgba(36,17,35,0.14);
}

/* Image shell */
.hp-story-img-shell {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: rgba(36,17,35,0.08);
}
.hp-story-img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  transition: transform 0.4s ease;
}
.hp-story-card:hover .hp-story-img { transform: scale(1.04); }

.hp-story-img-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, rgba(36,17,35,0.12) 0%, rgba(36,147,169,0.12) 100%);
}

/* Video placeholder */
.hp-story-video-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #241123 0%, #1a3a4a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
.hp-story-play-badge {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 40px; height: 40px;
  background: rgba(255,255,255,0.92);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: #241123;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  padding-left: 3px; /* optical center for play triangle */
}
.hp-story-play-badge--static { position: static; transform: none; }
.hp-story-video-label {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  color: rgba(246,228,193,0.65);
}

/* Story text */
.hp-story-body { padding: 0.9rem 1rem 1.1rem; }
.hp-story-location {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #2493A9;
  margin: 0 0 0.32rem;
}
.hp-story-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif !important;
  font-size: 1rem;
  font-weight: 700;
  color: #241123;
  margin: 0 0 0.4rem;
  line-height: 1.3;
}
.hp-story-author {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.78rem;
  color: rgba(36,17,35,0.48);
  font-style: italic;
  margin: 0;
}

/* Skeleton shimmer — kraft-toned */
.hp-skeleton-card {
  border-radius: 14px;
  min-height: 220px;
  background: linear-gradient(
    90deg,
    rgba(36,17,35,0.06) 0%,
    rgba(36,17,35,0.12) 50%,
    rgba(36,17,35,0.06) 100%
  );
  background-size: 200% 100%;
  animation: hp-shimmer 1.5s infinite linear;
}
@keyframes hp-shimmer {
  0%   { background-position:  200% center; }
  100% { background-position: -200% center; }
}

.hp-stories-empty {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  color: rgba(36,17,35,0.55);
  text-align: center;
  padding: 2.5rem 1rem;
  font-size: 1rem;
}
.hp-inline-link { color: #2493A9 !important; }

/* ══════════════════════════════════════════════════════════
   DRAMA CLUB SPOTLIGHT
══════════════════════════════════════════════════════════ */
.hp-club-section { padding: 3.5rem 0; }
.hp-club-inner {
  max-width: 1200px; margin: 0 auto; padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}
@media (max-width: 780px) { .hp-club-inner { grid-template-columns: 1fr; gap: 2rem; } }

.hp-club-name {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif !important;
  font-size: clamp(1.8rem, 3.5vw, 2.7rem);
  font-weight: 800;
  color: #fff;
  margin: 0.6rem 0 0.35rem;
  line-height: 1.15;
}
.hp-club-location {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.95rem; font-weight: 600;
  color: rgba(255,255,255,0.7);
  margin: 0 0 1rem; letter-spacing: 0.04em;
}
.hp-club-desc {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 1rem; line-height: 1.65;
  color: rgba(255,255,255,0.88);
  margin: 0 0 1.75rem;
}
.hp-club-actions { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.hp-club-btn {
  display: inline-flex; align-items: center;
  padding: 0.9rem 2rem;
  background: #241123; color: #fff;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.92rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.2em;
  border: none; border-radius: 10px; cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
}
.hp-club-btn:hover { background: #3a0055; transform: translateY(-1px); }
.hp-club-alt-link {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.88rem; font-weight: 600;
  color: rgba(255,255,255,0.75) !important;
  transition: color 0.18s ease;
}
.hp-club-alt-link:hover { color: #fff !important; }
.hp-club-img-wrap {
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  aspect-ratio: 4 / 3;
}
.hp-club-img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ══════════════════════════════════════════════════════════
   PRODUCTION — theatrical marquee
══════════════════════════════════════════════════════════ */
.hp-prod-section {
  position: relative;
  background: #100718;
  padding: 4.5rem 2rem;
  overflow: hidden;
}

/* Archive image as atmospheric texture */
.hp-prod-stage-texture {
  position: absolute;
  inset: 0;
  background: url("/images/theatre/archive/agwow-condor.webp") center / cover no-repeat;
  opacity: 0.14;
  z-index: 0;
}
/* Layered vignette over texture */
.hp-prod-stage-vignette {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right,  rgba(16,7,24,0.82) 0%, rgba(16,7,24,0.25) 60%, rgba(16,7,24,0.60) 100%),
    linear-gradient(to bottom, rgba(16,7,24,0.55) 0%, rgba(16,7,24,0.0) 40%, rgba(16,7,24,0.65) 100%);
  z-index: 1;
}

.hp-prod-inner {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4rem;
  align-items: center;
}
@media (max-width: 780px) { .hp-prod-inner { grid-template-columns: 1fr; gap: 2.5rem; } }

/* Poster — larger, more dramatic */
.hp-prod-poster-wrap {
  width: 260px;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  box-shadow:
    0 0 0 1px rgba(255,204,0,0.15),
    0 28px 70px rgba(0,0,0,0.75),
    0 8px 24px rgba(0,0,0,0.55);
  flex-shrink: 0;
}
/* Gold border glow on poster */
.hp-prod-poster-glow {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  border: 2px solid rgba(255,204,0,0.22);
  pointer-events: none;
}
@media (max-width: 780px) {
  .hp-prod-poster-wrap { width: 100%; max-width: 280px; margin: 0 auto; }
}
.hp-prod-poster { width: 100%; height: auto; display: block; }

/* Title — marquee scale */
.hp-prod-title {
  font-family: "Anton", sans-serif !important;
  font-size: clamp(2.4rem, 5.5vw, 4.8rem);
  color: #FFCC00;
  margin: 0.7rem 0 0;
  line-height: 1.0;
  text-transform: uppercase;
  text-shadow: 0 4px 30px rgba(0,0,0,0.5);
  letter-spacing: 0.01em;
}

/* Meta block — left-bordered accent */
.hp-prod-meta-block {
  border-left: 3px solid rgba(255,204,0,0.35);
  padding-left: 1rem;
  margin: 1.1rem 0 0;
}
.hp-prod-meta {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 1rem; font-weight: 600;
  color: rgba(246,228,193,0.75);
  margin: 0 0 0.3rem; letter-spacing: 0.04em;
}
.hp-prod-sub {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.88rem;
  color: rgba(246,228,193,0.5);
  margin: 0 0 0.25rem;
}
.hp-prod-italic { font-style: italic; }

.hp-prod-actions {
  display: flex; align-items: center;
  gap: 1.75rem; flex-wrap: wrap;
  margin-top: 2rem;
}
/* Main CTA — gold, bold, unmissable */
.hp-prod-btn {
  display: inline-flex; align-items: center;
  padding: 1rem 2.5rem;
  background: #FFCC00;
  color: #241123;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.95rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.22em;
  border: none; border-radius: 12px; cursor: pointer;
  box-shadow: 0 6px 28px rgba(255,204,0,0.28), 0 2px 8px rgba(0,0,0,0.3);
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.hp-prod-btn:hover {
  background: #ffe640;
  transform: translateY(-2px);
  box-shadow: 0 10px 36px rgba(255,204,0,0.42), 0 4px 12px rgba(0,0,0,0.35);
}
.hp-prod-alt-link {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.88rem; font-weight: 600;
  color: rgba(246,228,193,0.48) !important;
  transition: color 0.18s ease;
}
.hp-prod-alt-link:hover { color: rgba(246,228,193,0.85) !important; }

/* ══════════════════════════════════════════════════════════
   COMMUNITY ACCORDION
══════════════════════════════════════════════════════════ */
.hp-community-band { padding: 3.5rem 0 4.5rem; }
.hp-community-wrap { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }

/* Section header — strong on kraft */
.hp-community-band-header { margin-bottom: 2.25rem; }

.hp-community-eyebrow {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.28em;
  color: #241123;
  opacity: 0.72;
  margin: 0 0 0.45rem;
}

.hp-community-band-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif !important;
  font-size: clamp(2.2rem, 4.5vw, 3.4rem);
  font-weight: 800;
  color: #241123;
  margin: 0 0 0.5rem;
  line-height: 1.1;
  opacity: 0.92;
}

.hp-community-band-sub {
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: rgba(36,17,35,0.72);
  margin: 0;
  line-height: 1.55;
  max-width: 600px;
}

/* FLEX grid — CSS-var-driven column count */
.hp-community-grid {
  position: relative; z-index: 1;
  display: flex; flex-wrap: wrap;
  --hp-gap: clamp(14px, 1.6vw, 24px);
  --hp-cols: 4;
  gap: var(--hp-gap);
  align-items: flex-start;
  box-sizing: border-box;
}
.hp-community-card {
  flex: 0 1 calc((100% - (var(--hp-cols) - 1) * var(--hp-gap)) / var(--hp-cols));
  position: relative;
  display: flex; flex-direction: column;
  box-sizing: border-box;
  padding: 1rem 1.1rem 0.3rem;
  border-radius: 12px;
  background: rgba(255,255,255,0.42);
  border: 1px solid rgba(36,17,35,0.08);
  box-shadow: 0 4px 14px rgba(36,17,35,0.10);
  transition: background 0.2s ease, box-shadow 0.2s ease;
  text-align: left;
  overflow: visible;
}
.hp-community-card[data-open="true"]  { padding-bottom: 1rem; }
.hp-community-card[data-open="false"] { padding-bottom: 0.3rem !important; }

@media (max-width: 1000px) { .hp-community-grid { --hp-cols: 2; } }
@media (max-width: 540px)  { .hp-community-grid { --hp-cols: 1; } }

/* Colored pill button */
.hp-card-cta-bar {
  display: block; width: 100%; box-sizing: border-box;
  border-radius: 12px; padding: 0.7rem 0.9rem; margin: 0 0 0.75rem;
  border: 1px solid rgba(0,0,0,0.08);
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-weight: 700; font-size: 0.82rem; line-height: 1.2;
  letter-spacing: 0.14em; text-transform: uppercase; text-align: center;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
}
.hp-card-cta-bar:hover { transform: translateY(-1px); box-shadow: 0 2px 10px rgba(0,0,0,0.12); }
.hp-card-cta-bar--pink   { background: #F23359; color: #f2f2f2; }
.hp-card-cta-bar--purple { background: #6C00AF; color: #f2f2f2; }
.hp-card-cta-bar--green  { background: #2FA873; color: #f2f2f2; }
.hp-card-cta-bar--yellow { background: #D9A919; color: #241123; }
.hp-card-cta-bar--pink:hover   { background: rgba(164,2,35,0.92); }
.hp-card-cta-bar--purple:hover { background: rgba(62,0,101,0.92); }
.hp-card-cta-bar--green:hover  { background: rgba(13,111,68,0.92); }
.hp-card-cta-bar--yellow:hover { background: rgba(187,141,3,0.92); }

/* Description */
.hp-card-desc {
  margin: 0.3rem 0 0.1rem;
  font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
  color: #241123; font-size: 0.95rem; line-height: 1.5; text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hp-card-desc[data-open="true"] {
  display: block;
  -webkit-line-clamp: unset;
  -webkit-box-orient: unset;
  overflow: visible;
}

/* Chevron */
.hp-chev-toggle {
  align-self: flex-end;
  margin: 0.15rem -6px 0 0;
  padding: 0;
  background: transparent; border: none; cursor: pointer;
}
.hp-chev-toggle svg {
  width: 30px; height: 30px; display: block;
  opacity: 0.7; transition: transform 0.2s ease, opacity 0.2s ease;
}
.hp-chev-toggle path {
  fill: none; stroke: #241123;
  stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round;
}
.hp-chev-toggle:hover svg { opacity: 1; }
.hp-chev-toggle[aria-expanded="true"] svg { transform: rotate(180deg); }

.hp-community-card[data-open="true"] .hp-chev-toggle {
  position: absolute; right: 12px; bottom: 6px; padding-left: 28px;
}
.hp-community-card[data-open="true"] .hp-mini-buttons-row {
  padding-right: 36px; padding-bottom: 0.75px; margin-bottom: 0;
}

/* Animated reveal */
.hp-reveal-wrap {
  max-height: 0; overflow: hidden;
  transition: max-height 280ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .hp-reveal-wrap { transition: none; }
  .hp-chev-toggle svg { transition: none; }
}

/* Mini link buttons */
.hp-mini-buttons-row {
  margin-top: 0.75rem; display: flex; gap: 0.6rem;
  flex-wrap: wrap; justify-content: flex-start;
}
.hp-mini-btn {
  display: inline-flex; align-items: center; justify-content: flex-start;
  padding: 0.55rem 0.9rem;
  border-radius: 12px; border: 1px solid transparent; background: transparent;
  cursor: pointer;
  font-family: var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif;
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em;
  font-size: 0.7rem; line-height: 1.1;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, transform 120ms ease;
}
.hp-mini-btn span { text-align: left; }
.hp-mini-btn--pink   { color: rgba(168,2,35,1);  background: rgba(242,51,89,0.18);   border-color: rgba(242,51,89,1); }
.hp-mini-btn--purple { color: rgba(80,0,130,1);  background: rgba(108,0,175,0.18);   border-color: rgba(108,0,175,1); }
.hp-mini-btn--green  { color: rgba(3,37,22,1);   background: rgba(47,168,115,0.26);  border-color: rgba(26,209,130,1); }
.hp-mini-btn--yellow { color: rgba(52,39,0,1);   background: rgba(217,169,25,0.30);  border-color: rgba(243,183,5,1); }
.hp-mini-btn:hover { transform: translateY(-0.5px); color: #fff; }
.hp-mini-btn--pink:hover   { background: rgba(231,44,81,0.60);  border-color: rgba(242,51,89,1); }
.hp-mini-btn--purple:hover { background: rgba(97,2,156,0.60);   border-color: rgba(108,0,175,1); }
.hp-mini-btn--green:hover  { background: rgba(47,168,115,0.66); border-color: rgba(26,209,130,1); }
.hp-mini-btn--yellow:hover { background: rgba(217,169,25,0.86); border-color: rgba(243,183,5,1); }

/* ══════════════════════════════════════════════════════════
   EVENTS STRIP — dark theatrical band, up to 3 cards
══════════════════════════════════════════════════════════ */
.hp-events-section {
  position: relative;
  background: #0d0a14;
  padding: 4rem 2rem 4.5rem;
  overflow: hidden;
}
.hp-events-stage-texture {
  position: absolute;
  inset: 0;
  background: url("/images/theatre/esmeraldas_dumbshow.webp") center 30% / cover no-repeat;
  opacity: 0.07;
  z-index: 0;
}
.hp-events-inner {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}
.hp-events-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}
.hp-events-title {
  font-family: "Anton", sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 400;
  color: #fff;
  margin: 0.4rem 0 0;
  line-height: 1;
}
.hp-events-see-all {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,204,0,0.7) !important;
  white-space: nowrap;
  transition: color 0.18s;
  padding-bottom: 0.25rem;
}
.hp-events-see-all:hover { color: #FFCC00 !important; }

/* Card grid — 2 cards at ~50% viewport */
.hp-events-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}
@media (max-width: 640px) {
  .hp-events-grid { grid-template-columns: 1fr; }
}

/* Individual event card */
.hp-event-card-wrap {
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.hp-event-card-wrap:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.4);
  border-color: rgba(255,255,255,0.14);
}
.hp-event-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(255,255,255,0.04);
  text-decoration: none !important;
  color: #fff;
  flex: 1;
  min-height: 220px;
  border-radius: 0;
  border: none;
}
.hp-event-card-img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-color: #1a0f22;
}
.hp-event-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10,5,18,0.35) 0%,
    rgba(10,5,18,0.72) 60%,
    rgba(10,5,18,0.93) 100%
  );
}
.hp-event-card-body {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  padding: 1.1rem 1.1rem 0.9rem;
  flex: 1;
}
.hp-event-date-badge {
  flex-shrink: 0;
  width: 44px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.35rem 0.2rem;
  line-height: 1;
}
.hp-event-badge-day {
  font-family: "Anton", sans-serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: #fff;
  display: block;
}
.hp-event-badge-mo {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.85);
  display: block;
  margin-top: 1px;
}
.hp-event-card-text { flex: 1; min-width: 0; }
.hp-event-cat-label {
  display: block;
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}
.hp-event-card-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.2rem;
  line-height: 1.3;
}
.hp-event-card-venue {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.55);
  margin: 0;
}
.hp-event-card-dates {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.4);
  margin: 0.2rem 0 0;
}

/* Ticket info bar at bottom of card */
.hp-event-card-ticket-bar {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1.1rem;
  border-top: 1px solid;
  border-top-color: rgba(255,255,255,0.12);
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 0.75rem;
}
.hp-event-ticket-cta {
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.7);
}
.hp-event-ticket-cta--link {
  text-decoration: none;
  color: rgba(255,255,255,0.7);
  transition: color 0.18s ease;
}
.hp-event-card-wrap:hover .hp-event-ticket-cta { color: #fff; }
.hp-event-card-wrap:hover .hp-event-ticket-cta--link { color: #fff; }

/* ══════════════════════════════════════════════════════════
   STORY MAP TEASER — teal band with globe illustration
══════════════════════════════════════════════════════════ */

/* Section is the positioning context for the absolute image */
.hp-smt-section {
  position: relative;
  background: #2493A9;
  overflow: hidden;
  min-height: 420px;
}

/* Image: always pinned to bottom-left of the section */
.hp-smt-img-col {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 44%;
  max-width: 500px;
  z-index: 0;
  pointer-events: none;
}
.hp-smt-img {
  width: 100%;
  height: auto;
  display: block;
}

/* Inner wrapper: centers text and keeps it above the image */
.hp-smt-inner {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 420px;
  display: flex;
  align-items: center;
}

/* Text column: pushed into the right ~58% on desktop */
.hp-smt-text-col {
  margin-left: auto;
  width: 58%;
  padding: 3.5rem 3rem 3.5rem 2.5rem;
}

/* Eyebrow: "Celebrating" */
.hp-smt-eyebrow {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: clamp(0.95rem, 1.6vw, 1.25rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #174f5c;
  margin: 0 0 0.1rem;
}

/* "20 YEARS" headline — cream letters with a slow specular gold glint that
   sweeps across once, then the word rests before the next pass. */
.hp-smt-years {
  font-family: "Anton", sans-serif !important;
  font-size: clamp(4rem, 10vw, 8.5rem);
  line-height: 0.9;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  color: #f6e4c1;
  background-image: linear-gradient(
    100deg,
    #f6e4c1 0%, #f6e4c1 40%,
    #ffeec2 50%,
    #f6e4c1 60%, #f6e4c1 100%
  );
  background-size: 200% 100%;
  background-position: 0% 50%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: hp-smt-shimmer 7s ease-in-out infinite alternate;
}
@keyframes hp-smt-shimmer {
  0%   { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .hp-smt-years { animation: none; }
}

/* Subtitle */
.hp-smt-subtitle {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: clamp(0.78rem, 1.4vw, 1rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #174f5c;
  margin: 0.45rem 0 1.5rem;
}

/* Body copy */
.hp-smt-body {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: clamp(0.88rem, 1.3vw, 1rem);
  line-height: 1.65;
  color: rgba(255,255,255,0.9);
  margin: 0 0 0.85rem;
  max-width: 480px;
}
.hp-smt-body:last-of-type { margin-bottom: 0; }

/* Button row */
.hp-smt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.75rem;
}
.hp-smt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.9rem 2rem;
  border-radius: 10px;
  border: none;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  cursor: pointer;
  text-decoration: none !important;
  box-shadow: 0 4px 18px rgba(0,0,0,0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  white-space: nowrap;
}
.hp-smt-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.28);
}
.hp-smt-btn--pink   { background: #F23359; color: #fff; }
.hp-smt-btn--purple { background: #6C00AF; color: #fff; }

/* ── Small tablet (581–900px) ──────────────────────────────────────────
   Text spans full width from the top. Buttons are pushed down and to the
   right of the globe via margin-top:auto + padding-left equal to the
   globe's capped width — copy never touches the illustration.
─────────────────────────────────────────────────────────────────────── */
/* ── Small tablet (581–900px) ──────────────────────────────────────────
   Globe: quarter bleeds off the left edge, freeing space for text.
   Text column sits to the right of the visible ~75% of the globe.
─────────────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .hp-smt-inner { min-height: 0; align-items: flex-start; }
  .hp-smt-img-col {
    width: 48%;
    max-width: 320px;
    transform: translateX(-25%); /* 1/4 bleeds off left edge */
  }
  .hp-smt-text-col {
    /* visible globe ≈ 48% × 75% = 36% — sit just past that */
    margin-left: 34%;
    width: 66%;
    padding: 2.5rem 2rem 160px 1.5rem;
  }
  .hp-smt-eyebrow  { font-size: clamp(0.9rem, 2vw, 1.4rem); }
  .hp-smt-years    { font-size: clamp(4rem, 10vw, 7rem); }
  .hp-smt-subtitle { font-size: clamp(0.8rem, 1.6vw, 1.1rem); }
  .hp-smt-body     { max-width: 100%; margin-bottom: 1rem; }
  .hp-smt-body:last-of-type { margin-bottom: 1.25rem; }
  .hp-smt-actions  { margin-top: 1.5rem; flex-wrap: wrap; }
}

/* ── Mobile (≤580px) ───────────────────────────────────────────────────
   Copy and buttons stack full-width above the globe.
   Globe stays bottom-left with the same quarter-bleed.
─────────────────────────────────────────────────────────────────────── */
@media (max-width: 580px) {
  .hp-smt-img-col {
    width: 65%;
    max-width: 260px;
    transform: translateX(-25%);
  }
  .hp-smt-text-col {
    margin-left: 0;
    width: 100%;
    /* padding-bottom clears the globe (≈126px tall at 260px wide) */
    padding: 1.75rem 1.25rem 140px;
  }
  .hp-smt-eyebrow  { font-size: 0.85rem; }
  .hp-smt-years    { font-size: clamp(3.5rem, 12vw, 5rem); }
  .hp-smt-subtitle { font-size: 0.8rem; }
  .hp-smt-body     { max-width: 100%; margin-bottom: 0.85rem; font-size: 0.88rem; }
  .hp-smt-body:last-of-type { margin-bottom: 1rem; }
  .hp-smt-actions  { margin-top: 1rem; flex-direction: column; }
  .hp-smt-btn      { width: 100%; justify-content: center; }
}

/* ══════════════════════════════════════════════════════════
   DRAMA CLUB — ghost "Sponsor this Club" button
══════════════════════════════════════════════════════════ */
.hp-club-btn--ghost {
  background: transparent;
  color: #fff;
  border: 2px solid rgba(255,255,255,0.85);
  box-shadow: none;
  padding: 0.6rem 1.3rem;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
}
.hp-club-btn--ghost:hover {
  background: rgba(255,255,255,0.12);
  border-color: #fff;
  transform: translateY(-1px);
}

/* ══════════════════════════════════════════════════════════
   WHAT'S ON — compact editorial preview on a dark band
══════════════════════════════════════════════════════════ */
.hp-whatson-section {
  position: relative;
  background: #0d0812;
  padding: 1.75rem 0 4rem;
  overflow: hidden;
}
.hp-whatson-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; position: relative; z-index: 1; }
.hp-whatson-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.6rem;
}
.hp-whatson-title {
  font-family: "Anton", sans-serif;
  font-size: clamp(2rem, 4.5vw, 3.2rem);
  font-weight: 400;
  color: #fff;
  margin: 0.4rem 0 0;
  line-height: 1;
  text-transform: uppercase;
}

/* What's On — expanding poster panels. The active event fills to full poster
   width; hovering another event expands it in place (no reordering, no flicker).
   Echoes the /alumni profile photo gallery's hover-to-reveal feel. */
.hp-whatson-panels {
  display: flex;
  /* gap:0 so there is no dead-zone between panels — sweeping across never lands
     in an un-hovered gap, which is what made the expand jitter. Cards keep their
     own rounded corners + shadow, so they still read as separate posters. */
  gap: 0;
  height: clamp(360px, 46vw, 520px);
}
.hp-whatson-panel {
  flex: 1 1 0;
  min-width: 0;
  padding: 0 4px;
  /* No overflow:hidden — it would clip the poster's hover ring + glow (the card
     clips its own image via .ep-clip), so the /events border/glow shows here too. */
  transition: flex-grow 0.45s cubic-bezier(.2,.7,.2,1),
              flex-basis 0.45s cubic-bezier(.2,.7,.2,1);
}
/* Pure-CSS expand (no JS = no re-render jitter). We animate a FIXED poster width
   (flex-basis) rather than flex-grow + max-width — the latter overshoots wide and
   then snaps back. The expanded panel never grows past its poster width, the
   collapsed ones absorb the rest. Default = upcoming event; hover swaps it. */
.hp-whatson-panels:not(:hover) .hp-whatson-panel:first-child,
.hp-whatson-panel:hover {
  flex: 0 0 clamp(248px, 31vw, 355px);
}
/* Each poster card fills its panel */
.hp-whatson-panel .ep--card {
  min-height: 0;
  height: 100%;
  width: 100%;
  border-radius: 14px;
}
/* Keep titles from spilling out of the narrow (collapsed) posters */
.hp-whatson-panel .ep-body { overflow: hidden; }

/* Centered "view all" pill — mirrors the gallery's show-all control */
.hp-whatson-gallery-foot { text-align: center; margin-top: 1.6rem; }
.hp-whatson-viewall {
  display: inline-block;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 24px;
  padding: 0.6rem 1.7rem;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.74rem; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: rgba(255,204,0,0.82) !important;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.hp-whatson-viewall:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,204,0,0.4);
  color: #FFCC00 !important;
}
/* Mobile: show only the upcoming poster */
/* Progressive density: drop one event at a time as the viewport narrows… */
@media (max-width: 1100px) { .hp-whatson-panel:nth-child(n+5) { display: none; } }
@media (max-width: 900px)  { .hp-whatson-panel:nth-child(n+4) { display: none; } }
@media (max-width: 720px)  { .hp-whatson-panel:nth-child(n+3) { display: none; } }
/* …down to a single upcoming poster at iPhone width */
@media (max-width: 480px) {
  .hp-whatson-panels { height: auto; }
  .hp-whatson-panel { display: none; }
  .hp-whatson-panel:first-child {
    display: block;
    flex: none !important;
    width: 100%;
    max-width: 360px;
    margin: 0 auto;
    padding: 0;
    aspect-ratio: 2 / 3;
  }
}

/* ══════════════════════════════════════════════════════════
   FROM THE FIELD — editorial stories (eggplant)
══════════════════════════════════════════════════════════ */
.hp-field-section {
  background: #f6e4c1;
  padding: 3.5rem 0 4rem;
  position: relative;
  z-index: 2;
  box-shadow: 0 18px 30px -22px rgba(36, 17, 35, 0.35);
}
/* From the Field eyebrow — ink on the gold band */
.hp-eyebrow-fieldink { color: #241123 !important; }
.hp-field-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
.hp-field-header { margin-bottom: 1.9rem; }
.hp-field-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif !important;
  font-weight: 700;
  font-size: clamp(1.6rem, 3.4vw, 2.6rem);
  color: #241123;
  margin: 0.4rem 0 0;
  line-height: 1.08;
  max-width: 760px;
}
.hp-field-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.6rem;
}
@media (max-width: 760px) { .hp-field-grid { grid-template-columns: 1fr; } }

/* Featured story */
.hp-field-feature {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  min-height: 420px;
  display: flex;
  align-items: flex-end;
}
.hp-field-feature-img { position: absolute; inset: 0; }
.hp-field-feature-img .hp-story-img,
.hp-field-feature-img .hp-story-video-placeholder,
.hp-field-feature-img .hp-story-img-placeholder {
  width: 100%; height: 100%; object-fit: cover;
}
.hp-field-feature-scrim {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(16,7,24,0.92), rgba(16,7,24,0) 70%);
}
.hp-field-feature-body { position: relative; z-index: 1; padding: 2rem; }
.hp-field-feature-eyebrow {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.66rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.18em;
  color: #FFCC00; display: block; margin-bottom: 0.5rem;
}
.hp-field-feature-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif !important;
  font-weight: 700; font-size: clamp(1.5rem, 3vw, 2rem);
  color: #fff; margin: 0 0 0.4rem; line-height: 1.15;
}
.hp-field-feature-author {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  color: rgba(255,255,255,0.78); font-style: italic; margin: 0;
}

/* Story list */
.hp-field-list { display: flex; flex-direction: column; gap: 1.4rem; }
.hp-field-list-item { display: flex; gap: 1rem; align-items: center; }
.hp-field-list-thumb {
  position: relative;
  width: 120px; height: 80px; flex-shrink: 0;
  border-radius: 10px; overflow: hidden; background: rgba(255,255,255,0.06);
}
.hp-field-list-thumb .hp-story-img,
.hp-field-list-thumb .hp-story-video-placeholder,
.hp-field-list-thumb .hp-story-img-placeholder {
  width: 100%; height: 100%; object-fit: cover;
}
.hp-field-list-loc {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.58rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.16em;
  color: #185b68; display: block; margin-bottom: 0.2rem;
}
.hp-field-list-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-weight: 700; color: #241123; font-size: 1.05rem; margin: 0; line-height: 1.25;
}
.hp-field-explore-link {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  color: #241123 !important; font-weight: 700; font-size: 0.9rem;
  margin-top: auto;
}
.hp-field-explore-link:hover { color: #6C00AF !important; }

/* Equal feature cards for 1–3 stories (avoids a lonely featured + gap) */
.hp-field-cards {
  display: grid;
  gap: 1.6rem;
}
.hp-field-cards[data-count="1"] {
  grid-template-columns: 1fr;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}
.hp-field-cards[data-count="2"] { grid-template-columns: repeat(2, 1fr); }
.hp-field-cards[data-count="3"] { grid-template-columns: repeat(3, 1fr); }
.hp-field-card { min-height: 360px; }
.hp-field-cards-footer { margin-top: 1.4rem; }
@media (max-width: 760px) {
  .hp-field-cards[data-count="2"],
  .hp-field-cards[data-count="3"] { grid-template-columns: 1fr; }
}

/* Editorial dispatch — single story: photo beside an excerpt + CTA */
.hp-dispatch {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: clamp(1.4rem, 3vw, 2.6rem);
  align-items: center;
  max-width: 980px;
  margin: 0 auto;
}
@media (max-width: 760px) { .hp-dispatch { grid-template-columns: 1fr; } }
.hp-dispatch-media {
  position: relative; display: block;
  border-radius: 16px; overflow: hidden;
  aspect-ratio: 4 / 3;
  background: rgba(36,17,35,0.06);
  box-shadow: 0 18px 40px -18px rgba(36,17,35,0.5);
}
.hp-dispatch-media .hp-story-img,
.hp-dispatch-media .hp-story-video-placeholder,
.hp-dispatch-media .hp-story-img-placeholder {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.5s ease;
}
.hp-dispatch-media:hover .hp-story-img { transform: scale(1.04); }
.hp-dispatch-body { min-width: 0; }
.hp-dispatch-loc {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.66rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.18em;
  color: #9e7900; display: block; margin-bottom: 0.6rem;
}
.hp-dispatch-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-weight: 700; font-size: clamp(1.5rem, 3vw, 2.2rem);
  color: #241123; margin: 0 0 0.9rem; line-height: 1.12;
}
.hp-dispatch-excerpt {
  position: relative;
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-size: 1.02rem; line-height: 1.7; color: rgba(36,17,35,0.78);
  margin: 0 0 1rem; padding-left: 1rem;
  border-left: 3px solid #D9A919;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}
.hp-dispatch-author {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  font-style: italic; color: rgba(36,17,35,0.6); margin: 0 0 1.4rem;
}
.hp-dispatch-author-link {
  color: #241123 !important; font-weight: 600;
  transition: color 0.18s ease;
}
.hp-dispatch-author-link:hover {
  color: #6C00AF !important;
}
.hp-dispatch-cta {
  display: inline-block;
  background: #241123; color: #f6e4c1 !important;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-weight: 700; font-size: 0.78rem;
  text-transform: uppercase; letter-spacing: 0.14em;
  padding: 0.8rem 1.6rem; border-radius: 10px;
  transition: transform 0.18s ease, background 0.18s ease;
}
.hp-dispatch-cta:hover { transform: translateY(-2px); background: #3a1f38; }

/* More dispatches — compact thumbnail row beneath the dispatch */
.hp-dispatch-more { max-width: 980px; margin: 2.4rem auto 0; }
.hp-dispatch-more-head {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap;
  border-top: 1px solid rgba(36,17,35,0.16); padding-top: 1.2rem; margin-bottom: 1.1rem;
}
.hp-dispatch-more-label {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.66rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.2em; color: #9e7900;
}
.hp-dispatch-more-all {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.78rem; font-weight: 700; color: #241123 !important;
}
.hp-dispatch-more-all:hover { color: #6C00AF !important; }
.hp-dispatch-more-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.hp-dispatch-thumb { display: block; }
.hp-dispatch-thumb-img {
  position: relative; aspect-ratio: 4 / 3;
  border-radius: 10px; overflow: hidden;
  background: rgba(36,17,35,0.06); margin-bottom: 0.5rem;
}
.hp-dispatch-thumb-img .hp-story-img,
.hp-dispatch-thumb-img .hp-story-video-placeholder,
.hp-dispatch-thumb-img .hp-story-img-placeholder {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.4s ease;
}
.hp-dispatch-thumb:hover .hp-dispatch-thumb-img .hp-story-img { transform: scale(1.05); }
.hp-dispatch-thumb-loc {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.56rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.14em; color: #185b68; display: block; margin-bottom: 0.15rem;
}
.hp-dispatch-thumb-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-weight: 700; font-size: 0.92rem; color: #241123; line-height: 1.2; display: block;
}

/* ══════════════════════════════════════════════════════════
   FROM THE ARCHIVES — clean poster, dark
══════════════════════════════════════════════════════════ */
.hp-arch-section { background: #0d0812; padding: 3.5rem 0 1.75rem; }
.hp-arch-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
.hp-arch-section-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif !important;
  font-weight: 700; font-size: clamp(1.6rem, 3.4vw, 2.6rem);
  color: #fff; margin: 0.4rem 0 0; line-height: 1.08;
}
.hp-arch-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 3rem;
  align-items: center;
}
@media (max-width: 760px) { .hp-arch-grid { grid-template-columns: 1fr; } }
.hp-arch-poster-wrap {
  display: block; width: 100%; padding: 0; border: none;
  background: transparent; cursor: pointer;
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 24px 60px rgba(0,0,0,0.6);
  transition: box-shadow 0.3s ease;
}
@media (max-width: 760px) {
  .hp-arch-poster-wrap { max-width: 320px; margin: 0 auto; }
}
/* Hover: gold glow + image zoom, like the What's On posters — but the frame
   itself does not change size (overflow clips the zoom). */
.hp-arch-poster-wrap:hover {
  box-shadow: 0 0 0 1.5px rgba(255,204,0,0.7),
              0 0 46px 6px rgba(255,204,0,0.45),
              0 24px 60px rgba(0,0,0,0.55);
}
.hp-arch-poster { width: 100%; height: auto; display: block; transition: transform 0.5s ease; }
.hp-arch-poster-wrap:hover .hp-arch-poster { transform: scale(1.05); }
.hp-arch-prod-label {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.22em;
  color: rgba(255,204,0,0.78);
  margin: 0 0 0.6rem;
}
.hp-arch-headline {
  font-family: "Anton", sans-serif !important;
  color: #FFCC00;
  font-size: clamp(2rem, 5vw, 3.6rem);
  line-height: 1.02;
  margin: 0 0 0.7rem;
  text-transform: uppercase;
}
.hp-arch-meta {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  color: rgba(246,228,193,0.78);
  font-size: 1rem;
  border-left: 3px solid rgba(255,204,0,0.35);
  padding-left: 1rem;
  margin: 0 0 1.5rem;
}
.hp-arch-actions { display: flex; gap: 1.4rem; align-items: center; flex-wrap: wrap; }
.hp-arch-btn {
  display: inline-flex; align-items: center;
  background: #FFCC00; color: #241123;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-weight: 800; font-size: 0.9rem;
  text-transform: uppercase; letter-spacing: 0.18em;
  padding: 0.95rem 2.1rem; border: none; border-radius: 11px; cursor: pointer;
  box-shadow: 0 6px 24px rgba(255,204,0,0.25);
  transition: background 0.18s ease, transform 0.18s ease;
}
.hp-arch-btn:hover { background: #ffe640; transform: translateY(-2px); }
.hp-arch-alt-link {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  color: rgba(246,228,193,0.55) !important; font-weight: 600; font-size: 0.9rem;
  transition: color 0.18s ease;
}
.hp-arch-alt-link:hover { color: rgba(246,228,193,0.9) !important; }

/* ══════════════════════════════════════════════════════════
   STEP IN — engage zone (kraft)
══════════════════════════════════════════════════════════ */
.hp-engage-section { background: transparent; padding: 3.5rem 0 4rem; }

/* Stat bar — mirrors the /theatre stats block, anchored above Step In */
.hp-statbar { margin-bottom: 2.6rem; }
.hp-statbar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  background-color: rgba(36, 17, 35, 0.16);
  border-radius: 18px;
  border: 1px solid rgba(36,17,35,0.22);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(36, 17, 35, 0.18);
}
.hp-statbar-cell {
  padding: 1.75rem 2rem;
  text-align: center;
  border-right: 1px solid rgba(36,17,35,0.12);
}
.hp-statbar-cell:last-child { border-right: none; }
.hp-statbar-num {
  font-family: "Anton", system-ui, sans-serif;
  font-size: clamp(2.8rem, 6vw, 4rem);
  color: #FFCC00; line-height: 1; margin-bottom: 0.35rem;
}
.hp-statbar-label {
  font-family: var(--font-space-grotesk), system-ui, sans-serif;
  font-size: 0.95rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #f2f2f2;
}
.hp-statbar-sub {
  font-family: var(--font-dm-sans), system-ui, sans-serif;
  font-size: 0.78rem; font-weight: 500;
  color: rgba(242,242,242,0.62); margin-top: 0.25rem; line-height: 1.4;
}
.hp-engage-inner { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
.hp-engage-header { margin-bottom: 1.9rem; }
.hp-engage-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif !important;
  font-weight: 700; font-size: clamp(1.6rem, 3.4vw, 2.6rem);
  color: #241123; margin: 0.4rem 0 0; line-height: 1.08;
}
.hp-engage-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.4rem;
}
@media (max-width: 760px) { .hp-engage-grid { grid-template-columns: 1fr; } }

.hp-engage-eyebrow {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-size: 0.62rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.22em;
  display: block;
}
.hp-engage-eyebrow--gold { color: #FFCC00; }
.hp-engage-eyebrow--teal { color: #1a7a8f; }
.hp-engage-eyebrow--goldlabel { color: #9e7900; }

/* Shared card image-reveal mechanics */
.hp-engage-card { position: relative; overflow: hidden; }
.hp-engage-card-bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  opacity: 0; transform: scale(1.07);
  transition: opacity 0.6s ease, transform 0.6s ease;
  z-index: 0;
}
.hp-engage-card:hover .hp-engage-card-bg { opacity: 1; transform: scale(1); }
.hp-engage-card-scrim {
  position: absolute; inset: 0;
  background: rgba(20,6,22,0.78);
  opacity: 0; transition: opacity 0.5s ease;
  z-index: 1; pointer-events: none;
}
.hp-engage-card:hover .hp-engage-card-scrim { opacity: 1; }

/* Primary (artist) card — never resizes */
.hp-engage-primary {
  position: relative;
  border-radius: 16px;
  min-height: 400px;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(135deg, rgba(36,17,35,1), rgba(36,17,35,0.86));
  transition: transform 0.2s ease;
}
.hp-engage-primary:hover { transform: translateY(-3px); }

/* Primary card is image-forward: at rest the image shows under a dark gradient so
   the copy reads; on hover the copy fades out, the image brightens and takes over,
   and the (now pulsing) button is the only thing that stays. */
.hp-engage-primary .hp-engage-card-bg { opacity: 1; transform: scale(1); }
.hp-engage-primary:hover .hp-engage-card-bg { transform: scale(1.05); }
.hp-engage-primary .hp-engage-card-scrim {
  opacity: 1;
  background: linear-gradient(to top,
    rgba(20,6,22,0.92) 0%, rgba(20,6,22,0.6) 45%, rgba(20,6,22,0.3) 100%);
}
.hp-engage-primary:hover .hp-engage-card-scrim { opacity: 0; }
.hp-engage-primary .hp-engage-eyebrow,
.hp-engage-primary-title,
.hp-engage-primary-p { transition: opacity 0.35s ease; }
.hp-engage-primary:hover .hp-engage-eyebrow,
.hp-engage-primary:hover .hp-engage-primary-title,
.hp-engage-primary:hover .hp-engage-primary-p { opacity: 0; }
.hp-engage-primary:hover .hp-engage-primary-btn {
  animation: hp-engage-pulse 1.5s ease-in-out infinite;
}
@keyframes hp-engage-pulse {
  0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(242,51,89,0.55); }
  50%      { transform: scale(1.06); box-shadow: 0 0 0 12px rgba(242,51,89,0); }
}
@media (prefers-reduced-motion: reduce) {
  .hp-engage-primary:hover .hp-engage-primary-btn { animation: none; }
}

.hp-engage-primary-body { position: relative; z-index: 2; padding: 2.2rem; }
.hp-engage-primary-title {
  font-family: "Anton", sans-serif !important;
  color: #fff; font-size: clamp(2.2rem, 4.5vw, 3.4rem);
  line-height: 1; margin: 0.4rem 0 0.6rem; text-transform: uppercase;
}
.hp-engage-primary-p {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  color: rgba(255,255,255,0.85); max-width: 520px; line-height: 1.6; margin: 0 0 1.4rem;
}
.hp-engage-primary-btn {
  display: inline-flex; align-items: center;
  background: #F23359; color: #fff;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-weight: 700; font-size: 0.82rem;
  text-transform: uppercase; letter-spacing: 0.16em;
  padding: 1rem 2rem; border-radius: 10px; border: none; cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease;
}
.hp-engage-primary-btn:hover { transform: translateY(-2px); background: #ff486c; }

/* Secondary column */
.hp-engage-right {
  display: flex; flex-direction: column; gap: 1.2rem; min-height: 400px;
}
.hp-engage-sec {
  background: #EADCC1;
  border-radius: 12px;
  border-left: 5px solid #2493A9;
  flex-grow: 1; flex-basis: 0;
  display: flex; flex-direction: column;
  transition: flex-grow 0.35s ease, box-shadow 0.2s ease;
}
.hp-engage-sec--gold { border-left-color: #D9A919; }
.hp-engage-sec:hover { flex-grow: 2.6; box-shadow: 0 14px 30px rgba(36,17,35,0.26); }
.hp-engage-sec-body { position: relative; z-index: 2; padding: 1.2rem 1.3rem; }
.hp-engage-sec:hover .hp-engage-eyebrow { color: #FFCC00; }
.hp-engage-sec-title {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-weight: 700; font-size: 1.25rem; color: #241123; margin: 0.3rem 0 0;
}
.hp-engage-sec:hover .hp-engage-sec-title { color: #fff; }
.hp-engage-sec-teaser {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  color: rgba(36,17,35,0.6); font-size: 0.82rem; line-height: 1.45; margin-top: 0.3rem;
}
.hp-engage-sec:hover .hp-engage-sec-teaser { color: rgba(255,255,255,0.85); }
.hp-engage-sec-more {
  max-height: 0; opacity: 0; overflow: hidden;
  transition: max-height 0.35s ease, opacity 0.25s ease;
}
.hp-engage-sec:hover .hp-engage-sec-more { max-height: 200px; opacity: 1; margin-top: 0.8rem; }
.hp-engage-sec-more-p {
  font-family: var(--font-dm-sans), "DM Sans", sans-serif;
  color: rgba(255,255,255,0.85); font-size: 0.86rem; line-height: 1.5; margin: 0 0 0.9rem;
}
.hp-engage-sec-btn {
  display: inline-flex; align-items: center;
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-weight: 700; font-size: 0.72rem;
  text-transform: uppercase; letter-spacing: 0.14em;
  padding: 0.6rem 1.1rem; border-radius: 9px; border: none; cursor: pointer;
}
.hp-engage-sec-btn--teal { background: #2493A9; color: #fff; }
.hp-engage-sec-btn--gold { background: #FFCC00; color: #241123; }

/* Divider into More Ways In */
.hp-engage-divider { display: flex; align-items: center; gap: 1rem; margin: 2.8rem 0 1.6rem; }
.hp-engage-divider span {
  font-family: var(--font-space-grotesk), "Space Grotesk", sans-serif;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em;
  font-size: 0.72rem; color: rgba(36,17,35,0.6); white-space: nowrap;
}
.hp-engage-divider::after { content: ""; height: 1px; background: rgba(36,17,35,0.2); flex: 1; }

/* Mobile: secondaries full-size, all content visible */
@media (max-width: 760px) {
  .hp-engage-primary { min-height: 300px; }
  .hp-engage-right { min-height: 0; }
  .hp-engage-sec { flex-grow: 0; }
  .hp-engage-sec-more { max-height: 220px; opacity: 1; margin-top: 0.8rem; }
  .hp-engage-sec-more-p { color: rgba(36,17,35,0.72); }
  .hp-engage-sec-teaser { color: rgba(36,17,35,0.6); }
  .hp-engage-sec-title { color: #241123; }
}

/* ══════════════════════════════════════════════════════════
   SUBSCRIBE — green mailing-list band (cloned from /events)
══════════════════════════════════════════════════════════ */
.eh-container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
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

    </main>
  );
}
