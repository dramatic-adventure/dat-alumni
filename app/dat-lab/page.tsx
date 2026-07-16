// app/dat-lab/page.tsx
// DAT Lab: Košice 2026 — artist-facing recruitment page (EN + SK).
// Part of PASSAGE: Slovakia 2026; culminates in Water That Wanders
// (/theatre/water-that-wanders) on Saturday, August 1.
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
    eyebrow: "PASSAGE: Slovakia 2026",
    title: "DAT Lab: Košice",
    tagline:
      "A creative laboratory with NYC-based DAT artists and local theatre artists in Košice.",
    dates: "July 17 – August 1, 2026 · Košice, Slovakia",
    invite:
      "We are hoping to connect with experienced local theatre artists — especially Roma artists — who may be interested in joining us as a Collaborating Artist or Guest Artist.",

    aboutHeading: "The Lab",
    aboutP1:
      "DAT Lab is a platform for creating and shaping original, site-responsive performance material. The work will explore the geographic and cultural landscape of Eastern Slovakia, springing from cross-cultural encounters and the lived experiences, local mythologies, questions, and creative imaginations of the artists in the room.",
    aboutP2:
      "Together, we will devise and develop new material through creative writing, movement and dance explorations, improvisation, and composition work. This is a place to test material, follow creative impulses, shape fragments of ideas, listen deeply, discover what is resonating, and develop all-new scenes and moments together.",
    aboutP3:
      "We are essentially bringing our version of the NYC black box theatre development process to Košice — intimate, actor-centered, collaborative, immediate, and full of life. And we'd love to marry that with the ways you like to develop new work.",
    videoCaption:
      "An example of the DAT Lab process — inspired by our work in Ecuador.",

    waterEyebrow: "Final public sharing · Saturday, August 1",
    waterIntro:
      "Inspired by the poetry of Papusza, DAT Lab culminates in an eclectic evening of shared works-in-progress — creative articulations that represent new ideas, raw impressions, and fresh remembrances.",
    waterQuote:
      "US, Slovak, and Romani artists unite to share this eclectic evening of work in progress. Theatre, storytelling, and poetry fuse as we explore the confluence of lived experience that happens when people from different worlds join hands and step together into waters less known.",
    waterCta: "Event details",

    hopeHeading: "Our Hope",
    hopeBody:
      "Our hope is not only to create a meaningful final sharing this summer, but also to begin building artistic relationships in Košice that could grow into future collaborations — including the possible seed of a future full-length production.",

    waysHeading: "Ways to Get Involved",
    ways: [
      {
        name: "Collaborating Artist",
        body: "Participates in the Košice creative process most fully: joining DAT Lab workshops, developing material with the ensemble, contributing artistically to the room, and appearing in or contributing to Water That Wanders on Saturday, August 1.",
      },
      {
        name: "Guest Artist",
        body: "Joins for a shorter exchange — leading a workshop, sharing part of an artistic practice, joining a rehearsal session, offering dramaturgical insight, or contributing to one part of the final sharing.",
      },
      {
        name: "Emerging Artist",
        body: "An advanced student artist from a local conservatory, university, or theatre training program who joins selected workshops, learns from the process, and may contribute to the final sharing. Emerging Artists receive public credit for their involvement.",
      },
    ],

    scheduleHeading: "Schedule",
    scheduleNote:
      "All workshops will be held in Košice. Dates will not change; exact workshop times may be adjusted to better serve the needs of our local artists.",
    schedule: [
      {
        date: "Friday, July 17",
        name: "DAT Lab Workshop: Opening",
        body: "Introductions, artistic orientation, first creative development session, and opening exchange.",
      },
      {
        date: "Saturday, July 18",
        name: "DAT Lab Workshop: Artistic Exchange",
        body: "Workshop, devising, shared practice, and early material development. Homework to be assigned.",
      },
      {
        date: "Thursday, July 30",
        name: "DAT Lab Workshop: Growing & Shaping",
        body: "Homework sharing. Grow and shape what has been created.",
      },
      {
        date: "Friday, July 31",
        name: "Rehearsal & Refinement",
        body: "Finalize performance structure. Clarify and sharpen contributions — edits, refinements, staging. Rehearse pieces.",
      },
      {
        date: "Saturday, August 1",
        name: "Water That Wanders",
        body: "Final preparations, including a pre-performance run-through. Sharing works in progress at the performance of Water That Wanders.",
      },
    ],

    notesHeading: "Good to Know",
    notes: [
      "There may also be a separate, optional opportunity to visit or volunteer at theatre workshops and performances with local youth in Zemplínska Teplica or Luník IX.",
      "We are interested in individual theatre artists with their own practice, voice, questions, methods, and creative imagination. We are not asking any artist to “represent” an entire community or culture.",
    ],

    connectHeading: "Connect",
    connectBody:
      "Interested artists should email a brief introduction: where you're based, your theatre or performance background, your availability for the Košice dates above, how you might want to be involved, and any links to your work — website, video, CV, or social media.",
    connectForward:
      "Know someone who might be a good fit? We'd be grateful if you shared this page or connected us directly.",
    connectCta: "Email Jesse",
    connectName: "Jesse Baxter",
    connectRole: "Artistic Director, Dramatic Adventure Theatre",
  },

  sk: {
    eyebrow: "PASSAGE: Slovensko 2026",
    title: "DAT Lab: Košice",
    tagline:
      "Tvorivé laboratórium s DAT umelcami z New Yorku a miestnymi divadelnými umelcami v Košiciach.",
    dates: "17. júl – 1. august 2026 · Košice, Slovensko",
    invite:
      "Radi by sme sa spojili so skúsenými miestnymi divadelnými umelcami — najmä rómskymi umelcami — ktorí by mali záujem pridať sa k nám ako Collaborating Artist alebo Guest Artist.",

    aboutHeading: "Laboratórium",
    aboutP1:
      "DAT Lab je platforma na tvorbu a formovanie pôvodného divadelného materiálu, ktorý reaguje na konkrétne miesto. Práca bude skúmať geografickú a kultúrnu krajinu východného Slovenska a bude vychádzať z medzikultúrnych stretnutí, žitých skúseností, miestnych mytológií, otázok a tvorivej predstavivosti umelcov v miestnosti.",
    aboutP2:
      "Spoločne budeme vytvárať a rozvíjať nový materiál prostredníctvom tvorivého písania, pohybových a tanečných explorácií, improvizácie a kompozičnej práce. Je to priestor na testovanie materiálu, nasledovanie tvorivých impulzov, formovanie fragmentov nápadov, hlboké počúvanie, objavovanie toho, čo rezonuje, a spoločné vytváranie úplne nových scén a momentov.",
    aboutP3:
      "V podstate prinášame do Košíc našu verziu newyorského „black box“ procesu vývoja novej divadelnej tvorby — intímneho, sústredeného na herca, kolaboratívneho, bezprostredného a plného života. A radi by sme ho prepojili so spôsobmi, akými novú tvorbu rozvíjate vy.",
    videoCaption:
      "Ukážka procesu DAT Lab — inšpirovaná našou prácou v Ekvádore.",

    waterEyebrow: "Záverečné verejné zdieľanie · sobota 1. augusta",
    waterIntro:
      "DAT Lab vyvrcholí eklektickým večerom zdieľania rozpracovanej tvorby, inšpirovaným poéziou Papuszy — tvorivé výpovede, ktoré predstavujú nové nápady, surové dojmy a čerstvé spomienky.",
    waterQuote:
      "Americkí, slovenskí a rómski umelci sa spájajú, aby zdieľali tento eklektický večer rozpracovanej tvorby. Divadlo, rozprávanie príbehov a poézia sa prelínajú, keď skúmame sútok žitých skúseností, ktorý vzniká, keď sa ľudia z rôznych svetov chytia za ruky a spoločne vkročia do menej známych vôd.",
    waterCta: "Detaily podujatia",

    hopeHeading: "Naše želanie",
    hopeBody:
      "Naším želaním je nielen vytvoriť zmysluplné záverečné zdieľanie toto leto, ale aj začať budovať umelecké vzťahy v Košiciach, ktoré by mohli prerásť do budúcich spoluprác — vrátane možného zárodku budúcej celovečernej inscenácie.",

    waysHeading: "Ako sa zapojiť",
    ways: [
      {
        name: "Collaborating Artist",
        body: "Zapája sa do košického tvorivého procesu najplnšie: účasť na workshopoch DAT Lab, vývoj materiálu so súborom, umelecký prínos do miestnosti a účinkovanie v predstavení Water That Wanders v sobotu 1. augusta alebo príspevok k nemu.",
      },
      {
        name: "Guest Artist",
        body: "Pripája sa na kratšiu výmenu — vedenie workshopu, zdieľanie časti svojej umeleckej praxe, účasť na skúške, dramaturgický pohľad alebo príspevok k jednej časti záverečného zdieľania.",
      },
      {
        name: "Emerging Artist",
        body: "Pokročilý študentský umelec z miestneho konzervatória, univerzity alebo divadelného vzdelávacieho programu, ktorý sa zúčastní vybraných workshopov, učí sa z procesu a môže prispieť k záverečnému zdieľaniu. Emerging Artists získajú verejný kredit za svoje zapojenie.",
      },
    ],

    scheduleHeading: "Program",
    scheduleNote:
      "Všetky workshopy sa uskutočnia v Košiciach. Termíny sa nezmenia; presné časy workshopov však môžeme upraviť podľa potrieb miestnych umelcov.",
    schedule: [
      {
        date: "piatok 17. júla",
        name: "DAT Lab Workshop: Otvorenie",
        body: "Zoznámenie, umelecká orientácia, prvé tvorivé stretnutie a úvodná výmena.",
      },
      {
        date: "sobota 18. júla",
        name: "DAT Lab Workshop: Umelecká výmena",
        body: "Workshop, devising, spoločná prax a vývoj prvého materiálu. Zadá sa domáca úloha.",
      },
      {
        date: "štvrtok 30. júla",
        name: "DAT Lab Workshop: Rast a formovanie",
        body: "Zdieľanie domácich úloh. Rozvíjanie a formovanie toho, čo vzniklo.",
      },
      {
        date: "piatok 31. júla",
        name: "Skúška a dolaďovanie",
        body: "Finalizácia štruktúry predstavenia. Spresnenie a vybrúsenie príspevkov — úpravy, dolaďovanie, inscenovanie. Skúšanie jednotlivých častí.",
      },
      {
        date: "sobota 1. augusta",
        name: "Water That Wanders",
        body: "Posledné prípravy vrátane generálky. Zdieľanie rozpracovanej tvorby na predstavení Water That Wanders.",
      },
    ],

    notesHeading: "Dobré vedieť",
    notes: [
      "Môže existovať aj samostatná, dobrovoľná príležitosť navštíviť divadelné workshopy a predstavenia s miestnou mládežou v Zemplínskej Teplici alebo na Luníku IX.",
      "Zaujímajú nás individuálni divadelní umelci s vlastnou praxou, hlasom, otázkami, metódami a tvorivou predstavivosťou. Od žiadneho umelca nežiadame, aby „reprezentoval“ celú komunitu alebo kultúru.",
    ],

    connectHeading: "Kontakt",
    connectBody:
      "Umelci so záujmom nám môžu napísať krátke predstavenie: kde pôsobíte, vaše divadelné alebo performatívne skúsenosti, vašu dostupnosť v košických termínoch vyššie, ako by ste sa chceli zapojiť, a odkazy na vašu tvorbu — web, video, CV alebo sociálne siete. Napíšte nám v slovenčine alebo angličtine.",
    connectForward:
      "Poznáte niekoho, kto by sa hodil? Budeme vďační, ak túto stránku pošlete ďalej alebo nás prepojíte priamo.",
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
          <p>{t.aboutP2}</p>
          <p>{t.aboutP3}</p>
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

      {/* ---------- Water That Wanders ---------- */}
      <section className="datlab-section datlab-water">
        <div className="datlab-inner">
          <p className="datlab-eyebrow datlab-eyebrow-accent">{t.waterEyebrow}</p>
          <h2 className="datlab-water-title">Water That Wanders</h2>
          <p>{t.waterIntro}</p>
          <blockquote className="datlab-quote">{t.waterQuote}</blockquote>
          <Link href="/theatre/water-that-wanders" className="datlab-btn">
            {t.waterCta}
          </Link>
        </div>
      </section>

      {/* ---------- Our Hope ---------- */}
      <section className="datlab-section">
        <div className="datlab-inner">
          <h2 className="datlab-h2">{t.hopeHeading}</h2>
          <p>{t.hopeBody}</p>
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
                <p className="datlab-card-body">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Schedule ---------- */}
      <section className="datlab-section">
        <div className="datlab-inner">
          <h2 className="datlab-h2">{t.scheduleHeading}</h2>
          <p className="datlab-schedule-note">{t.scheduleNote}</p>
          <ol className="datlab-schedule">
            {t.schedule.map((s) => (
              <li key={s.date} className="datlab-schedule-row">
                <div className="datlab-schedule-date">{s.date}</div>
                <div>
                  <h3 className="datlab-schedule-name">{s.name}</h3>
                  <p className="datlab-schedule-body">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
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
        </div>
      </section>

      {/* ---------- Connect ---------- */}
      <section className="datlab-section datlab-connect">
        <div className="datlab-inner">
          <h2 className="datlab-h2">{t.connectHeading}</h2>
          <p>{t.connectBody}</p>
          <p>{t.connectForward}</p>
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
            <a href="mailto:jesse@dramaticadventure.com">jesse@dramaticadventure.com</a>
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
          padding: 4.5rem 0 3.5rem;
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

        /* ---------- Water ---------- */
        .datlab-water {
          background: #1a0510;
          border-top: 1px solid rgba(242, 51, 89, 0.35);
          border-bottom: 1px solid rgba(242, 51, 89, 0.35);
          text-align: center;
        }
        .datlab-water-title {
          font-family: "Anton", var(--font-anton), sans-serif;
          font-size: clamp(1.9rem, 5vw, 2.8rem);
          text-transform: uppercase;
          color: #f23359;
          letter-spacing: 0.03em;
          margin: 0 0 1.25rem;
        }
        .datlab-quote {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 1.08rem;
          font-style: italic;
          color: rgba(255, 255, 255, 0.9);
          border-left: 3px solid #f23359;
          text-align: left;
          margin: 1.75rem auto;
          padding: 0.25rem 0 0.25rem 1.25rem;
          max-width: 36em;
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
        .datlab-card-body {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.98rem;
        }

        /* ---------- Schedule ---------- */
        .datlab-schedule-note {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.65);
        }
        .datlab-schedule {
          list-style: none;
          margin: 1.75rem 0 0;
          padding: 0;
          display: grid;
          gap: 1.4rem;
        }
        .datlab-schedule-row {
          display: grid;
          grid-template-columns: 10rem 1fr;
          gap: 1rem;
          align-items: start;
          border-left: 3px solid rgba(242, 51, 89, 0.55);
          padding-left: 1.1rem;
        }
        .datlab-schedule-date {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ffcc00;
          padding-top: 0.15rem;
        }
        .datlab-schedule-name {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.3rem;
        }
        .datlab-schedule-body {
          margin: 0;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.75);
        }
        @media (max-width: 560px) {
          .datlab-schedule-row {
            grid-template-columns: 1fr;
            gap: 0.25rem;
          }
        }

        /* ---------- Notes ---------- */
        .datlab-note {
          font-size: 0.98rem;
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
