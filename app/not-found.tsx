// app/not-found.tsx
import { DATButtonLink } from "@/components/ui/DATButton";

export default function NotFound() {
  return (
    <>
      <style>{`
        .nf-playwright {
          white-space: nowrap;
        }
        @media (max-width: 600px) {
          .nf-playwright {
            white-space: normal;
          }
        }
        .nf-home-btn {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          padding: 1rem 1.35rem;
          border-radius: 6px;
          font-family: var(--font-dm-sans), "DM Sans", system-ui, sans-serif;
          font-size: 0.86rem;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          background-color: #241123;
          color: #F2F2F2;
          cursor: pointer;
          transition: background-color 150ms ease, color 150ms ease;
        }
        .nf-home-btn:hover {
          background-color: #FFCC00;
          color: #241123;
        }
        .nf-support-link {
          color: #6C00AF;
          letter-spacing: 0.2em;
          border-bottom: 1px solid rgba(108,0,175,0.4);
          transition: color 180ms ease, letter-spacing 180ms ease, border-color 180ms ease;
        }
        .nf-support-link:hover {
          color: #FFCC00;
          letter-spacing: 0.32em;
          border-bottom-color: rgba(255,204,0,0.6);
        }
      `}</style>

      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "5rem 1.5rem 6rem",
          textAlign: "center",
        }}
      >
        {/* 404 annotation — Space Grotesk, readable */}
        <span
          style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#241123",
            display: "block",
            marginBottom: "2rem",
          }}
        >
          404 — Page Not Found
        </span>

        {/* DAT yellow rule */}
        <div
          style={{
            width: "2.5rem",
            height: "2px",
            backgroundColor: "#FFCC00",
            marginBottom: "2.25rem",
          }}
        />

        {/* Editorial headline */}
        <h1
          style={{
            fontFamily: "var(--font-gloucester), serif",
            fontSize: "clamp(2.4rem, 5.5vw, 4.4rem)",
            fontWeight: 400,
            color: "#241123",
            lineHeight: 1.1,
            maxWidth: "24ch",
            margin: "0 auto 2rem",
          }}
        >
          Adventure rarely<br />goes exactly as planned.
        </h1>

        {/* Playwright — typewriter/stage-direction treatment, DAT purple */}
        <p
          className="nf-playwright"
          style={{
            fontFamily: 'var(--font-special-elite), "Courier New", monospace',
            fontSize: "clamp(1.05rem, 1.9vw, 1.25rem)",
            fontWeight: 400,
            color: "#f2f2f2e1",
            lineHeight: 1.5,
            margin: "0 auto 0.6rem",
          }}
        >
          Somewhere, a playwright is probably revising this scene.
        </p>

        {/* Supporting body — matched to partners page readability standard */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "clamp(0.95rem, 1.5vw, 1.05rem)",
            fontWeight: 400,
            lineHeight: 1.65,
            color: "rgba(36,17,35,0.88)",
            maxWidth: "46ch",
            margin: "0 auto 2.75rem",
          }}
        >
          In the meantime, there are plenty of other stories waiting to be
          discovered — stories shaped by artists, communities, and the moments
          when people realize their voices matter.
        </p>

        {/* Primary navigation */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "center",
            marginBottom: "2.25rem",
          }}
        >
          <a href="/" className="nf-home-btn">
            Return Home
          </a>
          <DATButtonLink href="/story-map" variant="pink" size="lg" style={{ borderRadius: 6 }}>
            Explore Stories
          </DATButtonLink>
          <DATButtonLink href="/alumni" variant="teal" size="lg" style={{ borderRadius: 6 }}>
            Meet the Artists
          </DATButtonLink>
        </div>

        {/* Support link — DAT purple, underline, hover shifts to teal + wider tracking */}
        <a
          href="/donate"
          className="nf-support-link"
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "0.82rem",
            fontWeight: 900,
            textTransform: "uppercase",
            textDecoration: "none",
            paddingBottom: "2px",
          }}
        >
          Support the Work
        </a>
      </div>
    </>
  );
}
