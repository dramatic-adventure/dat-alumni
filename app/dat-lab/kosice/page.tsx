// app/dat-lab/kosice/page.tsx
// DAT Lab: Košice — evergreen city-edition page (EN + SK). The founding
// edition of DAT Lab, in partnership with ETP Slovensko; returns June–July
// 2027. The 2026 edition is archived verbatim at /dat-lab/kosice/2026.
// Client Component for the language toggle; metadata lives in layout.tsx.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Lang = "en" | "sk";

const STORAGE_KEY = "datlab-lang-pref";

/* ============================================================
   Copy — English canonical, Slovak overlay
   ============================================================ */

const copy = {
  en: {
    eyebrow: "The Founding Edition",
    title: "DAT Lab: Košice",
    tagline:
      "DAT's creative laboratory in Košice — original performance material devised with local theatre artists, in partnership with ETP Slovensko.",
    dates: "Returns June – July 2027 · Košice, Slovakia",
    invite:
      "The artist call for the 2027 edition opens in early 2027. Interested artists are welcome to reach out now — we'll be in touch when details are set.",

    aboutHeading: "The Lab",
    aboutP1:
      "DAT Lab is Dramatic Adventure Theatre's platform for creating and shaping original performance material — intimate, artist-centered, collaborative, immediate. Košice is where it began as a program: the founding edition, created with ETP Slovensko, brought together US, Slovak, and Romani artists to devise new work rooted in Eastern Slovakia. DAT Lab now also runs in Baltimore and Quito.",
    videoCaption:
      "An example of the DAT Lab process — inspired by our work in Ecuador.",

    nextEyebrow: "Next · Summer 2027",
    nextHeading: "The Lab Continues",
    nextP1:
      "DAT Lab: Košice returns in June–July 2027, building on the 2026 residency in partnership with ETP Slovensko.",
    nextP2:
      "Beginning in summer 2027, the Košice Lab starts work on a new original piece — untitled for now — devised across the 2027 and 2028 cohorts with ETP as co-producer, and made to travel: its destination is the Edinburgh Festival Fringe in 2029. Details and the 2027 artist call arrive in early 2027.",

    archiveHeading: "The 2026 Edition",
    archiveBody:
      "The founding residency ran July 17 – August 1, 2026, uniting US, Slovak, and Romani artists in two weeks of devising, and culminated in the public sharing Water That Wanders. The original edition page is preserved in full.",
    archiveCta: "Visit the 2026 archive",

    connectHeading: "Connect",
    connectBody:
      "Want to be part of the 2027 edition? Email a brief introduction: where you're based, your theatre or performance background, how you might want to be involved, and any links to your work — and we'll be in touch when the artist call opens.",
    connectCta: "Email Jesse",
    connectName: "Jesse Baxter",
    connectRole: "Artistic Director, Dramatic Adventure Theatre",
  },

  sk: {
    eyebrow: "Zakladajúca edícia",
    title: "DAT Lab: Košice",
    tagline:
      "Tvorivé laboratórium DAT v Košiciach — pôvodný performatívny materiál vytváraný s miestnymi divadelnými umelcami, v partnerstve s ETP Slovensko.",
    dates: "Vracia sa v júni – júli 2027 · Košice, Slovensko",
    invite:
      "Výzvu pre umelcov na edíciu 2027 zverejníme začiatkom roka 2027. Ak máte záujem, môžete sa nám ozvať už teraz — ozveme sa vám, keď budú známe podrobnosti.",

    aboutHeading: "O laboratóriu",
    aboutP1:
      "DAT Lab je platforma Dramatic Adventure Theatre na tvorbu a rozvíjanie pôvodného performatívneho materiálu — intímna, sústredená na umelcov, kolektívna a bezprostredná. V Košiciach vznikla ako program: zakladajúca edícia, vytvorená s ETP Slovensko, spojila amerických, slovenských a rómskych umelcov pri tvorbe nových diel zakorenených vo východnom Slovensku. DAT Lab dnes funguje aj v Baltimore a v Quite.",
    videoCaption:
      "Ukážka tvorivého procesu DAT Lab, inšpirovaná našou prácou v Ekvádore.",

    nextEyebrow: "Ďalej · leto 2027",
    nextHeading: "Laboratórium pokračuje",
    nextP1:
      "DAT Lab: Košice sa vracia v júni a júli 2027 a nadväzuje na rezidenciu z roku 2026, ktorá vznikla v partnerstve s ETP Slovensko.",
    nextP2:
      "V lete 2027 začne košické laboratórium pracovať na novom pôvodnom diele — zatiaľ bez názvu — ktoré budú spoločne vytvárať ročníky 2027 a 2028 s ETP ako koproducentom. Dielo vzniká tak, aby cestovalo: jeho cieľom je Edinburgh Festival Fringe 2029. Podrobnosti a výzvu pre umelcov zverejníme začiatkom roka 2027.",

    archiveHeading: "Edícia 2026",
    archiveBody:
      "Zakladajúca rezidencia sa uskutočnila od 17. júla do 1. augusta 2026. Spojila amerických, slovenských a rómskych umelcov v dvoch týždňoch kolektívnej tvorby a vyvrcholila verejnou prezentáciou Water That Wanders. Pôvodnú stránku edície uchovávame v plnom znení.",
    archiveCta: "Navštíviť archív 2026",

    connectHeading: "Kontakt",
    connectBody:
      "Chcete byť súčasťou edície 2027? Pošlite nám e-mail s krátkym predstavením: kde pôsobíte, aké máte skúsenosti s divadlom alebo performanciou, ako by ste sa chceli zapojiť, a pripojte odkazy na svoju tvorbu. Ozveme sa vám, keď zverejníme výzvu pre umelcov.",
    connectCta: "Napísať Jessemu",
    connectName: "Jesse Baxter",
    connectRole: "umelecký riaditeľ, Dramatic Adventure Theatre",
  },
} as const;

