// components/shared/StatsStrip.tsx
"use client";

import { useEffect, useRef } from "react";

type Stat = { value: number; label: string; subLabel?: string };

export type StatsStripProps = {
  stats?: Stat[];
  background?: string;
  accentColor?: string;
  textColor?: string;
  maxWidth?: string;
  id?: string;
  boxed?: boolean;
  boxBg?: string;
  boxRadius?: string;
};

const DEFAULT_STATS: Stat[] = [
  { value: 350, label: "Traveling Artists" },
  { value: 9, label: "Countries" },
  { value: 107, label: "International Communities Engaged" },
  {
    value: 75,
    label: "Mingas* & Community Showcases",
    subLabel: "*Community-Designed & Led Service Projects",
  },
  { value: 32, label: "New Plays" },
  { value: 3000, label: "Youth Reached" },
];

const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

/** Discrete, “flipboard-style” count with *subtle* pulse that stops before the end */
function animateFlipCount(
  el: HTMLElement,
  target: number,
  {
    duration = 2600,
    steps = 22,
    delay = 0,
    pulseCutoff = 0.88,       // <-- no pulses after 88% progress
    pulseWindowMs = 70,       // subtle + short pulse window
  }: {
    duration?: number;
    steps?: number;
    delay?: number;
    pulseCutoff?: number;
    pulseWindowMs?: number;
  } = {}
) {
  const startTime = performance.now() + delay;

  // Non-linear schedule (more ticks late, but still discrete)
  const schedule: number[] = [];
  for (let i = 1; i <= steps; i++) {
    const u = i / steps;
    const nonLinear = Math.pow(u, 1.55);
    schedule.push(startTime + duration * nonLinear);
  }

  let idx = 0;
  const tick = (now: number) => {
    if (now < schedule[0]) {
      requestAnimationFrame(tick);
      return;
    }

    while (idx < schedule.length && now >= schedule[idx]) {
      const p = Math.min(1, (schedule[idx] - startTime) / duration);
      const eased = easeOutQuint(p);

      // Chunk rounding for a “tick” feel on bigger numbers
      const raw = Math.max(0, Math.round(target * eased));
      const chunk =
        target >= 2000 ? 25 :
        target >= 500  ? 10 :
        target >= 100  ? 5  : 1;
      const val = Math.min(target, Math.round(raw / chunk) * chunk);

      // Only pulse on earlier ticks (before cutoff) and never on the final value
      const isFinalStep = idx >= schedule.length - 1 || val >= target;
      const shouldPulse = !isFinalStep && p < pulseCutoff && val < target;

      if (shouldPulse) {
        el.classList.add("tick");
        el.textContent = val.toLocaleString();
        // quick remove to keep it subtle
        setTimeout(() => el.classList.remove("tick"), pulseWindowMs);
      } else {
        // ensure no lingering pulse at the end
        el.classList.remove("tick");
        el.textContent = val.toLocaleString();
      }

      idx++;
    }

    if (idx < schedule.length) {
      requestAnimationFrame(tick);
    } else {
      // lock final, no pulse
      el.classList.remove("tick");
      el.textContent = target.toLocaleString();
    }
  };

  requestAnimationFrame(tick);
}

