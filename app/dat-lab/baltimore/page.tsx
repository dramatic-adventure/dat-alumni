// app/dat-lab/baltimore/page.tsx
// DAT Lab: Baltimore — artist-facing recruitment page for the fall 2026
// hot-rehearsal residency developing THE ATTENDANT. English only; Server
// Component. Visual language mirrors app/dat-lab/kosice/page.tsx.
// Metadata lives in layout.tsx.
import Link from "next/link";

const ways = [
  {
    name: "Collaborating Artist",
    body: "Joins the residency most fully: devising in the heat, developing material with the ensemble, shaping the piece, and performing in the Baltimore run in spring 2027. Touring conversations happen up front.",
  },
  {
    name: "Guest Artist",
    body: "Joins for a shorter exchange: leading a session from their own practice (performance or wellness), offering an outside eye, or contributing to one part of the work.",
  },
  {
    name: "Emerging Artist",
    body: "An advanced student artist from a Baltimore-area training program who joins selected sessions, learns the process, and may contribute to the sharing. Emerging Artists receive public credit.",
  },
] as const;

export default function DatLabBaltimorePage() {
  return (
    <main className="datlab-blt">
      {/* ---------- Hero ---------- */}
      <section className="datlab-blt-hero">
        <div className="datlab-blt-inner">
          <p className="datlab-blt-eyebrow">DAT Lab: Baltimore</p>
          <h1 className="datlab-blt-title">DAT Lab: Baltimore</h1>
          <p className="datlab-blt-tagline">
            DAT&rsquo;s laboratory for developing new work comes home —
            starting with a performance made for an actual sauna.
          </p>
          <p className="datlab-blt-dates">
            Hot rehearsals: Fall 2026 · Baltimore · partner venue TBA
          </p>
          <p className="datlab-blt-invite">
            We&rsquo;re looking for Baltimore-based theatre artists to build
            something that has never existed here — and we are especially
            hoping to find performers who also live part of their working
            lives in the wellness world: massage therapists, breathwork and
            yoga teachers, bathhouse and spa practitioners who trained as
            performers, or performers at home in the heat.
          </p>
        </div>
      </section>

      {/* ---------- The Lab ---------- */}
      <section className="datlab-blt-section">
        <div className="datlab-blt-inner">
          <h2 className="datlab-blt-h2">The Lab</h2>
          <p>
            DAT Lab is Dramatic Adventure Theatre&rsquo;s platform for
            creating and shaping original performance material — intimate,
            artist-centered, collaborative, immediate. We&rsquo;ve run it in
            Ecuador and, most recently, in Košice, Slovakia. Now we&rsquo;re
            building a home edition in Baltimore: a recurring laboratory where
            new work gets made, tested, and shared with audiences here first.
          </p>
          <p>
            DAT Lab: Baltimore opens this fall with a residency that moves
            between the studio and somewhere no DAT Lab has gone before: real
            heat — because the first piece we&rsquo;re developing can&rsquo;t
            be <em>finished</em> in a studio.
          </p>
        </div>
      </section>

      {/* ---------- The Piece — THE ATTENDANT ---------- */}
      <section className="datlab-blt-section datlab-blt-piece">
        <div className="datlab-blt-inner">
          <p className="datlab-blt-eyebrow datlab-blt-eyebrow-accent">
            The Piece
          </p>
          <h2 className="datlab-blt-piece-title">The Attendant</h2>
          <p className="datlab-blt-epigraph">
            It&rsquo;s a sauna out there.
          </p>
          <p>
            A site-specific performance created for a working sauna, performed
            in real heat for a small audience sharing the benches. That much
            is decided. The rest will be discovered in the room — which is the
            point of a Lab.
          </p>
          <p>
            It might include: an attendant whose work slowly becomes something
            else. Rounds of heat and the relief between them. Words that
            arrive in the steam. The sounds of a Baltimore summer. Something
            cold and sweet that Baltimoreans will recognize. It might include
            things none of us have thought of yet — that&rsquo;s what the
            artists in the room are for.
          </p>
          <p>
            The piece grows from a Baltimore summer and is made to travel:
            after its Baltimore premiere in spring 2027, we intend to take it
            to the Edinburgh Festival Fringe. Artists who help build it will
            know from day one what the touring plans are and where they fit.
          </p>
        </div>
      </section>

      {/* ---------- What the Fall Residency Involves ---------- */}
      <section className="datlab-blt-section">
        <div className="datlab-blt-inner">
          <h2 className="datlab-blt-h2">What the Fall Residency Involves</h2>
          <p>
            Most of the making happens the way DAT Labs always have: studio
            sessions of devising, writing, movement, and composition work —
            developing material, following impulses, shaping fragments. Then,
            in short, focused sessions at a partner sauna (TBA), we bring the
            material into real heat and find out how text, movement, towel
            work, scent, light, and sound actually behave in the room. This is
            research and creation, not run-throughs — nothing arrives
            finished, and the artists in the room are building the piece, not
            executing it.
          </p>
        </div>
      </section>

      {/* ---------- Ways to Get Involved ---------- */}
      <section className="datlab-blt-section">
        <div className="datlab-blt-inner">
          <h2 className="datlab-blt-h2">Ways to Get Involved</h2>
          <div className="datlab-blt-cards">
            {ways.map((w) => (
              <div key={w.name} className="datlab-blt-card">
                <h3 className="datlab-blt-card-title">{w.name}</h3>
                <p className="datlab-blt-card-body">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Good to Know ---------- */}
      <section className="datlab-blt-section">
        <div className="datlab-blt-inner">
          <h2 className="datlab-blt-h2">Good to Know</h2>
          <p className="datlab-blt-note">
            All work in heat is consent-based, opt-out-anytime, with real
            breaks and real water. Leaving the heat is always correct sauna
            behavior — that&rsquo;s true in the piece, too.
          </p>
          <p className="datlab-blt-note">
            No sauna experience required for theatre artists; no theatre
            résumé required for wellness practitioners who perform.
            We&rsquo;re interested in individual artists with their own
            practice, voice, and creative imagination.
          </p>
          <p className="datlab-blt-note">
            DAT Lab began abroad — see{" "}
            <Link href="/dat-lab/kosice" className="datlab-blt-inline-link">
              DAT Lab: Košice <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>

      {/* ---------- Connect ---------- */}
      <section className="datlab-blt-section datlab-blt-connect">
        <div className="datlab-blt-inner">
          <h2 className="datlab-blt-h2">Connect</h2>
          <p>
            Interested artists should email a brief introduction: where
            you&rsquo;re based, your performance and/or wellness background,
            your availability this fall, how you might want to be involved,
            and any links to your work.
          </p>
          <a
            className="datlab-blt-btn datlab-blt-btn-solid"
            href="mailto:jesse@dramaticadventure.com?subject=DAT%20Lab%3A%20Baltimore"
          >
            Email Jesse
          </a>
          <p className="datlab-blt-signature">
            Jesse Baxter
            <br />
            <span>
              Artistic Director, Dramatic Adventure Theatre (Baltimore-based)
            </span>
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

      <style>{`
        .datlab-blt {
          background: #0d0812;
          color: rgba(255, 255, 255, 0.88);
          font-family: "DM Sans", var(--font-dm-sans), system-ui, sans-serif;
          line-height: 1.65;
        }
        .datlab-blt-inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }

        /* ---------- Hero ---------- */
        .datlab-blt-hero {
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
        .datlab-blt-eyebrow {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ffcc00;
          margin: 0 0 1rem;
        }
        .datlab-blt-eyebrow-accent {
          color: #f23359;
        }
        .datlab-blt-title {
          font-family: "Anton", var(--font-anton), sans-serif;
          font-size: clamp(2.8rem, 8vw, 5rem);
          text-transform: uppercase;
          letter-spacing: 0.02em;
          line-height: 1.05;
          color: #fff;
          margin: 0 0 1.25rem;
        }
        .datlab-blt-tagline {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.05rem, 2.5vw, 1.3rem);
          color: rgba(255, 255, 255, 0.85);
          max-width: 34em;
          margin: 0 auto 1rem;
        }
        .datlab-blt-dates {
          font-family: var(--font-rock-salt), cursive;
          font-size: 0.95rem;
          color: #ffcc00;
          margin: 1.5rem 0 0;
        }
        .datlab-blt-invite {
          max-width: 38em;
          margin: 2rem auto 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 1.02rem;
        }

        /* ---------- Sections ---------- */
        .datlab-blt-section {
          padding: 3rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .datlab-blt-section p {
          margin: 0 0 1.1rem;
          color: rgba(255, 255, 255, 0.82);
        }
        .datlab-blt-section p:last-child {
          margin-bottom: 0;
        }
        .datlab-blt-h2 {
          font-family: "Anton", var(--font-anton), sans-serif;
          font-size: clamp(1.5rem, 4vw, 2.1rem);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #fff;
          margin: 0 0 1.5rem;
        }

        /* ---------- The Piece ---------- */
        .datlab-blt-piece {
          background: #1a0510;
          border-top: 1px solid rgba(242, 51, 89, 0.35);
          border-bottom: 1px solid rgba(242, 51, 89, 0.35);
        }
        .datlab-blt-piece .datlab-blt-inner {
          text-align: center;
        }
        .datlab-blt-piece p {
          text-align: left;
        }
        .datlab-blt-piece .datlab-blt-eyebrow,
        .datlab-blt-piece .datlab-blt-epigraph {
          text-align: center;
        }
        .datlab-blt-piece-title {
          font-family: "Anton", var(--font-anton), sans-serif;
          font-size: clamp(1.9rem, 5vw, 2.8rem);
          text-transform: uppercase;
          color: #f23359;
          letter-spacing: 0.03em;
          margin: 0 0 1.25rem;
        }
        .datlab-blt-epigraph {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 1.08rem;
          font-style: italic;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 1.75rem !important;
        }

        /* ---------- Buttons ---------- */
        .datlab-blt-btn {
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
        .datlab-blt-btn:hover {
          background: #f23359;
        }
        .datlab-blt-btn-solid {
          background: #ffcc00;
          border-color: #ffcc00;
          color: #241123;
        }
        .datlab-blt-btn-solid:hover {
          background: #f23359;
          border-color: #f23359;
          color: #fff;
        }

        /* ---------- Cards ---------- */
        .datlab-blt-cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.1rem;
        }
        .datlab-blt-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.4rem 1.5rem;
        }
        .datlab-blt-card-title {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 1.12rem;
          font-weight: 700;
          color: #ffcc00;
          margin: 0 0 0.5rem;
        }
        .datlab-blt-card-body {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.98rem;
        }

        /* ---------- Notes ---------- */
        .datlab-blt-note {
          font-size: 0.98rem;
        }
        .datlab-blt-inline-link {
          color: #ffcc00;
          text-decoration: none;
        }
        .datlab-blt-inline-link:hover {
          text-decoration: underline;
        }

        /* ---------- Connect ---------- */
        .datlab-blt-connect {
          text-align: center;
          padding-bottom: 4.5rem;
        }
        .datlab-blt-connect p {
          max-width: 40em;
          margin-left: auto;
          margin-right: auto;
        }
        .datlab-blt-signature {
          margin-top: 2.25rem !important;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.75);
        }
        .datlab-blt-signature span {
          color: rgba(255, 255, 255, 0.55);
        }
        .datlab-blt-signature a {
          color: #ffcc00;
          text-decoration: none;
        }
        .datlab-blt-signature a:hover {
          text-decoration: underline;
        }
      `}</style>
    </main>
  );
}