/* ============================================================
   Page
   ============================================================ */

export default function DatLabKosicePage() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "sk") {
        setLang(saved);
        return;
      }
      if (navigator.language?.split("-")[0]?.toLowerCase() === "sk") {
        setLang("sk");
      }
    } catch {
      // localStorage unavailable — keep default
    }
  }, []);

  function switchLang(next: Lang) {
    setLang(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  const t = copy[lang];

  return (
    <main className="datlab">
      {/* ---------- Hero ---------- */}
      <section className="datlab-hero">
        <div className="datlab-inner">
          <div className="datlab-langbar" role="group" aria-label="Language">
            {(["en", "sk"] as const).map((code) => (
              <button
                key={code}
                type="button"
                className={`datlab-langbtn${lang === code ? " is-active" : ""}`}
                aria-pressed={lang === code}
                onClick={() => switchLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <p className="datlab-eyebrow">{t.eyebrow}</p>
          <h1 className="datlab-title">{t.title}</h1>
          <p className="datlab-tagline">{t.tagline}</p>
          <p className="datlab-dates">{t.dates}</p>
          <p className="datlab-invite">{t.invite}</p>
        </div>
      </section>

      {/* ---------- The Lab ---------- */}
      <section className="datlab-section">
        <div className="datlab-inner">
          <h2 className="datlab-h2">{t.aboutHeading}</h2>
          <p>{t.aboutP1}</p>
          <figure className="datlab-video">
            <div className="datlab-video-frame">
              <iframe
                src="https://www.youtube.com/embed/cFwR6_HCJGY?rel=0&modestbranding=1"
                title="DAT Lab process example"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <figcaption className="datlab-video-caption">
              {t.videoCaption}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ---------- The Lab Continues — Summer 2027 ---------- */}
      <section className="datlab-section datlab-next">
        <div className="datlab-inner">
          <p className="datlab-eyebrow datlab-eyebrow-accent">
            {t.nextEyebrow}
          </p>
          <h2 className="datlab-next-title">{t.nextHeading}</h2>
          <p className="datlab-next-body">{t.nextP1}</p>
          <p className="datlab-next-body">{t.nextP2}</p>
        </div>
      </section>

      {/* ---------- The 2026 Edition ---------- */}
      <section className="datlab-section">
        <div className="datlab-inner">
          <h2 className="datlab-h2">{t.archiveHeading}</h2>
          <p>{t.archiveBody}</p>
          <Link href="/dat-lab/kosice/2026" className="datlab-btn">
            {t.archiveCta}
          </Link>
        </div>
      </section>

      {/* ---------- Connect ---------- */}
      <section className="datlab-section datlab-connect">
        <div className="datlab-inner">
          <h2 className="datlab-h2">{t.connectHeading}</h2>
          <p>{t.connectBody}</p>
          <a
            className="datlab-btn datlab-btn-solid"
            href="mailto:jesse@dramaticadventure.com?subject=DAT%20Lab%3A%20Ko%C5%A1ice"
          >
            {t.connectCta}
          </a>
          <p className="datlab-signature">
            {t.connectName}
            <br />
            <span>{t.connectRole}</span>
            <br />
            <a href="mailto:jesse@dramaticadventure.com">
              jesse@dramaticadventure.com
            </a>
            {" · "}
            <a
              href="https://www.dramaticadventure.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              dramaticadventure.com
            </a>
          </p>
        </div>
      </section>

      <style jsx>{`
        .datlab {
          background: #0d0812;
          color: rgba(255, 255, 255, 0.88);
          font-family: "DM Sans", var(--font-dm-sans), system-ui, sans-serif;
          line-height: 1.65;
        }
        .datlab-inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }

        /* ---------- Hero ---------- */
        .datlab-hero {
          background:
            radial-gradient(
              ellipse 120% 80% at 50% -10%,
              rgba(242, 51, 89, 0.22),
              transparent 60%
            ),
            #0d0812;
          padding: 7.5rem 0 3.5rem;
          text-align: center;
        }
        .datlab-langbar {
          display: flex;
          justify-content: center;
          gap: 0.4rem;
          margin-bottom: 2.25rem;
        }
        .datlab-langbtn {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.14em;
          padding: 0.3rem 0.85rem;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 999px;
          background: transparent;
          color: rgba(255, 255, 255, 0.65);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .datlab-langbtn:hover {
          border-color: #f23359;
          color: #fff;
        }
        .datlab-langbtn.is-active {
          background: #f23359;
          border-color: #f23359;
          color: #fff;
        }

        .datlab-eyebrow {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ffcc00;
          margin: 0 0 1rem;
        }
        .datlab-eyebrow-accent {
          color: #f23359;
        }
        .datlab-title {
          font-family: "Anton", var(--font-anton), sans-serif;
          font-size: clamp(2.8rem, 8vw, 5rem);
          text-transform: uppercase;
          letter-spacing: 0.02em;
          line-height: 1.05;
          color: #fff;
          margin: 0 0 1.25rem;
        }
        .datlab-tagline {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.05rem, 2.5vw, 1.3rem);
          color: rgba(255, 255, 255, 0.85);
          max-width: 34em;
          margin: 0 auto 1rem;
        }
        .datlab-dates {
          font-family: var(--font-rock-salt), cursive;
          font-size: 0.95rem;
          color: #ffcc00;
          margin: 1.5rem 0 0;
        }
        .datlab-invite {
          max-width: 38em;
          margin: 2rem auto 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 1.02rem;
        }

        /* ---------- Sections ---------- */
        .datlab-section {
          padding: 3rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .datlab-section p {
          margin: 0 0 1.1rem;
          color: rgba(255, 255, 255, 0.82);
        }
        .datlab-section p:last-child {
          margin-bottom: 0;
        }
        .datlab-h2 {
          font-family: "Anton", var(--font-anton), sans-serif;
          font-size: clamp(1.5rem, 4vw, 2.1rem);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #fff;
          margin: 0 0 1.5rem;
        }

        /* ---------- Video ---------- */
        .datlab-video {
          margin: 2rem 0 0;
        }
        .datlab-video-frame {
          position: relative;
          aspect-ratio: 16 / 9;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: #000;
        }
        .datlab-video-frame iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        .datlab-video-caption {
          font-family: var(--font-rock-salt), cursive;
          font-size: 0.82rem;
          color: #ffcc00;
          text-align: center;
          margin-top: 0.9rem;
        }

        /* ---------- Summer 2027 ---------- */
        .datlab-next {
          background: #1a0510;
          border-top: 1px solid rgba(242, 51, 89, 0.35);
          border-bottom: 1px solid rgba(242, 51, 89, 0.35);
          text-align: center;
        }
        .datlab-next-title {
          font-family: "Anton", var(--font-anton), sans-serif;
          font-size: clamp(1.9rem, 5vw, 2.8rem);
          text-transform: uppercase;
          color: #f23359;
          letter-spacing: 0.03em;
          margin: 0 0 1.25rem;
        }
        .datlab-next-body {
          text-align: left;
        }

        /* ---------- Buttons ---------- */
        .datlab-btn {
          display: inline-block;
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #fff;
          border: 2px solid #f23359;
          border-radius: 999px;
          padding: 0.7rem 1.8rem;
          margin-top: 0.75rem;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .datlab-btn:hover {
          background: #f23359;
        }
        .datlab-btn-solid {
          background: #ffcc00;
          border-color: #ffcc00;
          color: #241123;
        }
        .datlab-btn-solid:hover {
          background: #f23359;
          border-color: #f23359;
          color: #fff;
        }

        /* ---------- Connect ---------- */
        .datlab-connect {
          text-align: center;
          padding-bottom: 4.5rem;
        }
        .datlab-connect p {
          max-width: 40em;
          margin-left: auto;
          margin-right: auto;
        }
        .datlab-signature {
          margin-top: 2.25rem !important;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.75);
        }
        .datlab-signature span {
          color: rgba(255, 255, 255, 0.55);
        }
        .datlab-signature a {
          color: #ffcc00;
          text-decoration: none;
        }
        .datlab-signature a:hover {
          text-decoration: underline;
        }
      `}</style>
    </main>
  );
}
