"use client";

// ─────────────────────────────────────────────────────────────────────────────
// DetailViews — the two category-differentiated detail layouts (PROTOTYPE).
//
//   PerformanceDetail — pulls in everything from /theatre/[slug]:
//     credits (creative + cast w/ photos), photo gallery, video embed,
//     community-impact / donate block, accessibility line, ES/EN translation
//     toggle, info card, description, press quotes — on the simplified duotone
//     hero. Calendar + share icon buttons sit in the action row.
//
//   ArchiveDetail — festival & community events. A deliberately DIFFERENT,
//     lighter "dispatch / residency" format that frames the event as part of
//     the DAT archive and routes onward into /projects. No ticket dashboard.
//
// Both reuse the same overlay hero (PosterLayers intensity="hero") and the
// category-colour scrim, so the colour grade is identical to the posters.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  getEventImage,
  formatDateRange,
  type DatEvent,
} from "@/lib/events";
import {
  PosterLayers,
  CalShareButtons,
  CAT,
  PLUM,
  CREAM,
  GRAIN_URL,
  isOnlineEvent,
} from "./EventPoster";

// ── Helpers ──────────────────────────────────────────────────────────────────

function videoEmbed(url?: string): string | undefined {
  if (!url) return undefined;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?title=0&byline=0`;
  return undefined;
}

function BackBar({ onBack, accent }: { onBack: () => void; accent: string }) {
  return (
    <button className="dv-back" onClick={onBack} style={{ ["--dv-accent" as string]: accent }}>
      ← All events
    </button>
  );
}

function RelatedRow({
  related,
  onOpen,
}: {
  related: DatEvent[];
  onOpen: (id: string) => void;
}) {
  if (related.length === 0) return null;
  return (
    <div className="dv-thumbs">
      <span className="dv-thumbs-label">More events</span>
      <div className="dv-thumbs-row">
        {related.map((r) => {
          const rImg = getEventImage(r);
          const rc = CAT[r.category];
          return (
            <button
              key={r.id}
              className="dv-thumb"
              style={{
                ["--dv-accent" as string]: rc.color,
                backgroundImage: rImg ? `url('${rImg}')` : undefined,
                backgroundPosition: r.imageFocus ?? "center",
              }}
              title={r.title}
              aria-label={`View ${r.title}`}
              onClick={() => onOpen(r.id)}
            >
              <span className="dv-thumb-wash" style={{ background: rc.color }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PerformanceDetail
// ─────────────────────────────────────────────────────────────────────────────

export function PerformanceDetail({
  event,
  related,
  onBack,
  onOpen,
}: {
  event: DatEvent;
  related: DatEvent[];
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const cat = CAT[event.category];
  const accent = cat.color;
  const image = getEventImage(event);
  const online = isOnlineEvent(event);

  const hasEs = !!event.translations?.es;
  const [lang, setLang] = useState<"en" | "es">("en");
  const es = event.translations?.es;
  const t = <K extends keyof NonNullable<typeof es>>(key: K, base?: string): string | undefined => {
    if (lang === "es" && es && es[key] != null) return es[key] as string;
    return base;
  };

  const title = t("title", event.title) ?? event.title;
  const subtitle = t("subtitle", event.subtitle);
  const description = t("description", event.description) ?? event.description;
  const longDescription = t("longDescription", event.longDescription);
  const artistNote = t("artistNote", event.artistNote);
  const artistNoteBy = t("artistNoteBy", event.artistNoteBy);
  const impactBlurb = t("impactBlurb", event.impactBlurb);
  const accessibility = t("accessibility", event.accessibility);
  const runtime = t("runtime", event.runtime);
  const language = t("language", event.language);
  const suitability = t("suitability", event.suitability);
  const ticketPrice = t("ticketPrice", event.ticketPrice);
  const videoTitle = t("videoTitle", event.videoTitle);
  const pressQuotes = (lang === "es" && es?.pressQuotes) || event.pressQuotes;
  const credits = (lang === "es" && es?.credits) || event.credits;

  const body = (longDescription ?? description).split("\n").filter(Boolean);
  const creative = (credits ?? []).filter((c) => !c.group || c.group === "creative");
  const cast = (credits ?? []).filter((c) => c.group === "cast");
  const embed = videoEmbed(event.videoUrl);

  const infoRows: { label: string; value?: string }[] = [
    { label: lang === "es" ? "Cuándo" : "When", value: formatDateRange(event.date, event.endDate) },
    { label: lang === "es" ? "Hora" : "Time", value: event.time },
    { label: lang === "es" ? "Dónde" : "Where", value: online ? event.venue : `${event.venue}, ${event.city}` },
    { label: lang === "es" ? "Duración" : "Runtime", value: runtime },
    { label: lang === "es" ? "Idioma" : "Language", value: language },
    { label: lang === "es" ? "Edad" : "Suitability", value: suitability },
    { label: lang === "es" ? "Entradas" : "Tickets", value: ticketPrice },
  ].filter((r) => r.value);

  const ctaLabel =
    event.ticketType === "free"
      ? lang === "es" ? "Reservar gratis" : "Register Free"
      : lang === "es" ? "Comprar entradas" : "Get Tickets";

  return (
    <div className="dv">
      {/* ── Overlay hero ─────────────────────────────────────────────────── */}
      <header className="dv-hero" style={{ ["--dv-accent" as string]: accent }}>
        <PosterLayers image={image} focus={event.imageFocus} category={event.category} intensity="hero" />
        <div className="dv-hero-inner">
          <div className="dv-hero-top">
            <BackBar onBack={onBack} accent={accent} />
            {hasEs && (
              <div className="dv-langtoggle" role="group" aria-label="Language">
                <button className={lang === "es" ? "is-on" : ""} onClick={() => setLang("es")}>ES</button>
                <span>|</span>
                <button className={lang === "en" ? "is-on" : ""} onClick={() => setLang("en")}>EN</button>
              </div>
            )}
          </div>
          <nav className="dv-crumb">
            Events / Performances / <span>{title}</span>
          </nav>
          <span className="dv-eyebrow">{cat.label}{online ? " · Online" : ""}</span>
          <h1 className="dv-title">{title}</h1>
          {subtitle && <p className="dv-subtitle">{subtitle}</p>}
          <p className="dv-when">{formatDateRange(event.date, event.endDate)} — {event.venue}{event.city && event.country !== "Online" ? `, ${event.city}` : ""}</p>
          <div className="dv-hero-actions">
            <CalShareButtons event={event} primaryLabel={ctaLabel} onDetails={() => event.ticketUrl && window.open(event.ticketUrl, "_blank")} />
          </div>
          <RelatedRow related={related} onOpen={onOpen} />
        </div>
      </header>

      {/* ── Info band ────────────────────────────────────────────────────── */}
      <div className="dv-infoband">
        <div className="dv-infoband-inner">
          {infoRows.map((r) => (
            <div key={r.label} className="dv-info">
              <span className="dv-info-label">{r.label}</span>
              <span className="dv-info-value">{r.value}</span>
            </div>
          ))}
        </div>
        {accessibility && (
          <p className="dv-access">
            <span className="dv-access-icon" aria-hidden="true">♿</span> {accessibility}
          </p>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="dv-body">
        <div className="dv-grid">
          <div className="dv-main">
            <span className="dv-sec-eyebrow" style={{ color: accent }}>{lang === "es" ? "Sobre la obra" : "About"}</span>
            {body.map((p, i) => (
              <p key={i} className="dv-para">{p}</p>
            ))}

            {artistNote && (
              <blockquote className="dv-quote" style={{ borderColor: accent }}>
                <p className="dv-quote-text">“{artistNote}”</p>
                {artistNoteBy && <footer className="dv-quote-by">— {artistNoteBy}</footer>}
              </blockquote>
            )}

            {/* Video */}
            {embed && (
              <div className="dv-video-block">
                {videoTitle && <span className="dv-sec-eyebrow" style={{ color: accent }}>{videoTitle}</span>}
                <div className="dv-video">
                  <iframe src={embed} title={videoTitle ?? event.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </div>
            )}

            {/* Gallery */}
            {event.photoGallery && event.photoGallery.length > 0 && (
              <div className="dv-gallery-block">
                <span className="dv-sec-eyebrow" style={{ color: accent }}>{lang === "es" ? "Galería" : "Gallery"}</span>
                <div className="dv-gallery">
                  {event.photoGallery.map((g, i) => (
                    <figure key={i} className="dv-gal-item" style={{ backgroundImage: `url('${g.src}')` }} title={g.alt}>
                      <span className="dv-gal-edge" style={{ boxShadow: `inset 0 0 0 2px ${accent}` }} />
                    </figure>
                  ))}
                </div>
                {event.photoCredit && <p className="dv-gal-credit">📷 {event.photoCredit}</p>}
              </div>
            )}

            {/* Credits */}
            {(creative.length > 0 || cast.length > 0) && (
              <div className="dv-credits">
                {creative.length > 0 && (
                  <>
                    <span className="dv-sec-eyebrow" style={{ color: accent }}>{lang === "es" ? "Equipo creativo" : "Creative Team"}</span>
                    <div className="dv-credit-list">
                      {creative.map((c, i) => (
                        <div key={i} className="dv-credit-row">
                          <span className="dv-credit-role">{c.role}</span>
                          <span className="dv-credit-name">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {cast.length > 0 && (
                  <>
                    <span className="dv-sec-eyebrow dv-sec-eyebrow--gap" style={{ color: accent }}>{lang === "es" ? "Elenco" : "Cast"}</span>
                    <div className="dv-cast">
                      {cast.map((c, i) => (
                        <div key={i} className="dv-cast-card">
                          <span
                            className="dv-cast-photo"
                            style={{
                              backgroundImage: c.photo ? `url('${c.photo}')` : undefined,
                              ["--dv-accent" as string]: accent,
                            }}
                            aria-hidden="true"
                          >
                            {!c.photo && <span className="dv-cast-initial">{c.name.charAt(0)}</span>}
                          </span>
                          <span className="dv-cast-name">{c.name}</span>
                          <span className="dv-cast-role">{c.role}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Press quotes */}
            {pressQuotes && pressQuotes.length > 0 && (
              <div className="dv-press">
                <span className="dv-sec-eyebrow" style={{ color: accent }}>{lang === "es" ? "Prensa" : "Press"}</span>
                {pressQuotes.map((q, i) => (
                  <div key={i} className="dv-press-item">
                    <p className="dv-press-text">“{q.text}”</p>
                    <p className="dv-press-attr">{q.attribution}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aside: info card + impact */}
          <aside className="dv-aside">
            <div className="dv-card" style={{ borderTop: `4px solid ${accent}` }}>
              {infoRows.map((r) => (
                <div key={r.label} className="dv-card-row">
                  <span className="dv-card-label">{r.label}</span>
                  <span className="dv-card-value">{r.value}</span>
                </div>
              ))}
              {event.ticketUrl && (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dv-card-btn"
                  style={{ background: accent, color: cat.onAccent }}
                >
                  {ctaLabel}
                </a>
              )}
            </div>

            {impactBlurb && (
              <div className="dv-impact" style={{ ["--dv-accent" as string]: accent }}>
                <span className="dv-sec-eyebrow" style={{ color: accent }}>{lang === "es" ? "Impacto comunitario" : "Community Impact"}</span>
                <p className="dv-impact-text">{impactBlurb}</p>
                <a href={event.donateLink ?? "/donate"} className="dv-impact-btn" style={{ borderColor: accent, color: accent }}>
                  {lang === "es" ? "Apoyar el trabajo →" : "Support the Work →"}
                </a>
              </div>
            )}
          </aside>
        </div>
      </div>

      <DetailStyles />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ArchiveDetail — festival & community events (the DIFFERENT, lighter format).
//
// Proposed structure (routes into /projects):
//   • Same overlay hero, but framed as a DISPATCH / RESIDENCY rather than a
//     ticketed show — eyebrow shows "Festival · City, Country" or "Community".
//   • A single editorial column: dates + place strip, long description, an
//     artist-note pull quote, an impact/support line.
//   • An "Archive connection" card that links onward to /projects (and the
//     season), making explicit that these events live in the archive, not the
//     ticketing flow.  No heavy ticket dashboard, no cast/gallery scaffolding.
// ─────────────────────────────────────────────────────────────────────────────

export function ArchiveDetail({
  event,
  related,
  onBack,
  onOpen,
}: {
  event: DatEvent;
  related: DatEvent[];
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const cat = CAT[event.category];
  const accent = cat.color;
  const image = getEventImage(event);
  const online = isOnlineEvent(event);
  const kind = event.category === "festival" ? "Festival" : "Community";

  const body = (event.longDescription ?? event.description).split("\n").filter(Boolean);
  const place = online ? event.venue : [event.venue, event.city, event.country].filter(Boolean).join(" · ");

  return (
    <div className="dv">
      <header className="dv-hero dv-hero--archive" style={{ ["--dv-accent" as string]: accent }}>
        <PosterLayers image={image} focus={event.imageFocus} category={event.category} intensity="hero" />
        <div className="dv-hero-inner">
          <BackBar onBack={onBack} accent={accent} />
          <nav className="dv-crumb">
            Events / {kind === "Festival" ? "Festivals" : "Gatherings"} / <span>{event.title}</span>
          </nav>
          <span className="dv-eyebrow">
            {kind} · {online ? "Online" : `${event.city}${event.country && event.country !== "Online" ? ", " + event.country : ""}`}
          </span>
          <h1 className="dv-title">{event.title}</h1>
          {event.subtitle && <p className="dv-subtitle">{event.subtitle}</p>}
          <p className="dv-when">{formatDateRange(event.date, event.endDate)}</p>
          <div className="dv-hero-actions">
            <CalShareButtons
              event={event}
              primaryLabel={event.ticketType === "free" ? "Follow Along" : "Learn More"}
              onDetails={() => event.ticketUrl && window.open(event.ticketUrl, "_blank")}
            />
          </div>
          <RelatedRow related={related} onOpen={onOpen} />
        </div>
      </header>

      <div className="dv-body">
        <div className="dv-grid dv-grid--archive">
          <div className="dv-main">
            <div className="dv-dispatch-strip">
              <div className="dv-dispatch-item">
                <span className="dv-dispatch-label">Dates</span>
                <span className="dv-dispatch-value">{formatDateRange(event.date, event.endDate)}</span>
              </div>
              <div className="dv-dispatch-item">
                <span className="dv-dispatch-label">{online ? "Where" : "Place"}</span>
                <span className="dv-dispatch-value">{place}</span>
              </div>
              {event.ticketPrice && (
                <div className="dv-dispatch-item">
                  <span className="dv-dispatch-label">Access</span>
                  <span className="dv-dispatch-value">{event.ticketPrice}</span>
                </div>
              )}
            </div>

            {body.map((p, i) => (
              <p key={i} className="dv-para">{p}</p>
            ))}

            {event.artistNote && (
              <blockquote className="dv-quote" style={{ borderColor: accent }}>
                <p className="dv-quote-text">“{event.artistNote}”</p>
                {event.artistNoteBy && <footer className="dv-quote-by">— {event.artistNoteBy}</footer>}
              </blockquote>
            )}

            {event.pressQuotes && event.pressQuotes.length > 0 && (
              <div className="dv-press">
                {event.pressQuotes.map((q, i) => (
                  <div key={i} className="dv-press-item">
                    <p className="dv-press-text">“{q.text}”</p>
                    <p className="dv-press-attr">{q.attribution}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="dv-aside">
            {/* Archive connection card — the routing-into-/projects element */}
            <div className="dv-archive-card" style={{ ["--dv-accent" as string]: accent }}>
              <span className="dv-sec-eyebrow" style={{ color: accent }}>In the Archive</span>
              <p className="dv-archive-text">
                {kind === "Festival"
                  ? "This is a working residency on the festival circuit. The partnerships and work scouted here flow into DAT's project archive."
                  : "This community gathering is part of DAT's ongoing project archive — explore the seasons it belongs to."}
              </p>
              <a href="/projects" className="dv-archive-btn" style={{ background: accent, color: cat.onAccent }}>
                Explore the Archive →
              </a>
              {event.ticketUrl && (
                <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="dv-archive-link" style={{ color: accent }}>
                  {event.ticketType === "free" ? "Festival info →" : "Tickets & info →"}
                </a>
              )}
            </div>

            {event.impactBlurb && (
              <div className="dv-impact" style={{ ["--dv-accent" as string]: accent }}>
                <span className="dv-sec-eyebrow" style={{ color: accent }}>Why It Matters</span>
                <p className="dv-impact-text">{event.impactBlurb}</p>
                <a href={event.donateLink ?? "/donate"} className="dv-impact-btn" style={{ borderColor: accent, color: accent }}>
                  Support the Work →
                </a>
              </div>
            )}
          </aside>
        </div>
      </div>

      <DetailStyles />
    </div>
  );
}

// ── Shared detail styles ─────────────────────────────────────────────────────

function DetailStyles() {
  return (
    <style>{`
      .dv { background: transparent; }  /* kraft shows through */

      /* ── Hero ──────────────────────────────────────────────────────────── */
      .dv-hero {
        position: relative; isolation: isolate; overflow: hidden;
        min-height: 74vh; display: flex; align-items: flex-end; background: ${PLUM};
      }
      .dv-hero--archive { min-height: 64vh; }
      .dv-hero .ep-photo, .dv-hero .ep-scrim, .dv-hero .ep-grain { position: absolute; inset: 0; }
      .dv-hero .ep-photo { background-size: cover; }
      .dv-hero .ep-grain { background-image: ${GRAIN_URL}; background-size: 160px 160px; mix-blend-mode: overlay; opacity: 0.1; pointer-events: none; }
      .dv-hero-inner {
        position: relative; z-index: 2; width: 100%; max-width: 1140px; margin: 0 auto;
        padding: clamp(4.5rem, 8vw, 6.5rem) clamp(1.25rem, 5vw, 3.5rem) clamp(2rem, 4vw, 3rem);
        display: flex; flex-direction: column; gap: 0.6rem;
      }
      .dv-hero-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.6rem; }
      .dv-back {
        align-self: flex-start;
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.72rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
        color: ${CREAM}; background: rgba(0,0,0,0.32); border: 1px solid rgba(247,244,239,0.3);
        padding: 0.55rem 1.1rem; border-radius: 50px; cursor: pointer; transition: background 0.2s;
      }
      .dv-back:hover { background: rgba(0,0,0,0.55); }
      .dv-langtoggle {
        display: inline-flex; align-items: center; gap: 0.5rem;
        background: rgba(0,0,0,0.32); border: 1px solid rgba(247,244,239,0.3);
        padding: 0.4rem 0.9rem; border-radius: 50px;
      }
      .dv-langtoggle button {
        background: none; border: none; cursor: pointer;
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.74rem; font-weight: 700; letter-spacing: 0.1em;
        color: rgba(247,244,239,0.55);
      }
      .dv-langtoggle button.is-on { color: ${CREAM}; }
      .dv-langtoggle span { color: rgba(247,244,239,0.4); }
      .dv-crumb {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.7rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
        color: rgba(247,244,239,0.55); margin: 0;
      }
      .dv-crumb span { color: rgba(247,244,239,0.85); }
      .dv-eyebrow {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.72rem; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase;
        color: ${CREAM}; margin-top: 0.4rem;
      }
      .dv-title {
        font-family: var(--font-anton), system-ui, sans-serif; font-weight: 400;
        font-size: clamp(2.6rem, 8vw, 6rem); line-height: 0.86; letter-spacing: 0.01em;
        text-transform: uppercase; color: ${CREAM}; margin: 0.3rem 0 0; text-shadow: 0 3px 24px rgba(0,0,0,0.4);
      }
      .dv-subtitle {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: clamp(0.82rem, 1.4vw, 1rem); font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
        color: rgba(247,244,239,0.85); margin: 0.7rem 0 0;
      }
      .dv-when {
        font-family: var(--font-space-grotesk), system-ui, sans-serif;
        font-size: 0.9rem; font-weight: 600; color: rgba(247,244,239,0.78); margin: 0.6rem 0 0;
      }
      .dv-hero-actions { margin-top: 1.2rem; }
      /* On the dark hero the icon buttons need light hairlines/text */
      .dv-hero-actions .ep-iconbtn { color: ${CREAM}; border-color: rgba(247,244,239,0.4); }
      .dv-hero-actions .ep-iconbtn:hover { color: ${CREAM}; border-color: ${CREAM}; background: rgba(255,255,255,0.08); }

      /* ── Related thumbs ────────────────────────────────────────────────── */
      .dv-thumbs { margin-top: 1.6rem; }
      .dv-thumbs-label {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.62rem; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase;
        color: rgba(247,244,239,0.6);
      }
      .dv-thumbs-row { display: flex; gap: 0.6rem; margin-top: 0.6rem; flex-wrap: wrap; }
      .dv-thumb {
        position: relative; width: 52px; height: 52px; border-radius: 50%; overflow: hidden;
        background-size: cover; background-position: center; border: 2px solid rgba(247,244,239,0.45);
        cursor: pointer; padding: 0; filter: grayscale(1) contrast(1.1);
        transition: transform 0.2s, border-color 0.2s, filter 0.2s;
      }
      .dv-thumb:hover { transform: translateY(-3px) scale(1.06); border-color: var(--dv-accent); filter: grayscale(0.2); }
      .dv-thumb-wash { position: absolute; inset: 0; mix-blend-mode: color; opacity: 0.72; }

      /* ── Info band ─────────────────────────────────────────────────────── */
      .dv-infoband {
        background: rgba(36,17,35,0.05); border-bottom: 1px solid rgba(36,17,35,0.1);
      }
      .dv-infoband-inner {
        max-width: 1140px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 1.5rem 2.5rem;
        padding: 1.4rem clamp(1.25rem, 5vw, 3.5rem) 0.8rem;
      }
      .dv-info { display: flex; flex-direction: column; gap: 0.15rem; }
      .dv-info-label {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.6rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #9a7fa0;
      }
      .dv-info-value { font-family: var(--font-space-grotesk), system-ui, sans-serif; font-size: 0.9rem; color: ${PLUM}; }
      .dv-access {
        max-width: 1140px; margin: 0 auto;
        padding: 0 clamp(1.25rem, 5vw, 3.5rem) 1.2rem;
        font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.78rem; color: #6b4f70;
      }
      .dv-access-icon { margin-right: 0.3rem; }

      /* ── Body ──────────────────────────────────────────────────────────── */
      .dv-body { max-width: 1140px; margin: 0 auto; padding: clamp(2.5rem, 5vw, 4rem) clamp(1.25rem, 5vw, 3.5rem) clamp(3rem, 6vw, 5rem); }
      .dv-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: clamp(2rem, 5vw, 4rem); align-items: start; }
      .dv-grid--archive { grid-template-columns: 1.6fr 1fr; }
      @media (max-width: 760px) { .dv-grid { grid-template-columns: 1fr; } }
      .dv-sec-eyebrow {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.72rem; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase;
        display: block; margin-bottom: 0.9rem;
      }
      .dv-sec-eyebrow--gap { margin-top: 2.2rem; }
      .dv-para {
        font-family: var(--font-space-grotesk), system-ui, sans-serif;
        font-size: 1.05rem; line-height: 1.78; color: ${PLUM}; margin: 0 0 1.1rem;
      }
      .dv-quote { margin: 2rem 0; padding: 0.4rem 0 0.4rem 1.5rem; border-left: 4px solid; }
      .dv-quote-text {
        font-family: var(--font-space-grotesk), system-ui, sans-serif; font-style: italic;
        font-size: 1.3rem; line-height: 1.55; color: ${PLUM}; margin: 0 0 0.6rem;
      }
      .dv-quote-by {
        font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.78rem; font-weight: 700;
        letter-spacing: 0.12em; text-transform: uppercase; color: #7a5e80;
      }

      /* ── Video ─────────────────────────────────────────────────────────── */
      .dv-video-block { margin: 2.5rem 0; }
      .dv-video { position: relative; aspect-ratio: 16 / 9; border-radius: 14px; overflow: hidden; box-shadow: 0 14px 40px rgba(36,17,35,0.18); }
      .dv-video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }

      /* ── Gallery ───────────────────────────────────────────────────────── */
      .dv-gallery-block { margin: 2.5rem 0; }
      .dv-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
      @media (max-width: 600px) { .dv-gallery { grid-template-columns: repeat(2, 1fr); } }
      .dv-gal-item {
        position: relative; aspect-ratio: 4 / 3; border-radius: 10px; overflow: hidden;
        background-size: cover; background-position: center; transition: transform 0.3s;
      }
      .dv-gal-item:hover { transform: scale(1.02); }
      .dv-gal-edge { position: absolute; inset: 0; border-radius: 10px; opacity: 0; transition: opacity 0.2s; }
      .dv-gal-item:hover .dv-gal-edge { opacity: 1; }
      .dv-gal-credit { font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.72rem; color: #8a6f90; margin: 0.7rem 0 0; }

      /* ── Credits ───────────────────────────────────────────────────────── */
      .dv-credits { margin: 2.6rem 0; }
      .dv-credit-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 2rem; }
      @media (max-width: 540px) { .dv-credit-list { grid-template-columns: 1fr; } }
      .dv-credit-row { display: flex; flex-direction: column; padding: 0.45rem 0; border-bottom: 1px solid rgba(36,17,35,0.08); }
      .dv-credit-role { font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #9a7fa0; }
      .dv-credit-name { font-family: var(--font-space-grotesk), system-ui, sans-serif; font-size: 0.96rem; color: ${PLUM}; }
      .dv-cast { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1.2rem; }
      .dv-cast-card { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.4rem; }
      .dv-cast-photo {
        width: 88px; height: 88px; border-radius: 50%; background-size: cover; background-position: center;
        background-color: ${PLUM}; border: 2px solid var(--dv-accent);
        display: flex; align-items: center; justify-content: center;
        filter: grayscale(0.3);
      }
      .dv-cast-initial { font-family: var(--font-anton), system-ui, sans-serif; font-size: 2rem; color: ${CREAM}; }
      .dv-cast-name { font-family: var(--font-space-grotesk), system-ui, sans-serif; font-size: 0.86rem; font-weight: 700; color: ${PLUM}; }
      .dv-cast-role { font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; color: #8a6f90; }

      /* ── Press ─────────────────────────────────────────────────────────── */
      .dv-press { display: flex; flex-direction: column; gap: 1.5rem; margin: 2.6rem 0 0; }
      .dv-press-text { font-family: var(--font-space-grotesk), system-ui, sans-serif; font-size: 1.05rem; line-height: 1.6; color: ${PLUM}; margin: 0 0 0.4rem; }
      .dv-press-attr { font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #7a5e80; margin: 0; }

      /* ── Aside ─────────────────────────────────────────────────────────── */
      .dv-aside { position: sticky; top: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
      @media (max-width: 760px) { .dv-aside { position: static; } }
      .dv-card { background: rgba(255,255,255,0.78); border-radius: 14px; padding: 1.4rem 1.5rem 1.6rem; box-shadow: 0 2px 10px rgba(36,17,35,0.08), 0 14px 36px rgba(36,17,35,0.08); }
      .dv-card-row { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.65rem 0; border-bottom: 1px solid rgba(36,17,35,0.08); }
      .dv-card-row:last-of-type { border-bottom: none; }
      .dv-card-label { font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #9a7fa0; }
      .dv-card-value { font-family: var(--font-space-grotesk), system-ui, sans-serif; font-size: 0.92rem; color: ${PLUM}; }
      .dv-card-btn {
        display: block; text-align: center; margin-top: 1.1rem;
        font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.8rem; font-weight: 700;
        letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none;
        padding: 0.85rem 1.5rem; border-radius: 10px; transition: opacity 0.2s, transform 0.15s;
      }
      .dv-card-btn:hover { opacity: 0.9; transform: translateY(-1px); }

      .dv-impact, .dv-archive-card { background: rgba(255,255,255,0.6); border-radius: 14px; padding: 1.4rem 1.5rem 1.6rem; border: 1px solid rgba(36,17,35,0.1); }
      .dv-impact-text, .dv-archive-text { font-family: var(--font-space-grotesk), system-ui, sans-serif; font-size: 0.92rem; line-height: 1.65; color: #3a2740; margin: 0 0 1rem; }
      .dv-impact-btn {
        display: inline-block; font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.74rem; font-weight: 700;
        letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 8px; border: 1.5px solid;
        transition: opacity 0.2s;
      }
      .dv-impact-btn:hover { opacity: 0.7; }
      .dv-archive-btn {
        display: block; text-align: center; font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.8rem; font-weight: 700;
        letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; padding: 0.85rem 1.5rem; border-radius: 10px; transition: opacity 0.2s, transform 0.15s;
      }
      .dv-archive-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      .dv-archive-link { display: inline-block; margin-top: 0.85rem; font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.74rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none; }

      /* ── Dispatch strip (archive detail) ───────────────────────────────── */
      .dv-dispatch-strip { display: flex; flex-wrap: wrap; gap: 1.4rem 2.5rem; margin-bottom: 2rem; padding-bottom: 1.4rem; border-bottom: 1px solid rgba(36,17,35,0.12); }
      .dv-dispatch-item { display: flex; flex-direction: column; gap: 0.2rem; }
      .dv-dispatch-label { font-family: var(--font-dm-sans), system-ui, sans-serif; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #9a7fa0; }
      .dv-dispatch-value { font-family: var(--font-space-grotesk), system-ui, sans-serif; font-size: 0.95rem; color: ${PLUM}; }
    `}</style>
  );
}
