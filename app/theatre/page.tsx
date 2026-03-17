// app/theatre/page.tsx
import Link from "next/link";
import Image from "next/image";
import { productionMap, type Production, getSortYear } from "@/lib/productionMap";

function sortProductions(a: Production, b: Production) {
  const yearA = getSortYear(a);
  const yearB = getSortYear(b);
  if (yearA !== yearB) return yearB - yearA;
  if (a.season !== b.season) return (b.season || 0) - (a.season || 0);
  return a.title.localeCompare(b.title);
}

// ── helpers ──────────────────────────────────────────────────────────────

function festivalShort(festival: string | undefined): string | null {
  if (!festival) return null;
  // "ACTion Fest 2016: Shangaa / Shock and Awe -- IATI Theatre"
  //  → "ACTion Fest 2016: Shangaa / Shock and Awe"
  const clean = festival.split("--")[0].trim();
  return clean || null;
}

function festivalVenue(festival: string | undefined): string | null {
  if (!festival) return null;
  const parts = festival.split("--");
  return parts[1]?.trim() || null;
}

// ── page ─────────────────────────────────────────────────────────────────

export default function TheatreIndexPage() {
  const allProductions = Object.values(productionMap).sort(sortProductions);

  // Group by season, descending
  const bySeason = new Map<number, Production[]>();
  for (const p of allProductions) {
    const s = p.season ?? 0;
    if (!bySeason.has(s)) bySeason.set(s, []);
    bySeason.get(s)!.push(p);
  }
  const seasonNums = Array.from(bySeason.keys()).sort((a, b) => b - a);

  // Stats
  const years = allProductions.map(getSortYear).filter(Boolean);
  const earliestYear = Math.min(...years);
  const latestYear = Math.max(...years);
  const uniqueLocations = new Set(
    allProductions.map((p) => {
      const parts = p.location.split(",");
      return parts[parts.length - 1].trim();
    })
  );

  // Featured: most recent production that has a poster
  const featured = allProductions.find((p) => p.posterUrl && p.posterUrl.trim());

  return (
    <main className="min-h-screen bg-[#0F0A10] text-white">
      {/* Atmospheric gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(108,0,175,0.13) 0%, transparent 60%), " +
            "radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,204,0,0.07) 0%, transparent 55%)",
        }}
      />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-14">
        <p
          className="mb-4 text-xs font-black uppercase tracking-[0.3em]"
          style={{ color: "#FFCC00" }}
        >
          Dramatic Adventure Theatre
        </p>

        <h1
          className="uppercase leading-[0.88] text-white/90"
          style={{
            fontFamily: "var(--font-anton), system-ui, sans-serif",
            fontSize: "clamp(3rem, 11vw, 9rem)",
          }}
        >
          One Journey,
          <br />
          <span style={{ color: "#6C00AF" }}>Many Worlds.</span>
        </h1>

        <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/55">
          Since {earliestYear}, DAT has travelled to the edges of the world to make
          theatre with and for the communities where story is needed most.
        </p>

        {/* Stats */}
        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/10 pt-8">
          {[
            { n: `${seasonNums.length}`, label: "Seasons" },
            { n: `${earliestYear}–${latestYear}`, label: "Years Active" },
            { n: `${allProductions.length}+`, label: "Productions" },
            { n: `${uniqueLocations.size}+`, label: "Locations" },
          ].map(({ n, label }) => (
            <div key={label}>
              <div
                className="font-black leading-none"
                style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  color: "#FFCC00",
                }}
              >
                {n}
              </div>
              <div className="mt-1 text-[0.63rem] font-semibold uppercase tracking-[0.22em] text-white/35">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SEASON QUICK-NAV ──────────────────────────────────────────────── */}
      <div className="border-y border-white/[0.07] bg-white/[0.02]">
        <div className="mx-auto max-w-6xl overflow-x-auto px-4 py-3">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="mr-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/25">
              Jump to
            </span>
            {seasonNums.map((sn) => (
              <a
                key={sn}
                href={`#season-${sn}`}
                className="rounded px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white/45 transition hover:bg-white/10 hover:text-white"
              >
                S{sn}
              </a>
            ))}
            <span className="mx-2 text-white/15">·</span>
            {seasonNums.map((sn) => (
              <Link
                key={sn}
                href={`/season/${sn}`}
                className="rounded px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[#6C00AF] transition hover:text-white/80"
              >
                Season {sn} ↗
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURED PRODUCTION ───────────────────────────────────────────── */}
      {featured && (
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-12">
          <p className="mb-4 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/35">
            Most Recent Production
          </p>
          <Link
            href={`/theatre/${featured.slug}`}
            className="group relative flex h-[360px] overflow-hidden rounded-2xl border border-white/10 transition duration-500 hover:border-[#FFCC00]/40 sm:h-[460px]"
          >
            <Image
              src={featured.posterUrl!}
              alt={featured.title}
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
              priority
            />
            {/* Left-to-right gradient so text stays legible */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F0A10]/92 via-[#0F0A10]/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0A10]/55 to-transparent" />

            {/* Text block */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:justify-center sm:p-12">
              <p
                className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.25em]"
                style={{ color: "#FFCC00" }}
              >
                Season {featured.season} · {featured.year} · {featured.location}
              </p>
              <h2
                className="max-w-md leading-tight text-white"
                style={{
                  fontFamily: "var(--font-anton), system-ui, sans-serif",
                  fontSize: "clamp(2rem, 5vw, 4.2rem)",
                }}
              >
                {featured.title}
              </h2>
              {featured.festival && (
                <p className="mt-2 max-w-sm text-xs text-white/40">
                  {festivalShort(featured.festival)}
                </p>
              )}
              <div className="mt-6">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] transition duration-300 group-hover:bg-[#FFCC00]/10"
                  style={{ borderColor: "rgba(255,204,0,0.4)", color: "#FFCC00" }}
                >
                  Explore Production →
                </span>
              </div>
            </div>
          </Link>
          {/* Season link lives outside the card to avoid nested <a> tags */}
          <div className="mt-3 flex justify-start">
            <Link
              href={`/season/${featured.season}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/40 transition hover:border-white/35 hover:text-white/75"
            >
              Season {featured.season} Archive ↗
            </Link>
          </div>
        </section>
      )}

      {/* ── PRODUCTIONS BY SEASON ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-28">
        <div className="mb-10 border-t border-white/[0.08] pt-12">
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/35">
            The Full Archive
          </p>
          <h2
            className="text-white/90"
            style={{
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
            }}
          >
            All Productions
          </h2>
        </div>

        <div className="flex flex-col gap-16">
          {seasonNums.map((sn) => {
            const prods = bySeason.get(sn)!;
            const year = getSortYear(prods[0]);
            const locs = Array.from(new Set(prods.map((p) => p.location))).join(" · ");

            return (
              <div key={sn} id={`season-${sn}`}>
                {/* Season chapter heading */}
                <div className="mb-6 flex items-center gap-5 border-b border-white/[0.06] pb-4">
                  <span
                    aria-hidden
                    className="select-none font-black leading-none text-white/[0.05]"
                    style={{
                      fontFamily: "var(--font-anton), system-ui, sans-serif",
                      fontSize: "clamp(4rem, 9vw, 6.5rem)",
                    }}
                  >
                    {sn}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Link
                      href={`/season/${sn}`}
                      className="group/sl inline-flex w-fit items-center gap-2"
                    >
                      <span
                        className="rounded px-2.5 py-0.5 text-xs font-black uppercase tracking-[0.2em] text-[#241123] opacity-70 transition group-hover/sl:opacity-100"
                        style={{ backgroundColor: "#FFCC00" }}
                      >
                        Season {sn}
                      </span>
                      <span className="text-[0.6rem] text-white/25 transition group-hover/sl:text-white/55">
                        View full season ↗
                      </span>
                    </Link>
                    <span className="truncate text-[0.63rem] font-medium uppercase tracking-wider text-white/30">
                      {year} · {locs}
                    </span>
                  </div>
                </div>

                {/* Production cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {prods.map((p) => (
                    <ProductionCard key={p.slug} p={p} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom nav — link back to seasons and alumni */}
        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-10">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/alumni"
              className="rounded-full border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/50 transition hover:border-[#6C00AF] hover:text-white/80"
            >
              ← Alumni Directory
            </Link>
            <Link
              href="/story-map"
              className="rounded-full border border-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/50 transition hover:border-[#FFCC00]/50 hover:text-white/80"
            >
              Story Map →
            </Link>
          </div>
          <p className="text-[0.65rem] text-white/20">
            {earliestYear}–{latestYear} · {allProductions.length} productions across{" "}
            {uniqueLocations.size} locations
          </p>
        </div>
      </section>
    </main>
  );
}

// ── PRODUCTION CARD ──────────────────────────────────────────────────────

function ProductionCard({ p }: { p: Production }) {
  const hasPoster = Boolean(p.posterUrl && p.posterUrl.trim());
  const short = festivalShort(p.festival ?? undefined);
  const venue = festivalVenue(p.festival ?? undefined);

  return (
    <Link
      href={`/theatre/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-[#FFCC00]/35 hover:bg-white/[0.05] hover:shadow-xl"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
    >
      {/* Poster image or typographic fill */}
      <div className="relative h-44 w-full flex-shrink-0 overflow-hidden">
        {hasPoster ? (
          <>
            <Image
              src={p.posterUrl!}
              alt={p.title}
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.06]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0F0A10]/80 via-transparent to-transparent" />
          </>
        ) : (
          /* Typographic fill for productions without a poster */
          <div
            className="absolute inset-0 flex flex-col justify-end p-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(108,0,175,0.22) 0%, rgba(36,17,35,0.55) 55%, rgba(15,10,16,0.92) 100%)",
            }}
          >
            {/* Decorative season number watermark */}
            <span
              aria-hidden
              className="absolute right-3 top-2 select-none font-black leading-none text-white/[0.06]"
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "5rem",
              }}
            >
              {p.season}
            </span>
            <p
              className="relative z-10 uppercase leading-tight text-white/80"
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "clamp(1rem, 3vw, 1.55rem)",
              }}
            >
              {p.title}
            </p>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-1.5 px-4 py-3">
        {/* Year / Season / Location meta */}
        <div className="flex items-center justify-between gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/35">
          <span>
            {p.year}
            {p.season ? ` · S${p.season}` : ""}
          </span>
          <span className="truncate text-right">{p.location}</span>
        </div>

        {/* Title */}
        <h3
          className="text-sm leading-snug text-white/85 transition group-hover:text-white"
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700,
          }}
        >
          {p.title}
        </h3>

        {/* Festival / context */}
        {short && (
          <p className="mt-0.5 line-clamp-1 text-[0.62rem] text-white/30">{short}</p>
        )}

        {/* Venue as bottom tag */}
        {venue && (
          <p className="mt-auto pt-2 text-[0.58rem] font-medium uppercase tracking-wider text-[#6C00AF]/60">
            {venue}
          </p>
        )}
      </div>
    </Link>
  );
}
