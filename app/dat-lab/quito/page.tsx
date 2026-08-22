// app/dat-lab/quito/page.tsx
// DAT Lab: Quito — artist-facing recruitment page for the January 2027
// residency building the Spanish-language edition of A GIRL WITHOUT WINGS.
// Client Component for the EN/ES language toggle (same pattern as
// app/dat-lab/kosice/page.tsx); metadata lives in layout.tsx.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Lang = "en" | "es";

const STORAGE_KEY = "datlab-quito-lang-pref";

/* ============================================================
   Copy — English canonical, Spanish overlay
   ============================================================ */

const copy = {
  en: {
    eyebrow: "DAT Lab: Quito",
    title: "DAT Lab: Quito",
    tagline:
      "DAT's laboratory for developing new work returns to where it began — building the Spanish-language edition of A GIRL WITHOUT WINGS.",
    dates: "January 2027 · Quito, Ecuador · partner TBA",
    invite:
      "We're looking for Ecuadorian and Spanish-speaking theatre artists to give an ensemble piece its Spanish-language life from the ground up — and we are especially hoping to find DAT alumni and artists who came up through our drama clubs in Ecuador.",

    aboutHeading: "The Lab",
    aboutP1:
      "DAT Lab is Dramatic Adventure Theatre's platform for creating and shaping original performance material — intimate, artist-centered, collaborative, immediate. It grew out of our work in Ecuador, launched as a program in Košice, Slovakia, and now also runs in Baltimore, where DAT is based. In January 2027, the Lab returns to its roots: Quito, the city at the heart of DAT's longest artistic relationships.",
    aboutP2:
      "DAT Lab: Quito is deliberately the most contained edition we've run — a development lab, not a production. The work is made in the room, tested in the room, and shared at the end with invited guests. What leaves Quito is a piece ready for its next stage.",

    pieceEyebrow: "The Piece",
    pieceTitle: "A Girl Without Wings",
    epigraph: "En español, por primera vez.",
    pieceP1:
      "A GIRL WITHOUT WINGS is one of DAT's signature works — reviewed by The New York Times in its original English-language production. We're rebuilding it as a Spanish-language ensemble piece, and the Quito Lab is where that rebuilding happens.",
    pieceP2:
      "The translation and adaptation are made in the room, not handed down to it: Spanish-speaking performers shape the text, find what carries across and what must be reimagined, and build the core ensemble relationships the piece will live on.",
    pieceP3:
      "The piece is made to travel. We're planning a Spanish-language premiere in late 2027 — venue to be announced — and after that we intend to take it to the Edinburgh Festival Fringe in 2028. Artists who help build it will know from day one what the plans are and where they fit.",

    residencyHeading: "What the January Lab Involves",
    residencyBody:
      "Studio sessions of translation, adaptation, devising, and ensemble work — testing the Spanish text out loud, following impulses, shaping the piece scene by scene. This is research and creation, not run-throughs: the Lab closes with a sharing for invited guests rather than a public run, and the artists in the room are building the piece, not executing it.",

    waysHeading: "Ways to Get Involved",
    ways: [
      {
        name: "Collaborating Artist",
        body: "Joins the Lab most fully: shaping the Spanish-language text, building the ensemble, and developing the piece across the residency — with a clear path toward the Spanish-language premiere in 2027 and the touring life beyond it. Those conversations happen up front.",
      },
      {
        name: "Guest Artist",
        body: "Joins for a shorter exchange: leading a session from their own practice, offering an outside eye on the translation or the staging, or contributing to one part of the work.",
      },
      {
        name: "Emerging Artist",
        body: "An advanced student artist from an Ecuadorian training program who joins selected sessions, learns the process, and may contribute to the sharing. Emerging Artists receive public credit.",
      },
    ],

    notesHeading: "Good to Know",
    notes: [
      "The working language of the Lab is Spanish. No English is required.",
      "DAT has been making work in Ecuador for nearly two decades — it's where DAT Lab began and where our longest-running drama clubs live. If you came up through a DAT program in Ecuador, we would especially love to hear from you.",
    ],
    editionsNote: "DAT Lab also runs in Baltimore and Košice — see all editions",

    connectHeading: "Connect",
    connectBody:
      "Interested artists should email a brief introduction: where you're based, your performance background, your availability in January, how you might want to be involved, and any links to your work.",
    connectCta: "Email Jesse",
    connectName: "Jesse Baxter",
    connectRole: "Artistic Director, Dramatic Adventure Theatre",
  },

  es: {
    eyebrow: "DAT Lab: Quito",
    title: "DAT Lab: Quito",
    tagline:
      "El laboratorio de DAT para el desarrollo de nuevas obras vuelve a donde comenzó: la creación de la edición en español de A GIRL WITHOUT WINGS.",
    dates: "Enero de 2027 · Quito, Ecuador · organización aliada por anunciar",
    invite:
      "Buscamos artistas de teatro ecuatorianos e hispanohablantes para darle a una obra de conjunto su vida en español, desde la raíz. Y tenemos una esperanza especial: encontrar en esta sala a exalumnos de DAT y a artistas que crecieron en nuestros clubes de teatro en Ecuador.",

    aboutHeading: "El Laboratorio",
    aboutP1:
      "DAT Lab es la plataforma de Dramatic Adventure Theatre para crear y dar forma a material escénico original: íntima, centrada en los artistas, colaborativa, inmediata. Nació de nuestro trabajo en Ecuador, se estrenó como programa en Košice (Eslovaquia) y hoy también funciona en Baltimore, sede de DAT. En enero de 2027, el laboratorio vuelve a sus raíces: Quito, la ciudad donde viven las relaciones artísticas más largas de DAT.",
    aboutP2:
      "DAT Lab: Quito es, a propósito, la edición más contenida que hemos hecho: un laboratorio de desarrollo, no una producción. El trabajo se crea en la sala, se prueba en la sala y se comparte al final con invitados. Lo que sale de Quito es una obra lista para su siguiente etapa.",

    pieceEyebrow: "La Obra",
    pieceTitle: "A Girl Without Wings",
    epigraph: "En español, por primera vez.",
    pieceP1:
      "A GIRL WITHOUT WINGS es una de las obras emblemáticas de DAT, reseñada por The New York Times en su producción original en inglés. La estamos reconstruyendo como una obra de conjunto en español, y el laboratorio de Quito es donde ocurre esa reconstrucción.",
    pieceP2:
      "La traducción y la adaptación se hacen en la sala, no llegan impuestas: intérpretes hispanohablantes dan forma al texto, descubren qué cruza el idioma y qué hay que reimaginar, y construyen las relaciones de conjunto que sostendrán la obra.",
    pieceP3:
      "La obra está hecha para viajar. Planeamos un estreno en español a finales de 2027 —lugar por anunciar— y después queremos llevarla al Festival Fringe de Edimburgo en 2028. Los artistas que ayuden a construirla sabrán desde el primer día cuáles son los planes y cuál es su lugar en ellos.",

    residencyHeading: "En qué consiste el laboratorio de enero",
    residencyBody:
      "Sesiones de estudio de traducción, adaptación, creación colectiva y trabajo de conjunto: probar el texto en español en voz alta, seguir impulsos, dar forma a la obra escena por escena. Esto es investigación y creación, no ensayos generales: el laboratorio cierra con una función para invitados, no con una temporada pública, y los artistas en la sala están construyendo la obra, no ejecutándola.",

    waysHeading: "Formas de participar",
    ways: [
      {
        name: "Artista colaborador / colaboradora",
        sub: "Collaborating Artist",
        body: "Participa del laboratorio de la manera más completa: da forma al texto en español, construye el conjunto y desarrolla la obra a lo largo de la residencia, con un camino claro hacia el estreno en español en 2027 y la vida en gira que vendrá después. Esas conversaciones se dan desde el inicio.",
      },
      {
        name: "Artista invitado / invitada",
        sub: "Guest Artist",
        body: "Se suma a un intercambio más breve: dirigir una sesión desde su propia práctica, ofrecer una mirada externa sobre la traducción o la puesta en escena, o aportar a una parte de la obra.",
      },
      {
        name: "Artista emergente",
        sub: "Emerging Artist",
        body: "Estudiante avanzado de un programa ecuatoriano de formación teatral que participa en sesiones seleccionadas, conoce el proceso y puede aportar a la función de cierre. Los artistas emergentes reciben crédito público.",
      },
    ],

    notesHeading: "Para tener en cuenta",
    notes: [
      "El idioma de trabajo del laboratorio es el español. No se requiere inglés.",
      "DAT lleva casi dos décadas creando en Ecuador: allí nació DAT Lab y allí viven nuestros clubes de teatro más antiguos. Si creciste en un programa de DAT en Ecuador, nos encantaría especialmente saber de ti.",
    ],
    editionsNote:
      "DAT Lab también funciona en Baltimore y Košice — conoce todas las ediciones",

    connectHeading: "Contacto",
    connectBody:
      "Si te interesa, escríbenos un correo con una breve presentación: dónde vives, tu trayectoria escénica, tu disponibilidad en enero, cómo te gustaría participar y enlaces a tu trabajo.",
    connectCta: "Escribir a Jesse",
    connectName: "Jesse Baxter",
    connectRole: "Director artístico, Dramatic Adventure Theatre",
  },
} as const;

