"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import AlumniSearch from "@/components/alumni/AlumniSearch";
import { loadVisibleAlumni } from "@/lib/loadAlumni";

export default function DirectoryPage() {
  const [alumniData, setAlumniData] = useState<any[]>([]);
  const [primaryResults, setPrimaryResults] = useState<any[]>([]);
  const [secondaryResults, setSecondaryResults] = useState<any[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sortOption, setSortOption] = useState("last");

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

  /** ✅ Load Alumni */
  useEffect(() => {
    async function fetchData() {
      const alumni = await loadVisibleAlumni();
      setAlumniData(alumni);
    }
    fetchData();
  }, []);

  /** ✅ Dropdown options */
  const programs = useMemo(() => {
    const set = new Set<string>();
    alumniData.forEach((a) => a.programs?.forEach((p: string) => set.add(p)));
    return Array.from(set).sort();
  }, [alumniData]);

  const seasons = useMemo(() => {
    const set = new Set<string>();
    alumniData.forEach((a) => a.seasons?.forEach((s: string) => set.add(s)));
    return Array.from(set).sort();
  }, [alumniData]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    alumniData.forEach((a) => a.location && set.add(a.location));
    return Array.from(set).sort();
  }, [alumniData]);

  const roles = useMemo(() => {
    const set = new Set<string>();
    alumniData.forEach((a) => a.roles?.forEach((r: string) => set.add(r)));
    return Array.from(set).sort();
  }, [alumniData]);

  /** ✅ Apply advanced filters + sort to combined results */
  const applyFiltersAndSort = (list: any[]) => {
    let result = [...list];

    if (filters.program) result = result.filter((a) => a.programs?.includes(filters.program));
    if (filters.season) result = result.filter((a) => a.seasons?.includes(filters.season));
    if (filters.location) result = result.filter((a) => a.location === filters.location);
    if (filters.role) result = result.filter((a) => a.roles?.includes(filters.role));
    if (filters.statusFlag) result = result.filter((a) => a.statusFlags?.includes(filters.statusFlag));
    if (filters.identityTag) result = result.filter((a) => a.identityTags?.includes(filters.identityTag));
    if (filters.language) result = result.filter((a) => a.languages?.includes(filters.language));
    if (filters.updatedOnly) result = result.filter((a) => a.updatedRecently);

    result.sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";
      const firstA = nameA.split(" ")[0];
      const firstB = nameB.split(" ")[0];
      const lastA = nameA.split(" ").slice(-1)[0];
      const lastB = nameB.split(" ").slice(-1)[0];

      if (sortOption === "recent") return (b.updatedAt || 0) - (a.updatedAt || 0);
      if (sortOption === "first") return firstA.localeCompare(firstB);
      if (lastA === lastB) return firstA.localeCompare(firstB);
      return lastA.localeCompare(lastB);
    });

    return result;
  };

  /** ✅ Clear Filters */
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
  ];

  /** ✅ Dropdown Style */
  const dropdownStyle = (isActive: boolean) => ({
    padding: "0.4rem",
    fontSize: "0.85rem",
    borderRadius: "6px",
    fontFamily: "Space Grotesk",
    border: "0px solid #ccc",
    cursor: "pointer",
    backgroundColor: isActive ? "#F23359" : "#e5d2bd",
    color: isActive ? "#f2f2f2" : "#241123",
    opacity: 0.9,
    fontWeight: 500,
    letterSpacing: "0.04rem",
    transition: "opacity 0.3s ease",
  });

  // After fetching alumniData
