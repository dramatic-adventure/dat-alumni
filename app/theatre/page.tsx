// app/theatre/page.tsx
import Link from "next/link";
import Image from "next/image";
import { productionMap, type Production } from "@/lib/productionMap";

function toYearNumber(year: Production["year"]): number {
  if (typeof year === "number") return year;

  const matches = String(year).match(/\d{4}/g);
  if (!matches || matches.length === 0) return 0;

  // Use the *second* / last 4-digit year in the string
  const last = matches[matches.length - 1];
  return Number(last) || 0;
}

function sortProductions(a: Production, b: Production) {
  const yearA = toYearNumber(a.year);
  const yearB = toYearNumber(b.year);

  if (yearA !== yearB) return yearB - yearA;
  if (a.season !== b.season) return (b.season || 0) - (a.season || 0);
  return a.title.localeCompare(b.title);
}

export default function TheatreIndexPage() {
  const productions = Object.values(productionMap).sort(sortProductions);

  return (
    <main className="min-h-screen bg-[#0F0A10] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#6C00AF22,_transparent_55%),_radial-gradient(circle_at_bottom,_#FFCC0022,_transparent_55%)]" />

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14">
        <header className="mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#FFCC00] uppercase">
            Theatre
          </p>
          <h1
            className="mt-2 text-4xl tracking-wide sm:text-5xl"
            style={{ fontFamily: "var(--font-anton), system-ui, sans-serif" }}
          >
            One Journey, Many Productions
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white/75">
            Explore the plays, devised works, and festivals that have shaped
            Dramatic Adventure Theatre&apos;s first decades of rugged,
            travel-based storytelling.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {productions.map((p) => (
            <Link
              key={p.slug}
              href={`/theatre/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition hover:-translate-y-1 hover:border-[#FFCC00]/70 hover:shadow-lg"
            >
              <div className="relative h-52 w-full overflow-hidden bg-[#241123]/60">
                {p.posterUrl ? (
                  <Image
                    src={p.posterUrl}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-xs text-white/55">
                    {p.festival || p.location || p.title}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0F0A10]/70 via-transparent to-transparent" />
              </div>

              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/50">
                  <span>
                    {p.year} {p.season ? `• Season ${p.season}` : null}
                  </span>
                  <span className="truncate">{p.location}</span>
                </div>

                <h2
                  className="text-lg leading-tight tracking-wide text-white"
                  style={{ fontFamily: "var(--font-anton), system-ui, sans-serif" }}
                >
                  {p.title}
                </h2>

                {p.festival && (
                  <p className="line-clamp-2 text-xs text-white/70">
                    {p.festival}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