/* ============================================================
   Page
   ============================================================ */

export default function DatLabQuitoPage() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "es") {
        setLang(saved);
        return;
      }
      if (navigator.language?.split("-")[0]?.toLowerCase() === "es") {
        setLang("es");
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
            {(["en", "es"] as const).map((code) => (
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
          <p>{t.aboutP2}</p>
        </div>
      </section>

      {/* ---------- The Piece — A GIRL WITHOUT WINGS ---------- */}
      <section className="datlab-section datlab-piece">
        <div className="datlab-inner">
          <p className="datlab-eyebrow datlab-eyebrow-accent">
            {t.pieceEyebrow}
          </p>
          <h2 className="datlab-piece-title">{t.pieceTitle}</h2>
          <p className="datlab-epigraph">{t.epigraph}</p>
          <p className="datlab-piece-body">{t.pieceP1}</p>
          <p className="datlab-piece-body">{t.pieceP2}</p>
          <p className="datlab-piece-body">{t.pieceP3}</p>
        </div>
      </section>

      {/* ---------- What the January Lab Involves ---------- */}
      <section className="datlab-section">
        <div className="datlab-inner">
          <h2 className="datlab-h2">{t.residencyHeading}</h2>
          <p>{t.residencyBody}</p>
        </div>
      </section>

      {/* ---------- Ways to Get Involved ---------- */}
      <section className="datlab-section">
        <div className="datlab-inner">
          <h2 className="datlab-h2">{t.waysHeading}</h2>
          <div className="datlab-cards">
            {t.ways.map((w) => (
              <div key={w.name} className="datlab-card">
                <h3 className="datlab-card-title">{w.name}</h3>
                {"sub" in w && <p className="datlab-card-sub">{w.sub}</p>}
                <p className="datlab-card-body">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Notes ---------- */}
      <section className="datlab-section">
        <div className="datlab-inner">
          <h2 className="datlab-h2">{t.notesHeading}</h2>
          {t.notes.map((n) => (
            <p key={n.slice(0, 24)} className="datlab-note">
              {n}
            </p>
          ))}
          <p className="datlab-note">
            {t.editionsNote}{" "}
            <Link href="/dat-lab" className="datlab-inline-link">
              <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>

      {/* ---------- Connect ---------- */}
      <section className="datlab-section datlab-connect">
        <div className="datlab-inner">
          <h2 className="datlab-h2">{t.connectHeading}</h2>
          <p>{t.connectBody}</p>
          <a
            className="datlab-btn datlab-btn-solid"
            href="mailto:jesse@dramaticadventure.com?subject=DAT%20Lab%3A%20Quito"
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

        /* ---------- The Piece ---------- */
        .datlab-piece {
          background: #1a0510;
          border-top: 1px solid rgba(242, 51, 89, 0.35);
          border-bottom: 1px solid rgba(242, 51, 89, 0.35);
          text-align: center;
        }
        .datlab-piece-title {
          font-family: "Anton", var(--font-anton), sans-serif;
          font-size: clamp(1.9rem, 5vw, 2.8rem);
          text-transform: uppercase;
          color: #f23359;
          letter-spacing: 0.03em;
          margin: 0 0 1.25rem;
        }
        .datlab-epigraph {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 1.08rem;
          font-style: italic;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 1.75rem !important;
        }
        .datlab-piece-body {
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

        /* ---------- Cards ---------- */
        .datlab-cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.1rem;
        }
        .datlab-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.4rem 1.5rem;
        }
        .datlab-card-title {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 1.12rem;
          font-weight: 700;
          color: #ffcc00;
          margin: 0 0 0.5rem;
        }
        .datlab-card-sub {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
          margin: -0.25rem 0 0.6rem !important;
        }
        .datlab-card-body {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.98rem;
        }

        /* ---------- Notes ---------- */
        .datlab-note {
          font-size: 0.98rem;
        }
        .datlab-note :global(.datlab-inline-link) {
          color: #ffcc00;
          text-decoration: none;
        }
        .datlab-note :global(.datlab-inline-link:hover) {
          text-decoration: underline;
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
