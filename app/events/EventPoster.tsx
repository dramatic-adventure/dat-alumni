"use client";

// ─────────────────────────────────────────────────────────────────────────────
// EventPoster — the reusable "duotone EventPoster" treatment  (REVISION 2)
// ─────────────────────────────────────────────────────────────────────────────
//
// PROTOTYPE COMPONENT (route: /events-prototype). Fully isolated from production —
// nothing here is imported by the live /events pages.
//
// WHAT CHANGED FROM REV 1 (the "Corrections"):
//   • The bottom-up legibility scrim is now a DARKER SHADE OF THE EVENT'S OWN
//     CATEGORY COLOUR (not brand plum) — see CAT[].scrim. This is what makes the
//     white Anton headline read as part of a single in-tone colour grade, exactly
//     like the attached candidate-card reference.
//   • The DATE is promoted to a primary element: a high-contrast solid block in
//     the category colour with oversized Anton numerals (.ep-datechip).
//   • Non-featured posters (rail + list) are stripped to the essentials —
//     category label, title, date. No description, no buttons.
//   • The Featured / Next-Up module (FeaturedModule) is the only place with a
//     description, a Details button, and the calendar + share icon buttons.
//
// REV 2.2: no full-image tint at all — the photo stays natural and the category
// colour RISES from the bottom only. PosterLayers is now just:
//
//     1. .ep-photo    the real event photo (getEventImage() + imageFocus), natural
//                     colour, filter: contrast(1.04) saturate(1.05).
//     2. .ep-scrim    ONE bottom-up gradient: dark in-tone shade (CAT[cat].scrim)
//                     at the very bottom for white-text legibility → vivid brand
//                     colour (CAT[cat].vivid) through the mid → transparent by
//                     ~80% so the TOP of the photo is untouched. This is the only
//                     "overlay" — matches the candidate-card reference.
//     3. .ep-grain    tiny inline SVG fractal-noise, mix-blend-mode: overlay, low
//                     opacity — the subtle grain.
//     4. content      oversized Anton title + the category-colour date chip.
//
//   To push more / less colour up the image, move the rgba(vivid,…) stops in
//   PosterLayers (raise the % to lift colour higher; lower the alpha to soften).
// ─────────────────────────────────────────────────────────────────────────────

import {
  getEventImage,
  formatDateRange,
  shortMonth,
  dayOfMonth,
  eventYear,
  type DatEvent,
  type EventCategory,
} from "@/lib/events";

export const PLUM = "#241123";
export const CREAM = "#F7F4EF";

// Per-category brand colour + a darker in-tone scrim + label.
// Colours are fixed, never random (brand rule).
// Per category: brand colour, the brand colour as an rgb tuple (`vivid`, used in
// the mid of the bottom gradient) and a DARKER in-tone shade (`scrim`, used at the
// very bottom so white text stays legible), plus label / on-accent / glow.
export const CAT: Record<
  EventCategory,
  { color: string; vivid: string; scrim: string; onAccent: string; label: string; glow: string }
> = {
  performance: {
    color: "#F23359",
    vivid: "242, 51, 89",
    scrim: "62, 12, 28", // darker shade of #F23359
    onAccent: "#fff",
    label: "Performance",
    glow: "rgba(242,51,89,0.55)",
  },
  festival: {
    color: "#2493A9",
    vivid: "36, 147, 169",
    scrim: "8, 42, 49",
    onAccent: "#fff",
    label: "Festival",
    glow: "rgba(36,147,169,0.55)",
  },
  fundraiser: {
    color: "#D9A919",
    vivid: "217, 169, 25",
    scrim: "52, 38, 6",
    onAccent: "#241123", // gold needs dark text
    label: "Community",
    glow: "rgba(217,169,25,0.5)",
  },
};

/** Inline SVG grain — shared by posters and the detail hero. */
export const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** True if an event is delivered online rather than in a physical room. */
export function isOnlineEvent(e: DatEvent): boolean {
  return (
    e.country === "Online" ||
    /online|zoom|youtube|livestream|worldwide/i.test(`${e.venue} ${e.city}`)
  );
}

