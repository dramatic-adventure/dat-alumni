// app/dat-lab/page.tsx
// DAT Lab index — a short landing hub so existing shared /dat-lab links keep
// working now that editions live at /dat-lab/baltimore and /dat-lab/kosice.
// Server Component; visual language mirrors the edition pages (see
// app/dat-lab/kosice/page.tsx). Metadata lives in layout.tsx.
import Link from "next/link";

const editions = [
  {
    title: "DAT Lab: Baltimore",
    status: "in development, fall 2026",
    href: "/dat-lab/baltimore",
  },
  {
    title: "DAT Lab: Košice",
    status: "summer 2026",
    href: "/dat-lab/kosice",
  },
] as const;

export default function DatLabIndexPage() {
  return (
    <main className="datlab-hub">
      <section className="datlab-hub-hero">
        <div className="datlab-hub-inner">
          <p className="datlab-hub-eyebrow">Dramatic Adventure Theatre</p>
          <h1 className="datlab-hub-title">DAT Lab</h1>
          <p className="datlab-hub-lede">
            DAT Lab is Dramatic Adventure Theatre&rsquo;s laboratory for
            creating and shaping original performance material — intimate,
            artist-centered, collaborative, immediate. Each Lab lives in a
            particular place and grows from the artists in the room.
          </p>
        </div>
      </section>

      <section className="datlab-hub-section">
        <div className="datlab-hub-inner">
          <div className="datlab-hub-cards">
            {editions.map((e) => (
              <Link key={e.href} href={e.href} className="datlab-hub-card">
                <h2 className="datlab-hub-card-title">{e.title}</h2>
                <p className="datlab-hub-card-status">
                  {e.status} <span aria-hidden="true">→</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .datlab-hub {
          background: #0d0812;
          color: rgba(255, 255, 255, 0.88);
          font-family: "DM Sans", var(--font-dm-sans), system-ui, sans-serif;
          line-height: 1.65;
        }
        .datlab-hub-inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }
        .datlab-hub-hero {
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
        .datlab-hub-eyebrow {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #ffcc00;
          margin: 0 0 1rem;
        }
        .datlab-hub-title {
          font-family: "Anton", var(--font-anton), sans-serif;
          font-size: clamp(2.8rem, 8vw, 5rem);
          text-transform: uppercase;
          letter-spacing: 0.02em;
          line-height: 1.05;
          color: #fff;
          margin: 0 0 1.25rem;
        }
        .datlab-hub-lede {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: clamp(1.05rem, 2.5vw, 1.3rem);
          color: rgba(255, 255, 255, 0.85);
          max-width: 34em;
          margin: 0 auto;
        }
        .datlab-hub-section {
          padding: 3rem 0 5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .datlab-hub-cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.1rem;
        }
        .datlab-hub-card {
          display: block;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.4rem 1.5rem;
          text-decoration: none;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .datlab-hub-card:hover {
          border-color: #f23359;
          background: rgba(242, 51, 89, 0.08);
        }
        .datlab-hub-card-title {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 1.12rem;
          font-weight: 700;
          color: #ffcc00;
          margin: 0 0 0.4rem;
        }
        .datlab-hub-card-status {
          font-family: "Space Grotesk", var(--font-space-grotesk), sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
        }
        .datlab-hub-card-status span {
          color: #f23359;
        }
      `}</style>
    </main>
  );
}