const mainResults = applyFiltersAndSort(primaryResults.length ? primaryResults : alumniData);
const extraResults = applyFiltersAndSort(secondaryResults);

  return (
    <div style={{ marginTop: "-750px" }}>
      {/* ✅ HERO */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "55vh",
          boxShadow: "0px 0px 33px rgba(0,0,0,0.5)",
        }}
      >
        <Image
          src="/images/alumni hero.jpg"
          alt="Alumni Directory Hero"
          fill
          priority
          className="object-cover object-center"
        />
        <div style={{ position: "absolute", bottom: "1rem", right: "5%" }}>
          <h1
            style={{
              fontFamily: "Anton, sans-serif",
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

      {/* ✅ MAIN */}
      <main style={{ marginTop: "55vh", backgroundImage: "url('/images/kraft-texture.png')", backgroundSize: "cover", padding: "2rem 0" }}>
        <section style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "Space Grotesk", color: "#6C00AF", fontSize: "clamp(2.8rem, 5vw, 3.25rem)", fontWeight: 500, marginBottom: "1rem" }}>
            Explore our global community.
          </h2>

          {/* ✅ Search + Sort */}
          <div style={{ display: "flex", gap: "1rem", alignItems: "stretch" }}>
  <div style={{ flex: 1, height: "47px" }}>
    <AlumniSearch
      alumniData={alumniData}
      filters={filters} // Directory only
      onResults={(primary, secondary) => {
        setPrimaryResults(primary);
        setSecondaryResults(secondary);
      }}
    />
  </div>

            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              style={{
                height: "47px",
                fontFamily: "Space Grotesk",
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

            {/* Sort */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontFamily: "Space Grotesk", fontWeight: 600, color: "#F6E4C1" }}>Sort by:</span>
              {["last", "first", "recent"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortOption(opt)}
                  style={{
                    backgroundColor: sortOption === opt ? "#6C00AF" : "#F6E4C1",
                    color: sortOption === opt ? "#f2f2f2" : "#241123",
                    padding: "0.4rem 0.8rem",
                    border: "none",
                    borderRadius: "6px",
                    fontFamily: "Space Grotesk",
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
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {advancedOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ backgroundColor: "rgba(36,17,35,0.3)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}
              >
                <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>
                  {filterOptions.map((filter) => (
                    <select
                      key={filter.name}
                      value={(filters[filter.name as keyof typeof filters] as string) || ""}
                      onChange={(e) => setFilters({ ...filters, [filter.name as keyof typeof filters]: e.target.value })}
                      style={dropdownStyle(Boolean(filters[filter.name as keyof typeof filters]))}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                    >
                      <option value="">{filter.label}</option>
                      {filter.options.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  ))}
                  <label style={{ fontFamily: "Space Grotesk", color: "#F6E4C1", fontWeight: 500, fontSize: "0.85rem" }}>
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
                      fontFamily: "Space Grotesk",
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

        {/* ✅ Result Count */}
        <div
          style={{
            textAlign: "center",
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 450,
            fontSize: "1.4rem",
            color: "#F6E4C1",
            opacity: 0.9,
            margin: "1.5rem 0rem",
          }}
        >
          {mainResults.length + extraResults.length} alumni found
        </div>

        {/* Main Alumni Grid */}
        <section style={{ width: "90%", maxWidth: "1200px", margin: "1.75rem auto" }}>
          <div style={{ display: "grid", justifyContent: "center", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1.5rem" }}>
            {mainResults.map((alum, idx) => (
              <MiniProfileCard key={idx} name={alum.name} role={alum.roles?.join(", ")} slug={alum.slug} headshotUrl={alum.headshotUrl} />
            ))}
          </div>
        </section>

        {/* ✅ Secondary Matches */}
        {extraResults.length > 0 && (
          <section style={{ width: "90%", maxWidth: "1200px", margin: "2rem auto" }}>
            <h4 style={{ fontFamily: "Space Grotesk", color: "#F6E4C1", marginBottom: "1rem", fontSize: "1.3rem" }}>
              We found some additional matches that might interest you:
            </h4>
            <div style={{ display: "grid", justifyContent: "center", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1.5rem" }}>
              {extraResults.map((alum, idx) => (
                <MiniProfileCard key={`extra-${idx}`} name={alum.name} role={alum.roles?.join(", ")} slug={alum.slug} headshotUrl={alum.headshotUrl} />
              ))}
            </div>
          </section>
        )}

        {/* ✅ Seasons Carousel */}
        <section
          style={{
            width: "100%",
            backgroundColor: "#6C00AF",
            boxShadow: "0px 0px 33px rgba(0.8,0.8,0.8,0.8)",
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
  );
}
