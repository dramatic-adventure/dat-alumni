// app/page.tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

type LinkSpec = { href: string; label: string; tone: "pink" | "purple" | "green" | "yellow" };
type CardSpec = {
  tone: "pink" | "purple" | "green" | "yellow";
  title: string;
  desc: string;
  ctaHref: string;
  ctaLabel: string;
  links: LinkSpec[];
};

export default function Page() {
  const router = useRouter();

  /* ---------------- COMMUNITY DATA ---------------- */
  const cards: CardSpec[] = useMemo(
    () => [
      {
        tone: "pink",
        title: "DAT ALUMNI",
        desc:
          "Spin the globe and explore artist stories on DAT’s Story Map. Find and (re)connect with artists through the Alumni Directory. Sponsor an Artist to build community-rooted work abroad -- then watch the impact multiply as those artists return home to inspire others, create new work, and ignite change in their own communities.",
        ctaHref: "/alumni",
        ctaLabel: "DAT ALUMNI",
        links: [
          { href: "/story-map", label: "Explore the Story Map", tone: "pink" },
          { href: "/alumni/directory", label: "Find an Artist", tone: "pink" },
          { href: "/alumni/sponsor-artist", label: "Sponsor an Artist", tone: "pink" },
        ],
      },
      {
        tone: "purple",
        title: "PARTNERS",
        desc:
          "Host DAT on your campus. Build a credit-bearing study abroad that lets students devise, teach, produce, and perform theatre that tackles real-world issues. Or launch a CSR initiative or ‘Adventure Day’ of creativity, cross-cultural exchange, and youth mentorship. Bring your bold ideas and let’s create something unforgettable.",
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
        desc:
          "Start a club or explore the Drama Clubs and communities we already serve. Mentor young artists. Sponsor a Club with space, materials, and workshops so youth in under-resourced communities have the opportunity to develop their voices, share their stories, and speak to the needs of their community.",
        ctaHref: "/drama-clubs",
        ctaLabel: "DRAMA CLUBS",
        links: [
          { href: "/drama-clubs/find", label: "Find a Club", tone: "green" },
          { href: "/drama-clubs/mentor", label: "Become a Mentor", tone: "green" },
          { href: "/drama-clubs/sponsor", label: "Sponsor a Club", tone: "green" },
        ],
      },
      {
        tone: "yellow",
        title: "FRIENDS OF DAT",
        desc:
          "Join our circle of supporters and changemakers. Volunteer behind the scenes. Friend-raise and advocate for DAT as an Ambassador in your city. Support life-changing theatre that builds bridges and amplifies unheard voices. Every gift—of time, funds, or passion—helps us spark transformation, one story at a time.",
        ctaHref: "/community",
        ctaLabel: "FRIENDS OF DAT",
        links: [
          { href: "/get-involved/volunteer", label: "Volunteer with DAT", tone: "yellow" },
          { href: "/get-involved/ambassador", label: "Join as an Ambassador", tone: "yellow" },
          { href: "/donate", label: "Donate", tone: "yellow" },
        ],
      },
    ],
    []
  );

  /* ---------------- ACCORDION STATE ---------------- */
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [panelHeights, setPanelHeights] = useState<number[]>([]);
  const revealRefs = useRef<Array<HTMLDivElement | null>>([]);

  // TS-safe ref setter (returns void)
  const setRevealRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      revealRefs.current[idx] = el;
    },
    []
  );

  // measure the currently open panel
  const measureOpen = useCallback(() => {
    setPanelHeights((prev) => {
      const next = new Array(cards.length).fill(0);
      if (openIndex != null) {
        const node = revealRefs.current[openIndex];
        next[openIndex] = node ? node.scrollHeight : 0;
      }
      return next;
    });
  }, [cards.length, openIndex]);

  // keep open panel height in sync on resize
  useEffect(() => {
    const handler = () => measureOpen();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [measureOpen]);

  useEffect(() => {
    // measure whenever the open card changes
    requestAnimationFrame(measureOpen);
  }, [openIndex, measureOpen]);

  return (
    <main className="bg-transparent">
      {/* ===== HERO (image only) ===== */}
      <div className="hero">
        <Image
          src="/images/alumni-hero.jpg"
          alt="DAT Hero"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>

      {/* ===== HEADLINE (below hero, not overlay) ===== */}
      <br />
      <br />
      <header className="headline-area" aria-labelledby="landing-headline">
        <div className="headline-wrap">
          <h1
            id="landing-headline"
            className="headline-title"
            style={{
              fontFamily: '"Anton", sans-serif',
              fontSize: "14vw",
              color: "#d9a919",
              opacity: 0.55,
            }}
          >
            EVERY STORY STARTS SOMEWHERE.
          </h1>
          <p
            className="headline-subtitle"
            style={{
              fontFamily:
                '"Space Grotesk", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
              fontWeight: 500,
              color: "#241123",
              opacity: 0.9,
            }}
          >
            We develop artists, travel the world, and make theatre that matters.
          </p>
        </div>
      </header>

      {/* ===== CTA SECTION (unchanged logic; styles below) ===== */}
      <br />
      <br />
      <section className="cta-section">
        <div className="cta-wrapper">
          {/* Artists */}
          <div className="cta-block">
            <div className="cta-box">
              <div className="cta-content">
                <div className="text-elements flex-1">
                  <div className="cta-label" style={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 900, color: "#241123" }}>
                    Artists
                  </div>
                  <h3 style={{ fontFamily: '"Space Grotesk", sans-serif', color: "#6C00AF", opacity: 0.8 }}>
                    Take the Stage
                  </h3>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#241123", textAlign: "center" }}>
                    Join residencies, expeditions, and workshops that spark meaningful
                    new work — onstage and beyond.
                  </p>
                </div>
                <button className="dat-btn" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  Join the Adventure
                </button>
              </div>
            </div>
          </div>

          {/* Audiences */}
          <div className="cta-block">
            <div className="cta-box">
              <div className="cta-content">
                <div className="text-elements flex-1">
                  <div className="cta-label" style={{ fontFamily: '"DM Sans", sans-serif', color: "#241123" }}>
                    Audiences
                  </div>
                  <h3 style={{ fontFamily: '"Space Grotesk", sans-serif', color: "#6C00AF", opacity: 0.8 }}>
                    Follow the Journey
                  </h3>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#241123", textAlign: "center" }}>
                    Explore a season of bold journeys, deep listening, unique
                    collaborations, and daring creativity.
                  </p>
                </div>
                <button className="dat-btn" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  Experience the Work
                </button>
              </div>
            </div>
          </div>

          {/* Supporters */}
          <div className="cta-block cta-block-supporters">
            <div className="cta-box">
              <div className="cta-content">
                <div className="text-elements flex-1">
                  <div className="cta-label" style={{ fontFamily: '"DM Sans", sans-serif', color: "#241123" }}>
                    Supporters &amp; Funders
                  </div>
                  <h3 style={{ fontFamily: '"Space Grotesk", sans-serif', color: "#6C00AF", opacity: 0.8 }}>
                    Make Magic Possible
                  </h3>
                  <p style={{ fontFamily: '"DM Sans", sans-serif', color: "#241123", textAlign: "center" }}>
                    Support responsive, community-powered theatre — where story is
                    needed most.
                  </p>
                </div>
                <button className="dat-btn" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  Sponsor the Story
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMMUNITY (accordion that matches Squarespace) ===== */}
      <section className="community-band" aria-labelledby="community-heading">
        <div className="community-wrap">
          <h3 className="band-heading">COMMUNITY</h3>

          <div className="community-container">
            <div className="community-head">
              <h2 id="community-heading">Moved to Act.</h2>
              <p className="sub">
                Alumni, partners, and friends who carry the work forward -- on stage, in the field, at home, online, and around the world.
              </p>
              <br />
            </div>

            <div className="community-grid">
              {cards.map((card, i) => {
                const expanded = openIndex === i;

                return (
                  <div
                    key={card.title}
                    className="community-card"
                    data-open={expanded ? "true" : "false"}
                  >
                    {/* Label pill as button */}
                    <button
                      className={`card-cta-bar card-cta-bar--${card.tone} card-cta-bar--asButton`}
                      type="button"
                      onClick={() => router.push(card.ctaHref)}
                      aria-label={`Open ${card.title} portal`}
                    >
                      <span className="card-cta-text">{card.title}</span>
                    </button>

                    {/* Description (clamps when closed) */}
                    <p className="card-desc" data-open={expanded ? "true" : "false"}>
                      {card.desc}
                    </p>

                    {/* Chevron — right aligned when closed, bottom-right when open */}
                    <button
                      className="chev-toggle"
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`reveal-${i}`}
                      onClick={() => {
                        const willOpen = openIndex !== i;
                        setOpenIndex(willOpen ? i : null);
                      }}
                    >
                      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                        <path d="M4 7.5 L10 13 L16 7.5" />
                      </svg>
                    </button>

                    {/* Reveal zone */}
                    <div
                      className="reveal-wrap"
                      id={`reveal-${i}`}
                      ref={setRevealRef(i)}
                      style={{ maxHeight: expanded ? (panelHeights[i] ?? 0) : 0 }}
                    >
                      <div className="mini-buttons-row" role="group" aria-label={`${card.title} links`}>
                        {card.links.map((lnk) => (
                          <button
                            key={lnk.href}
                            className={`mini-btn mini-btn--${lnk.tone}`}
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
        </div>
      </section>

      {/* ===== STYLES ===== */}
      <style jsx>{`
  /* Kill link underlines globally in this page scope */
  :global(main a),
  :global(main a:visited),
  :global(main a:hover),
  :global(main a:focus),
  :global(main a:active) { text-decoration: none !important; }

  /* Brand tokens */
  :root{
    --dat-purple:#6c00af;
    --dat-deeppurple:#241123;
    --dat-teal:#2493a9;
    --dat-pink:#f23359;
    --dat-yellow:#ffcc00;
    --dat-yellow-flat:#d9a919;
    --dat-green:#2fa873;
    --dat-gold-brown:#7a5a00;
    --dat-deep-green:#1f7d56;
  }

  :global(body){ margin:0; background:transparent; color:var(--dat-deeppurple); }

  /* ===== HERO ===== */
  .hero{ position:relative; height:55vh; overflow:hidden; z-index:0; box-shadow:0 0 33px rgba(0,0,0,.5); }

  /* ===== HEADLINE ===== */
  .headline-area{ margin-top:-.35rem; }
  .headline-wrap{ max-width:1200px; margin:0 auto; padding:.75rem 2rem 0; text-align:left; }
  .headline-title{ margin:0; line-height:1.02; text-transform:uppercase; text-shadow:0 8px 20px rgba(0,0,0,.08); }
  .headline-subtitle{ margin:.25rem 0 0; font-size:clamp(1rem,2.4vw,1.75rem); }

  /* ===== CTA (unchanged from your app) ===== */
  .cta-section{ padding:1rem 2rem 2rem; max-width:1200px; margin:0 auto; }
  .cta-wrapper{ display:grid; grid-template-columns:repeat(3,1fr); gap:2rem; width:100%; box-sizing:border-box; }
  .cta-block{ display:flex; flex-direction:column; align-items:center; width:100%; box-sizing:border-box; min-width:0; padding:1rem; }

  .cta-box{ position:relative; overflow:hidden; border-radius:15px; background:rgba(255,255,255,.25); box-shadow:0 8px 20px rgba(0,0,0,.2); min-height:500px; text-align:center; width:100%; transition:background .5s ease; }
  .cta-box::before{ content:""; background:url("/images/masked-adjustment.png") center/cover no-repeat; position:absolute; inset:0; opacity:0; transition:opacity 1s ease; z-index:1; }
  .cta-box:hover::before{ opacity:1; }

  .cta-content{ position:relative; z-index:2; padding:2rem; display:flex; flex-direction:column; height:100%; min-height:500px; transition:opacity .6s ease; }
  .text-elements{ flex:1 1 auto; transition:opacity .6s ease; }
  .cta-box:hover .text-elements{ opacity:0; }

  .cta-label{ font-family:"Space Grotesk",system-ui; font-weight:700; text-transform:uppercase; font-size:1.2rem; margin-bottom:.5rem; color:var(--dat-purple); }
  .cta-content h3{ font-family:"Space Grotesk",system-ui; font-size:2.2rem; margin-bottom:1rem; color:var(--dat-pink); font-weight:800; line-height:1.18; }
  .cta-content p{ font-family:"DM Sans",system-ui; font-size:1rem; line-height:1.5; font-weight:500; margin-bottom:2.5rem; color:var(--dat-deeppurple); }

  .dat-btn{
    position:relative; z-index:3; display:inline-flex; align-items:center; justify-content:center;
    max-width:100%; box-sizing:border-box; text-align:center; margin-top:2rem; padding:1.1rem 2.2rem;
    font-family:"Space Grotesk",system-ui; font-size:1.1rem; font-weight:600; text-transform:uppercase; letter-spacing:.35em;
    background-color:#2493a9 !important; color:#f2f2f2; border:none; border-radius:15px; cursor:pointer;
    transition:transform .3s ease, box-shadow .3s ease; box-shadow:0 8px 20px rgba(0,0,0,.18);
  }
  .dat-btn:hover{ transform:translateY(-1px); }
  .cta-box:hover .dat-btn{ animation:pulse-glow 1.2s infinite; }
  @keyframes pulse-glow{
    0%{transform:scale(1);box-shadow:0 0 0 rgba(255,204,0,0);}
    50%{transform:scale(1.05);box-shadow:0 0 15px rgba(255,204,0,.6);}
    100%{transform:scale(1);box-shadow:0 0 0 rgba(255,204,0,0);}
  }

  /* ===== COMMUNITY (Accordion) ===== */
  .community-band{ padding:2.5rem 0 3.25rem; }
  .community-wrap{ max-width:1200px; margin:0 auto; padding:0 2rem; }
  .band-heading{
    font-family:"Space Grotesk",system-ui,sans-serif; font-size:2.4rem; margin:0 0 1rem;
    text-transform:uppercase; letter-spacing:.2rem; color:#241123;
    background-color:#ffcc00; opacity:.6; padding:.1em .5em; border-radius:.3em; display:inline-block;
  }
  .community-container{ background:rgba(36,17,35,.20); border-radius:8px; padding:clamp(16px,2.2vw,32px); }
  .community-head{ margin-bottom:1rem; text-align:left; }
  .community-head h2{ margin:0; font-family:"Space Grotesk",system-ui,sans-serif; font-weight:800; font-size:clamp(1.4rem,3vw,2rem); color:#D9A919; opacity:.95; line-height:1.15; text-align:left; }
  .sub{ margin:.25rem 0 0; font-family:"DM Sans",system-ui,sans-serif; color:rgba(234,222,170,.6); font-weight:600; font-size:1rem; text-align:left; line-height:1.5; }

  /* FLEX grid with responsive column count driven by a CSS var */
.community-grid{
  position:relative; z-index:1; margin-top:1.0rem;
  display:flex; flex-wrap:wrap;
  --gap: clamp(14px,1.6vw,24px);
  --cols: 4;                             /* default: 4-up */
  gap: var(--gap);
  align-items:flex-start;
  box-sizing:border-box;
}

/* Each card takes exactly 1/cols of the row minus total gaps */
.community-card{
  flex: 0 1 calc((100% - (var(--cols) - 1) * var(--gap)) / var(--cols));
}

/* Two columns ≤1000px */
@media (max-width:1000px){
  .community-grid{ --cols: 2; }
}

/* One column ≤540px */
@media (max-width:540px){
  .community-grid{ --cols: 1; }
}


  .community-card{
    position:relative; width:100%; display:flex; flex-direction:column; box-sizing:border-box;
    padding:1rem 1.1rem .9rem; /* tighter closed padding */
    border-radius:12px;
    background:rgba(255,255,255,0.30); /* original opacity feel */
    border:1px solid rgba(0,0,0,0.08);
    box-shadow:0 6px 16px rgba(0,0,0,0.14); transition:background .2s ease, box-shadow .2s ease, padding-bottom .2s ease;
    text-align:left; overflow:visible;
    height:100%; min-height:220px;
  }
  /* modest extra space when open (prevents clip; keeps chevron beside last button) */
  .community-card[data-open="true"]{ padding-bottom:1rem; }

  /* Pill */
  .card-cta-bar{
    display:block; width:100%; box-sizing:border-box; border-radius:12px; padding:.7rem .9rem; margin:0 0 .75rem 0;
    border:1px solid rgba(0,0,0,0.08);
    font-family:"Space Grotesk",system-ui,sans-serif; font-weight:700; font-size:.82rem; line-height:1.2;
    letter-spacing:.14em; text-transform:uppercase; text-align:center;
    transition:transform 120ms ease, filter 120ms ease, box-shadow 120ms ease, background-color 120ms ease;
  }
  .card-cta-bar--asButton{ cursor:pointer; }
  .card-cta-bar--asButton:hover{ transform:translateY(-1px); box-shadow:0 2px 10px rgba(0,0,0,.12); }
  .card-cta-bar--pink{   background:rgba(242,51,89,1);  color:#f2f2f2; }
  .card-cta-bar--purple{ background:rgba(108,0,175,1); color:#f2f2f2; }
  .card-cta-bar--green{  background:rgba(47,168,115,1); color:#f2f2f2; }
  .card-cta-bar--yellow{ background:rgba(217,169,25,1); color:var(--dat-deeppurple); }
  .card-cta-bar--pink:hover{   background:rgba(164, 2, 35, .92); }
  .card-cta-bar--purple:hover{ background:rgba( 62, 0,101, .92); }
  .card-cta-bar--green:hover{  background:rgba( 13,111, 68, .92); }
  .card-cta-bar--yellow:hover{ background:rgba(187,141,  3, .92); }

  /* Description */
  .card-desc{
    margin-top:.3rem; margin-bottom:0.1rem;
    font-family:"DM Sans",system-ui,sans-serif; color:var(--dat-deeppurple);
    font-size:.95rem; line-height:1.5; text-align:left;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  }
  .card-desc[data-open="true"]{
    display:block; -webkit-line-clamp:unset; -webkit-box-orient:unset; overflow:visible;
  }

  /* Chevron */
  .chev-toggle{
    align-self:flex-end;
    margin:0;
    margin-top:auto;  /* parks at bottom when closed */
    padding:0rem;
    background:transparent; border:none; cursor:pointer;
  }
  .chev-toggle svg{ width:30px; height:30px; display:block; opacity:.9; transition:transform .2s ease, opacity .2s ease; }
  .chev-toggle path{ fill:none; stroke:#241123; stroke-width:1.75; stroke-linecap:round; stroke-linejoin:round; }
  .chev-toggle:hover svg{ opacity:1; }
  .chev-toggle[aria-expanded="true"] svg{ transform:rotate(180deg); }

/* CLOSED: remove the flex "auto" gap so the chevron hugs the snippet */
.community-card[data-open="false"] .chev-toggle{
  margin-top: .15rem !important;   /* tiny breathing room */
}

/* Only move the closed chevron; leaves the label pill alone */
.community-card[data-open="false"] .chev-toggle{
  margin-right: -6px;   /* visual “negative padding-right” */
  padding-right: 0;     /* keep internal padding neutral */
}


/* CLOSED: tighten the card's bottom padding so no extra gap sits under the chevron */
.community-card[data-open="false"]{
  padding-bottom: 0.3rem !important;
}

/* If any min-height is forcing extra space, let the card collapse naturally */
.community-card{
  min-height: auto; /* safe: expanded height comes from content/reveal */
}



  /* When open, fix to bottom-right and reserve space to its left */
  .community-card[data-open="true"] .chev-toggle{
    position:absolute; right:12px; bottom:6px;
    padding-left:28px;
  }
  .community-card[data-open="true"] .mini-buttons-row{ padding-right:36px; padding-bottom:0.75px; margin-bottom:0;  }


  
  /* Reveal */
  .reveal-wrap{ max-height:0; overflow:hidden; transition:max-height 280ms ease; }
  @media (prefers-reduced-motion: reduce){ .reveal-wrap{ transition:none; } .chev-toggle svg{ transition:none; } }

  /* Mini buttons */
  .mini-buttons-row{
    margin-top:.75rem;
    display:flex; gap:.6rem; flex-wrap:wrap; justify-content:flex-start;
  }
  .mini-btn{
    display:inline-flex; align-items:center; justify-content:left;
    padding:.55rem .9rem; border-radius:12px; border:1px solid transparent; background:transparent; cursor:pointer;
    font-family:"Space Grotesk",system-ui,sans-serif; font-weight:600;
    text-transform:uppercase; letter-spacing:.16em; font-size:.7rem; line-height:1.1; color:inherit;
    transition:background-color 120ms ease,border-color 120ms ease,color 120ms ease,transform 120ms ease,filter 120ms ease;
  }
  .mini-btn span{text-align:left;}
  .mini-btn--pink{   color:rgba(168,2,35,1);  background-color:rgba(242,51,89,.20); border-color:rgba(242,51,89,1); }
  .mini-btn--purple{ color:rgba(80,0,130,1);  background-color:rgba(108,0,175,.20); border-color:rgba(108,0,175,1); }
  .mini-btn--green{  color:rgba(3,37,22,1);   background-color:rgba(47,168,115,.28); border-color:rgba(26,209,130,1); }
  .mini-btn--yellow{ color:rgba(52,39,0,1);   background-color:rgba(217,169,25,.32); border-color:rgba(243,183,5,1); }
  .mini-btn:hover{ transform:translateY(-.5px); color:#fff; }
  .mini-btn--pink:hover{   background-color:rgba(231,44,81,.60);  border-color:rgba(242,51,89,1); }
  .mini-btn--purple:hover{ background-color:rgba(97,2,156,.60);   border-color:rgba(108,0,175,1); }
  .mini-btn--green:hover{  background-color:rgba(47,168,115,.68);  border-color:rgba(26,209,130,1); }
  .mini-btn--yellow:hover{ background-color:rgba(217,169,25,.88);  border-color:rgba(243,183,5,1); }

  /* Responsive */
  @media (max-width:1024px){
    .cta-wrapper{ grid-template-columns:repeat(2,1fr); }
    .cta-block-supporters{ grid-column:1 / -1; }
  }
  @media (max-width:768px){
    .cta-wrapper{ grid-template-columns:1fr; }
    .cta-block{ width:100%; }
  }
  @media (max-width:1000px){ .community-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width:540px){  .community-grid{ grid-template-columns:1fr; } }
`}</style>

    </main>
  );
}
