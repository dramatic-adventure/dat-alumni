"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import AlumniSearch from "@/components/alumni/AlumniSearch/AlumniSearch";
import { HeadshotProvider } from "@/components/profile/HeadshotProvider";

import type {
  EnrichedProfileLiveRow,
  ProfileLiveRow,
} from "@/components/alumni/AlumniSearch/enrichAlumniData.server";

interface AlumniItem {
  name: string;
  slug: string;
  roles?: string[];
  location?: string;
  programs?: string[];
  seasons?: string[];
  statusFlags?: string[];
  identityTags?: string[];
  languages?: string[];
  updatedRecently?: boolean;
  updatedAt?: number;
  headshotUrl?: string;
  headshotCacheKey?: string | number;
}

type SortOption = "last" | "first" | "recent";

function splitCsvish(raw?: string | null): string[] {
  return String(raw || "")
    .split(/[,;\n|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function driveViewUrlFromId(id?: string | null) {
  const fid = String(id || "").trim();
  if (!fid) return "";
  // uc?export=view is a stable “direct view” URL for Drive file IDs
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fid)}`;
}

function driveUrlFromId(id?: string | null) {
  const v = String(id ?? "").trim();
  if (!v) return "";
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(v)}`;
}

/** Convert Profile-Live row (string-ish fields) into the directory AlumniItem shape */
function liveRowToAlumniItem(r: ProfileLiveRow, enrichedBySlug: Map<string, EnrichedProfileLiveRow>): AlumniItem {
  // roles/programs/tags/statusFlags can be stored as CSV-ish strings in Profile-Live
  const roles = splitCsvish(r.roles);
  const programs = splitCsvish((r as any).programs);
  const statusFlags = splitCsvish((r as any).statusFlags);
  const identityTags = splitCsvish((r as any).tags);

  // languages: only if your ProfileLiveRow includes it (some builds don’t)
  const languages = splitCsvish((r as any).languages);

  const updatedAt =
    r.updatedAt && !Number.isNaN(Date.parse(r.updatedAt))
      ? new Date(r.updatedAt).getTime()
      : undefined;

  return {
    name: r.name || "",
    slug: r.slug || "",
    roles,
    location: r.location || "",
    programs,
    statusFlags,
    identityTags,
    languages,
    updatedAt,
    // heuristic if you want it (otherwise filter UI still works)
    updatedRecently: typeof updatedAt === "number" ? Date.now() - updatedAt < 1000 * 60 * 60 * 24 * 90 : false,
    headshotUrl: (() => {
  const bySlug = enrichedBySlug.get(r.slug);
  const byCanon = enrichedBySlug.get((r as any).canonicalSlug);

  // ✅ Deterministic + reliable:
  // Enriched headshotUrl is already either `/api/img?url=...` or `/images/default-headshot.png`
  return bySlug?.headshotUrl || byCanon?.headshotUrl || "/images/default-headshot.png";
})(),

    headshotCacheKey: (() => {
      const bySlug = enrichedBySlug.get(r.slug);
      const byCanon = enrichedBySlug.get((r as any).canonicalSlug);

      // ✅ Cache key should come from Profile-Media uploadedAt via enrichment.
      return bySlug?.headshotCacheKey || byCanon?.headshotCacheKey || undefined;
    })(),
  };
}

export default function DirectoryPageClient({
  alumni,
  enrichedData = [],
}: {
  alumni: AlumniItem[];
  enrichedData?: EnrichedProfileLiveRow[];
}) {

  const [primaryResults, setPrimaryResults] = useState<AlumniItem[]>([]);
  const [secondaryResults, setSecondaryResults] = useState<AlumniItem[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("last");
  const [query, setQuery] = useState<string>("");

  const enrichedBySlug = useMemo(() => {
    const m = new Map<string, EnrichedProfileLiveRow>();
        enrichedData.forEach((r) => {
      m.set(r.slug, r);
      if (r.canonicalSlug) m.set(r.canonicalSlug, r);
    });
    return m;
  }, [enrichedData]);


  const [filters, setFilters] = useState({
    program: "",
    season: "",
    location: "",
    role: "",
    statusFlag: "",
    identityTag: "",
    language: "",
    updatedOnly: false,
  });

  /** Dropdown options (derived from props) */
  const programs = useMemo(() => {
    const set = new Set<string>();
    alumni.forEach((a) => a.programs?.forEach((p) => set.add(p)));
    return Array.from(set).sort();
  }, [alumni]);

  const seasons = useMemo(() => {
    const set = new Set<string>();
    alumni.forEach((a) => a.seasons?.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [alumni]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    alumni.forEach((a) => a.location && set.add(a.location));
    return Array.from(set).sort();
  }, [alumni]);

  const roles = useMemo(() => {
    const set = new Set<string>();
    alumni.forEach((a) => a.roles?.forEach((r) => set.add(r)));
    return Array.from(set).sort();
  }, [alumni]);

  /** Filter + sort helper */
  const applyFiltersAndSort = (list: AlumniItem[]): AlumniItem[] => {
    let result = [...list];

    if (filters.program) result = result.filter((a) => a.programs?.includes(filters.program));
    if (filters.season) result = result.filter((a) => a.seasons?.includes(filters.season));
    if (filters.location) result = result.filter((a) => a.location === filters.location);
    if (filters.role) result = result.filter((a) => a.roles?.includes(filters.role));
    if (filters.statusFlag) result = result.filter((a) => a.statusFlags?.includes(filters.statusFlag));
    if (filters.identityTag) result = result.filter((a) => a.identityTags?.includes(filters.identityTag));
    if (filters.language) result = result.filter((a) => a.languages?.includes(filters.language));
    if (filters.updatedOnly) result = result.filter((a) => a.updatedRecently);

    // Keep relevance order if query is active; otherwise apply selected alpha/recent sort
    if (!query) {
      result.sort((a, b) => {
        const nameA = a.name || "";
        const nameB = b.name || "";
        const firstA = nameA.split(" ")[0] || "";
        const firstB = nameB.split(" ")[0] || "";
        const lastA = nameA.split(" ").slice(-1)[0] || "";
        const lastB = nameB.split(" ").slice(-1)[0] || "";

        if (sortOption === "recent") return (b.updatedAt || 0) - (a.updatedAt || 0);
        if (sortOption === "first") return firstA.localeCompare(firstB);
        if (lastA === lastB) return firstA.localeCompare(firstB);
        return lastA.localeCompare(lastB);
      });
    }

    return result;
  };

  /** Clear filters */
  const clearFilters = () => {
    setFilters({
      program: "",
      season: "",
      location: "",
      role: "",
      statusFlag: "",
      identityTag: "",
      language: "",
      updatedOnly: false,
    });
  };

  const filterOptions = [
    { name: "program", label: "PROGRAM", options: programs },
    { name: "season", label: "SEASON", options: seasons },
    { name: "location", label: "LOCATION", options: locations },
    { name: "role", label: "ROLE", options: roles },
    { name: "statusFlag", label: "INVOLVEMENT", options: ["Resident Artist", "Fellow", "Board Member"] },
    { name: "identityTag", label: "TAGS", options: ["Indigenous", "LGBTQIA+", "POC"] },
    { name: "language", label: "LANGUAGE", options: ["English", "Spanish", "French", "Portuguese"] },
  ] as const;

  /** Which data to display (memoized to avoid extra work per keystroke) */
  const mainResults = useMemo(
    () => applyFiltersAndSort(query ? primaryResults : alumni),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alumni, primaryResults, query, filters, sortOption]
  );

  const extraResults = useMemo(
    () => (query ? applyFiltersAndSort(secondaryResults) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [secondaryResults, query, filters, sortOption]
  );

  return (
    <HeadshotProvider enrichedData={enrichedData || []}>
      <div>
        {/* HERO */}
        <section
          style={{
            position: "relative",
            width: "100%",
            height: "55vh",
            boxShadow: "0px 0px 33px rgba(0,0,0,0.5)",
          }}
        >
          <Image
            src="/images/alumni-hero.jpg"
            alt="Alumni Directory Hero"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
            <h1
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                fontSize: "clamp(4rem, 9vw, 10rem)",
                color: "#f2f2f2",
                textTransform: "uppercase",
                textShadow: "0 8px 20px rgba(0,0,0,0.8)",
                margin: 0,
              }}
            >
              DIRECTORY
            </h1>
          </div>
        </section>

        {/* MAIN */}
        <main
          style={{
            marginTop: "0vh",
            padding: "2rem 0",
          }}
        >
          <section style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
            <h2
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                color: "#6C00AF",
                opacity: 0.9,
                fontSize: "clamp(2.8rem, 5vw, 3.25rem)",
                fontWeight: 500,
                marginBottom: "3rem",
              }}
            >
              Explore our global community.
            </h2>

            {/* Search + Sort */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "stretch" }}>
              <div style={{ flex: 1, height: "47px" }}>
                <AlumniSearch
                  enrichedData={enrichedData}
                  filters={filters}
                  onResults={(primary: ProfileLiveRow[], secondary: ProfileLiveRow[], q: string) => {
                    setPrimaryResults(primary.map((r) => liveRowToAlumniItem(r, enrichedBySlug)));
                    setSecondaryResults(secondary.map((r) => liveRowToAlumniItem(r, enrichedBySlug)));
                    setQuery(q);
                  }}
                  showAllIfEmpty={true}
                  debug={false}
                />
              </div>

              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                style={{
                  height: "47px",
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 600,
                  backgroundColor: "#6C00AF",
                  color: "#f2f2f2",
                  padding: "0 1rem",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  letterSpacing: "0.1rem",
                  transition: "opacity 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                ADVANCED SEARCH
              </button>

              {/* Hide sort buttons if query exists */}
              {!query && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", color: "#F6E4C1" }}>
                    Sort by:
                  </span>
                  {(["last", "first", "recent"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSortOption(opt)}
                      style={{
                        backgroundColor: sortOption === opt ? "#6C00AF" : "#F6E4C1",
                        color: sortOption === opt ? "#f2f2f2" : "#241123",
                        padding: "0.4rem 0.8rem",
                        border: "none",
                        borderRadius: "6px",
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "opacity 0.3s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      {opt === "last" ? "Last Name" : opt === "first" ? "First Name" : "Recently Updated"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {advancedOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    backgroundColor: "rgba(36,17,35,0.4)",
                    padding: "1rem",
                    borderRadius: "8px",
                    margin: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gap: "0.5rem",
                      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                    }}
                  >
                    {filterOptions.map((filter) => (
                      <select
                        key={filter.name}
                        value={(filters[filter.name as keyof typeof filters] as string) || ""}
                        onChange={(e) =>
                          setFilters({ ...filters, [filter.name as keyof typeof filters]: e.target.value })
                        }
                        style={{
                          padding: "0.4rem",
                          fontSize: "0.85rem",
                          borderRadius: "6px",
                          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                          border: "0px solid #ccc",
                          cursor: "pointer",
                          backgroundColor: filters[filter.name as keyof typeof filters]
                            ? "#F23359"
                            : "#e5d2bd",
                          color: filters[filter.name as keyof typeof filters] ? "#f2f2f2" : "#241123",
                          opacity: 0.9,
                          fontWeight: 500,
                          letterSpacing: "0.04rem",
                          transition: "opacity 0.3s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        <option value="">{filter.label}</option>
                        {filter.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ))}

                    <label
                      style={{
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        color: "#F6E4C1",
                        fontWeight: 500,
                        fontSize: "0.85rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filters.updatedOnly}
                        onChange={(e) => setFilters({ ...filters, updatedOnly: e.target.checked })}
                      />{" "}
                      Recently Updated
                    </label>
                  </div>

                  <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
                    <button
                      onClick={clearFilters}
                      style={{
                        backgroundColor: "#F23359",
                        color: "#f2f2f2",
                        padding: "0.4rem 0.8rem",
                        border: "none",
                        borderRadius: "6px",
                        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                        fontWeight: 500,
                        cursor: "pointer",
                        letterSpacing: "0rem",
                        transition: "opacity 0.3s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      Reset Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Result Count */}
          <div
            style={{
              textAlign: "center",
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 450,
              fontSize: "1.2rem",
              color: "#F6E4C1",
              opacity: 0.8,
              margin: "1.5rem 0rem",
            }}
          >
            {mainResults.length + extraResults.length} alumni found
          </div>

          {/* Primary (or all if no query) */}
          <section
            style={{
              width: "90%",
              maxWidth: "1200px",
              margin: "1.75rem auto",
            }}
          >
            <h4
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 1000,
                letterSpacing: 0.1,
                color: "#F6E4C1",
                opacity: 0.8,
                marginBottom: "1rem",
                fontSize: "1.5rem",
              }}
            >
              Top matches:
            </h4>
            <div
              style={{
                display: "grid",
                justifyContent: "center",
                gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
                gap: "1.5rem",
                background: "rgba(36, 17, 35, 0.2)",
                borderRadius: "8px",
                padding: "2rem",
              }}
            >
              {mainResults.map((alum, idx) => {

                return (
                  <MiniProfileCard
                    key={alum.slug || String(idx)}
                    name={alum.name}
                    role={alum.roles?.join(", ") ?? ""}
                    slug={alum.slug}
                    priority={idx < 12}
                  />
                );
              })}

            </div>
          </section>

          {/* Secondary matches */}
          {extraResults.length > 0 && (
            <section
              style={{
                width: "90%",
                maxWidth: "1200px",
                margin: "2rem auto",
              }}
            >
              <h4
                style={{
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontWeight: 1000,
                  letterSpacing: 0.1,
                  color: "#F6E4C1",
                  opacity: 0.8,
                  marginBottom: "1rem",
                  fontSize: "1.5rem",
                }}
              >
                More matches you might like:
              </h4>
              <div
                style={{
                  display: "grid",
                  justifyContent: "center",
                  gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
                  gap: "1.5rem",
                  background: "rgba(36, 17, 35, 0.2)",
                  borderRadius: "8px",
                  padding: "2rem",
                }}
              >
                {extraResults.map((alum, idx) => {

                  return (
                    <MiniProfileCard
                      key={alum.slug || String(idx)}
                      name={alum.name}
                      role={alum.roles?.join(", ") ?? ""}
                      slug={alum.slug}
                      priority={idx < 12}
                    />
                  );
                })}

              </div>
            </section>
          )}

          {/* Seasons Carousel */}
          <section
            style={{
              width: "100%",
              backgroundColor: "#6C00AF",
              boxShadow: "0px 0px 33px rgba(0,0,0,0.8)",
              padding: "4rem 0",
              marginTop: "4rem",
            }}
          >
            <div style={{ width: "100%", margin: "0 auto" }}>
              <SeasonsCarouselAlt />
            </div>
          </section>
        </main>
      </div>
    </HeadshotProvider>
  );
}