export default function StatsStrip({
  stats = DEFAULT_STATS,
  background = "transparent",
  accentColor = "#D9A919",
  textColor = "#241123",
  maxWidth = "1200px",
  id = "stats-map-section",
  boxed = true,
  boxBg = "rgba(36, 17, 35, 0.2)",
  boxRadius = "12px",
}: StatsStripProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    if (!section || !grid) return;

    const nums = Array.from(section.querySelectorAll<HTMLElement>("[data-target]"));

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const setFinal = () => {
      nums.forEach((el) => {
        const target = Number(el.dataset.target || "0");
        el.textContent = target.toLocaleString();
      });
      section.classList.add("ready");
    };

    if (prefersReducedMotion) {
      setFinal();
      return;
    }

    let triggered = false;

    const run = () => {
      if (triggered) return;
      triggered = true;

      // Reveal immediately so you never see zeros
      section.classList.add("ready");

      nums.forEach((el, i) => {
        const target = Number(el.dataset.target || "0");
        const baseDur = 2600;
        const jitter = Math.floor(Math.random() * 500); // +0–0.5s
        const duration = baseDur + jitter;
        const steps = 20 + Math.floor(Math.random() * 9); // 20–28 ticks
        const cascadeDelay = Math.min(i * 100, 350);
        animateFlipCount(el, target, {
          duration,
          steps,
          delay: cascadeDelay,
          pulseCutoff: 0.86,   // a hair earlier cutoff to quiet the finish
          pulseWindowMs: 60,   // slightly softer pulse
        });
      });
    };

    // Start just before the section arrives so you never see zeros
    const io = "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                run();
                io!.disconnect();
                break;
              }
            }
          },
          { threshold: 0, rootMargin: "220px 0px -5% 0px" }
        )
      : null;

    if (io) io.observe(section);
    else run();

    return () => io?.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={sectionRef}
      aria-labelledby="stats-heading"
      style={{ background, marginTop: 0 }}
    >
      <h2 id="stats-heading" className="sr-only">
        DAT Stats
      </h2>

      <div className="shell" style={{ ["--maxw" as any]: maxWidth }}>
        <div className={boxed ? "card" : ""}>
          <div ref={gridRef} className="stats-container">
            {stats.map((s, i) => (
              <div className="stat-box" key={i}>
                <h3
                  className="stat-number"
                  data-target={s.value}
                  aria-label={`${s.value.toLocaleString()} ${s.label}`}
                >
                  {"\u00A0"}
                </h3>
                <p className="stat-label" style={{ color: textColor }}>
                  {s.label}
                  {s.subLabel && (
                    <>
                      <br />
                      <span className="sub">{s.subLabel}</span>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        section {
          display: flex;
          justify-content: center;
          /* no space above the shaded box */
          padding: 0 1rem 2.75rem;
        }

        .shell {
          width: 100%;
          max-width: var(--maxw);
          margin: 0 auto;
        }

        .card {
          background: ${boxBg};
          border-radius: ${boxRadius};
          padding: 1.25rem;
          border: 1px solid rgba(36, 17, 35, 0.12);
        }
        @media (min-width: 640px) { .card { padding: 1.75rem; } }
        @media (min-width: 1024px) { .card { padding: 2rem; } }

        .stats-container {
          display: grid;
          width: 100%;
          margin: 0 auto;
          gap: 1rem;

          /* MOBILE: 2 columns (3 rows) */
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (min-width: 640px) {
          /* TABLET: 3 columns (2 rows) */
          .stats-container {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.25rem 1.25rem;
          }
        }
        @media (min-width: 1024px) {
          /* DESKTOP: 6 columns (1 row) */
          .stats-container {
            grid-template-columns: repeat(6, 1fr);
            gap: 1.25rem 1.5rem;
          }
        }

        .stat-box {
          text-align: center;
          line-height: 1.15;
          padding: 0.35rem 0.25rem;
        }

        .stat-number {
          margin: 0 0 -0.15rem;
          min-height: 1em;
          font-family: var(--font-space-grotesk, "Space Grotesk"), system-ui, sans-serif;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: ${accentColor};
          font-size: clamp(2rem, 10vw, 2.75rem);
          text-shadow: 0 2px 8px rgba(0,0,0,0.12);
          opacity: 0;
          transition: opacity 80ms linear, transform 60ms ease-out;
          will-change: transform;
        }
        .ready .stat-number { opacity: 1; }

        /* Subtle tick: tiny translate/scale, no blur for a cleaner finish */
        .stat-number.tick {
          transform: translateY(-0.5px) scale(1.004);
        }

        @media (min-width: 640px) { .stat-number { font-size: clamp(2.25rem, 6.5vw, 3.25rem); } }
        @media (min-width: 1024px) { .stat-number { font-size: clamp(2.75rem, 4.5vw, 4.5rem); } }

        .stat-label {
          margin: 0;
          font-family: var(--font-space-grotesk, "Space Grotesk"), system-ui, sans-serif;
          font-weight: 500;
          font-size: clamp(0.9rem, 3.2vw, 1rem);
        }
        .stat-label .sub {
          display: inline-block;
          opacity: 0.85;
          line-height: 1.2;
          font-size: 0.85em;
        }
        @media (min-width: 640px) { .stat-label { font-size: clamp(1rem, 2.2vw, 1.15rem); } }
        @media (min-width: 1024px) { .stat-label { font-size: clamp(1.05rem, 1.6vw, 1.25rem); } }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </section>
  );
}