/** Human label for an event's city, de-duplicating when city === country. */
export function cityLabel(e: DatEvent): string {
  if (isOnlineEvent(e)) return "Online";
  const city = e.city?.trim() ?? "";
  const country = e.country?.trim() ?? "";
  if (!city) return country;
  if (!country || country === "Online" || city === country) return city;
  return `${city}, ${country}`;
}

/** Google-Calendar "add event" URL (all-day; end date is exclusive). */
export function gcalUrl(e: DatEvent): string {
  const start = e.date.replace(/-/g, "");
  const endBase = new Date((e.endDate ?? e.date) + "T12:00:00Z");
  endBase.setUTCDate(endBase.getUTCDate() + 1); // gcal end is exclusive
  const end = endBase.toISOString().slice(0, 10).replace(/-/g, "");
  const details = encodeURIComponent(e.description ?? "");
  const loc = encodeURIComponent(
    isOnlineEvent(e) ? e.venue : `${e.venue}, ${e.city}${e.country ? ", " + e.country : ""}`
  );
  const text = encodeURIComponent(e.title);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${loc}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PosterLayers — the colour-grade stack. Reused by posters AND the detail hero.
// Render as the FIRST children of any `position:relative; isolation:isolate;
// overflow:hidden` container, then layer content on top.
//
// NOTE: NO full-image tint. The photo keeps its natural colour; the only "overlay"
// is a single bottom-up gradient where the category colour RISES from the bottom
// (dark in-tone shade at the very bottom for white-headline legibility → vivid
// brand colour through the mid → fully transparent by ~80%, so the TOP of the photo
// is untouched). This is the candidate-card look — "colour only at the bottom".
// ─────────────────────────────────────────────────────────────────────────────

export function PosterLayers({
  image,
  focus,
  category,
  intensity = "card",
}: {
  image?: string;
  focus?: string;
  category: EventCategory;
  intensity?: "card" | "hero";
}) {
  const { vivid } = CAT[category];
  // Strongest brand colour sits AT the very bottom edge (0%) and fades straight up
  // to transparent — no dark toe, so the peak colour is the bottom of the card.
  const scrimGradient =
    intensity === "hero"
      ? `linear-gradient(to top, rgba(${vivid},0.72) 0%, rgba(${vivid},0.42) 30%, rgba(${vivid},0.13) 58%, transparent 84%)`
      : `linear-gradient(to top, rgba(${vivid},0.82) 0%, rgba(${vivid},0.52) 27%, rgba(${vivid},0.18) 56%, transparent 82%)`;
  return (
    <>
      <div
        className="ep-photo"
        style={{
          backgroundImage: image ? `url('${image}')` : undefined,
          // Default focal point biased toward the upper-middle, where a person's
          // head usually sits in a photo — keeps faces in frame across poster
          // sizes and on mobile. Any explicit event.imageFocus overrides this.
          backgroundPosition: focus ?? "center 30%",
          filter: "contrast(1.04) saturate(1.05)",
        }}
        aria-hidden="true"
      />
      <div className="ep-scrim" style={{ background: scrimGradient }} aria-hidden="true" />
      <div className="ep-grain" aria-hidden="true" />
    </>
  );
}

/** @deprecated Back-compat alias — use PosterLayers. */
export const DuotoneLayers = PosterLayers;

// ─────────────────────────────────────────────────────────────────────────────
// DateChip — the promoted, high-contrast date element (Anton numerals).
// ─────────────────────────────────────────────────────────────────────────────

export function DateChip({ event, size = "md" }: { event: DatEvent; size?: "sm" | "md" | "lg" }) {
  const { color, onAccent } = CAT[event.category];
  const start = new Date(event.date + "T12:00:00Z");
  const end = event.endDate ? new Date(event.endDate + "T12:00:00Z") : null;
  const sameMonth =
    !!end &&
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();

  // One consistent layout: day on the left, month + year stacked on the right.
  //  • single date           → "24"        JUL / 2026
  //  • same-month range       → "24–26"     JUL / 2026
  //  • cross-month range      → just the start day, so it never reads "30–2".
  const dayText =
    end && sameMonth ? `${dayOfMonth(event.date)}–${dayOfMonth(event.endDate!)}` : dayOfMonth(event.date);

  return (
    <span className={`ep-datechip ep-datechip--${size}`} style={{ background: color, color: onAccent }}>
      <span className="ep-dc-day">{dayText}</span>
      <span className="ep-dc-monthcol">
        <span className="ep-dc-month">{shortMonth(event.date)}</span>
        <span className="ep-dc-year">{eventYear(event.date)}</span>
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CalShareButtons — the action row from the icon reference:
// solid category-colour primary button + two rounded-square hairline icon buttons.
// ─────────────────────────────────────────────────────────────────────────────

export function CalShareButtons({
  event,
  onDetails,
  primaryLabel = "Details",
}: {
  event: DatEvent;
  onDetails?: () => void;
  primaryLabel?: string;
}) {
  const { color, onAccent } = CAT[event.category];

  const share = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}#${event.id}`
        : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.description, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled — no-op */
    }
  };

  return (
    <div className="ep-actionrow">
      <button
        type="button"
        className="ep-btn-primary"
        style={{ background: color, color: onAccent }}
        onClick={onDetails}
      >
        {primaryLabel}
      </button>
      <a
        className="ep-iconbtn"
        href={gcalUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
        title="Add to calendar"
        aria-label="Add to calendar"
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
          <path d="M3 9h18M8 2.5v4M16 2.5v4" />
          <path d="M12 12.5v5M9.5 15h5" />
        </svg>
      </a>
      <button
        type="button"
        className="ep-iconbtn"
        title="Share"
        aria-label="Share this event"
        onClick={(e) => {
          e.stopPropagation();
          share();
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="6" cy="12" r="2.4" />
          <circle cx="17.5" cy="5.5" r="2.4" />
          <circle cx="17.5" cy="18.5" r="2.4" />
          <path d="M8.1 10.9l7.3-4.2M8.1 13.1l7.3 4.2" />
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EventPoster — non-featured poster (rail card or grid tile).
// Stripped to essentials: category label, title, date. No description/buttons.
// ─────────────────────────────────────────────────────────────────────────────

export default function EventPoster({
  event,
  variant = "rail",
  onOpen,
}: {
  event: DatEvent;
  /** "rail" = tall card in the swipe rail · "card" = responsive grid tile */
  variant?: "rail" | "card";
  onOpen?: (id: string) => void;
}) {
  const cat = CAT[event.category];
  const image = getEventImage(event);
  const online = isOnlineEvent(event);

  return (
    <article
      className={`ep ep--${variant}`}
      style={{ ["--ep-accent" as string]: cat.color, ["--ep-glow" as string]: cat.glow }}
      onClick={() => onOpen?.(event.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(event.id);
        }
      }}
      aria-label={`${event.title} — view details`}
    >
      <div className="ep-clip">
        <PosterLayers image={image} focus={event.imageFocus} category={event.category} />
      </div>

      <div className="ep-body">
        {online && <span className="ep-mode">Online</span>}
        <div className="ep-text">
          <span className="ep-eyebrow">{cat.label}</span>
          <h3 className="ep-title">{event.title}</h3>
          <span className="ep-loc">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {cityLabel(event)}
          </span>
          <DateChip event={event} size="md" />
        </div>
      </div>

      <PosterStyles />
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FeaturedModule — the large Next-Up / Featured block (NOT the page hero).
// Poster image + category label + title + prominent date + short description +
// Details button + calendar/share icons.
// ─────────────────────────────────────────────────────────────────────────────

export function FeaturedModule({
  event,
  onOpen,
  isFeaturedPick,
}: {
  event: DatEvent;
  onOpen?: (id: string) => void;
  isFeaturedPick?: boolean;
}) {
  const cat = CAT[event.category];
  const image = getEventImage(event);
  const online = isOnlineEvent(event);

  return (
    <section
      className="epf"
      style={{ ["--ep-accent" as string]: cat.color, ["--ep-glow" as string]: cat.glow }}
      aria-label={`${isFeaturedPick ? "Featured" : "Next up"}: ${event.title}`}
    >
      <div
        className="epf-poster"
        onClick={() => onOpen?.(event.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen?.(event.id);
          }
        }}
        aria-label={`${event.title} — view details`}
      >
        <div className="ep-clip">
          <PosterLayers image={image} focus={event.imageFocus} category={event.category} intensity="hero" />
        </div>
        <span className="epf-poster-flag" style={{ background: cat.color, color: cat.onAccent }}>
          {isFeaturedPick ? "★ Featured" : "Next Up"}
        </span>
        <DateChip event={event} size="lg" />
      </div>

      <div className="epf-info">
        <span className="epf-eyebrow">
          {cat.label}{online ? " · Online" : ""}
        </span>
        <h2 className="epf-title">{event.title}</h2>
        {event.subtitle && <p className="epf-subtitle">{event.subtitle}</p>}
        <p className="epf-when">{formatDateRange(event.date, event.endDate)}</p>
        <p className="epf-where">
          {online ? event.venue : `${event.venue} · ${event.city}${event.country && event.country !== "Online" ? ", " + event.country : ""}`}
        </p>
        <p className="epf-desc">{event.description}</p>
        <CalShareButtons event={event} onDetails={() => onOpen?.(event.id)} />
      </div>

      <FeaturedStyles />
    </section>
  );
}

// ── Shared styles for posters ───────────────────────────────────────────────

function PosterStyles() {
  return (
    <style>{`
      .ep {
        position: relative;
        isolation: isolate;
        /* No overflow:hidden/mask on the card itself — that would clip the hover
           box-shadow glow. The photo is clipped by the inner .ep-clip layer, which
           carries the rounded -webkit-mask that fixes Safari's corner flash. */
        border-radius: 16px;
        cursor: pointer;
        background: ${PLUM};
        display: flex;
        align-items: flex-end;
        transition: transform 0.3s cubic-bezier(.2,.7,.2,1), box-shadow 0.3s;
        box-shadow: 0 0 26px rgba(0,0,0,0.28);
      }
      .ep:focus-visible { outline: 3px solid var(--ep-accent); outline-offset: 3px; }
      .ep--rail { min-height: 380px; width: clamp(260px, 78vw, 300px); flex: 0 0 auto; scroll-snap-align: start; }
      .ep--card { min-height: 360px; width: 100%; }
      .ep:hover {
        transform: translateY(-6px);
        box-shadow: 0 0 0 1.5px var(--ep-glow), 0 0 44px 6px var(--ep-glow), 0 0 70px rgba(0,0,0,0.28);
      }

      .ep-clip {
        position: absolute; inset: 0; z-index: 0;
        border-radius: inherit; overflow: hidden;
        /* Safari: forces the rounded clip onto the composited layer so the
           scaling photo's corners stay rounded throughout the hover transition. */
        -webkit-mask-image: -webkit-radial-gradient(white, black);
      }
      .ep-photo, .ep-scrim, .ep-grain { position: absolute; inset: 0; border-radius: inherit; }
      .ep-photo { background-size: cover; transition: transform 0.5s ease; }
      .ep:hover .ep-photo { transform: scale(1.045); }
      .ep-grain { background-image: ${GRAIN_URL}; background-size: 160px 160px; mix-blend-mode: overlay; opacity: 0.12; pointer-events: none; }

      .ep-body {
        position: relative; z-index: 2; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: flex-end;
        padding: 1.25rem; gap: 1rem;
        border-radius: inherit;
      }
      /* Dark readability scrim behind the text, independent of the photo, so the
         headline + meta stay legible over any image. Rounded to match the card —
         it lives outside .ep-clip, so without this its opaque bottom would paint
         square corners now that .ep no longer clips (it can't, or it'd cut the glow). */
      .ep-body::before {
        content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
        border-radius: inherit;
        background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 20%, rgba(0,0,0,0.12) 40%, transparent 58%);
      }
      .ep-loc {
        display: inline-flex; align-items: center; gap: 0.4rem;
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.95rem; font-weight: 700; letter-spacing: 0.02em; line-height: 1.2;
        color: #fff; text-shadow: 0 1px 8px rgba(0,0,0,0.6);
      }
      .ep-loc svg { color: var(--ep-accent); flex: 0 0 auto; }
      .ep-mode {
        position: absolute; top: 1.1rem; right: 1.1rem; z-index: 2;
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.58rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;
        color: ${CREAM};
        background: rgba(0,0,0,0.36); border: 1px solid rgba(247,244,239,0.28);
        padding: 0.3rem 0.6rem; border-radius: 50px; white-space: nowrap;
      }
      .ep-text { display: flex; flex-direction: column; gap: 0.55rem; align-items: flex-start; }
      .ep-eyebrow {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.66rem; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase;
        color: ${CREAM}; opacity: 0.95;
      }
      .ep-title {
        font-family: var(--font-anton), system-ui, sans-serif;
        font-weight: 400; font-size: clamp(1.7rem, 5.2vw, 2.1rem); line-height: 0.92;
        letter-spacing: 0.01em; color: ${CREAM}; margin: 0; text-transform: uppercase;
        text-shadow: 0 2px 18px rgba(0,0,0,0.4);
      }

    `}</style>
  );
}

// DateChip styles live separately so they apply anywhere a DateChip is rendered —
// including the Featured module on its own (e.g. when a country filter leaves no
// rail cards on the page, which previously left the chip unstyled).
export function DateChipStyles() {
  return (
    <style>{`
      .ep-datechip {
        display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap;
        padding: 0.35rem 0.7rem; border-radius: 8px; line-height: 1;
        box-shadow: 0 2px 12px rgba(0,0,0,0.28);
      }
      .ep-datechip .ep-dc-day {
        font-family: var(--font-anton), system-ui, sans-serif;
        font-size: 1.85rem; letter-spacing: 0.01em; white-space: nowrap;
      }
      .ep-datechip .ep-dc-monthcol { display: flex; flex-direction: column; line-height: 1; gap: 0.1rem; }
      .ep-datechip .ep-dc-month {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.68rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
      }
      .ep-datechip .ep-dc-year {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.6rem; font-weight: 600; letter-spacing: 0.12em; opacity: 0.78;
      }
      .ep-datechip--sm { padding: 0.28rem 0.55rem; border-radius: 7px; gap: 0.35rem; }
      .ep-datechip--sm .ep-dc-day { font-size: 1.25rem; }
      .ep-datechip--sm .ep-dc-month { font-size: 0.58rem; }
      .ep-datechip--sm .ep-dc-year { font-size: 0.52rem; }
      .ep-datechip--lg { padding: 0.5rem 0.95rem; border-radius: 10px; }
      .ep-datechip--lg .ep-dc-day { font-size: 2.7rem; }
      .ep-datechip--lg .ep-dc-month { font-size: 0.82rem; }
      .ep-datechip--lg .ep-dc-year { font-size: 0.7rem; }
    `}</style>
  );
}

function FeaturedStyles() {
  return (
    <style>{`
      .epf {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
        gap: clamp(1.25rem, 3vw, 2.5rem);
        align-items: stretch;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(247,244,239,0.1);
        border-radius: 22px;
        padding: clamp(1rem, 2vw, 1.5rem);
      }
      @media (max-width: 780px) { .epf { grid-template-columns: 1fr; } }

      .epf-poster {
        position: relative; isolation: isolate;
        border-radius: 16px; min-height: clamp(320px, 42vw, 460px);
        background: ${PLUM}; cursor: pointer;
        display: flex; align-items: flex-end; justify-content: flex-start;
        padding: 1.25rem;
        transition: transform 0.35s cubic-bezier(.2,.7,.2,1), box-shadow 0.35s;
        box-shadow: 0 0 26px rgba(0,0,0,0.26);
      }
      .epf-poster:focus-visible { outline: 3px solid var(--ep-accent); outline-offset: 3px; }
      .epf-poster:hover {
        box-shadow: 0 0 0 1.5px var(--ep-glow), 0 0 48px 6px var(--ep-glow), 0 0 70px rgba(0,0,0,0.28);
      }
      .epf-poster .ep-clip {
        position: absolute; inset: 0; z-index: 0;
        border-radius: inherit; overflow: hidden;
        /* Safari: rounded mask on the inner layer fixes the hover corner flash
           without clipping the poster's box-shadow glow (see .ep-clip). */
        -webkit-mask-image: -webkit-radial-gradient(white, black);
      }
      .epf-poster .ep-photo, .epf-poster .ep-scrim, .epf-poster .ep-grain { position: absolute; inset: 0; border-radius: inherit; }
      .epf-poster .ep-photo { background-size: cover; transition: transform 0.6s ease; }
      .epf-poster:hover .ep-photo { transform: scale(1.04); }
      .epf-poster .ep-grain { background-image: ${GRAIN_URL}; background-size: 160px 160px; mix-blend-mode: overlay; opacity: 0.11; pointer-events: none; }
      .epf-poster .ep-datechip { position: relative; z-index: 2; }
      .epf-poster-flag {
        position: absolute; top: 1.1rem; left: 1.1rem; z-index: 3;
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.64rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
        padding: 0.35rem 0.7rem; border-radius: 50px;
      }

      .epf-info { display: flex; flex-direction: column; justify-content: center; padding: clamp(0.5rem, 2vw, 1.5rem) clamp(0.5rem, 1.5vw, 1rem); }
      .epf-eyebrow {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.7rem; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase;
        color: var(--ep-accent); margin: 0 0 0.6rem;
      }
      .epf-title {
        font-family: var(--font-anton), system-ui, sans-serif;
        font-weight: 400; font-size: clamp(2.2rem, 4.6vw, 3.6rem); line-height: 0.9;
        letter-spacing: 0.01em; color: ${CREAM}; margin: 0; text-transform: uppercase;
      }
      .epf-subtitle {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.82rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
        color: rgba(247,244,239,0.7); margin: 0.6rem 0 0;
      }
      .epf-when {
        font-family: var(--font-anton), system-ui, sans-serif;
        font-size: 1.35rem; font-weight: 400; letter-spacing: 0.02em; text-transform: uppercase;
        color: var(--ep-accent); margin: 0.9rem 0 0.15rem; line-height: 1.05;
      }
      .epf-where {
        font-family: var(--font-space-grotesk), system-ui, sans-serif;
        font-size: 0.86rem; color: rgba(247,244,239,0.6); margin: 0 0 0.9rem;
      }
      .epf-desc {
        font-family: var(--font-space-grotesk), system-ui, sans-serif;
        font-size: 0.98rem; line-height: 1.65; color: rgba(247,244,239,0.82); margin: 0 0 1.4rem; max-width: 46ch;
      }

      /* ── Action row (shared with detail view) ──────────────────────────── */
      .ep-actionrow { display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap; }
      .ep-btn-primary {
        font-family: var(--font-dm-sans), system-ui, sans-serif;
        font-size: 0.82rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
        border: none; cursor: pointer;
        padding: 0.85rem 2.2rem; border-radius: 12px;
        transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
        box-shadow: 0 2px 10px rgba(0,0,0,0.12);
      }
      .ep-btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }
      .ep-iconbtn {
        display: inline-flex; align-items: center; justify-content: center;
        width: 48px; height: 48px; border-radius: 12px;
        background: transparent; color: ${CREAM};
        border: 1.5px solid rgba(247,244,239,0.4); cursor: pointer;
        transition: border-color 0.2s, color 0.2s, background 0.2s, transform 0.15s;
      }
      .ep-iconbtn:hover { border-color: ${CREAM}; color: ${CREAM}; background: rgba(255,255,255,0.08); transform: translateY(-1px); }
    `}</style>
  );
}
