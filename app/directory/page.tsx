"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import MiniProfileCard from "@/components/profile/MiniProfileCard";
import { loadVisibleAlumni } from "@/lib/loadAlumni";

export default function DirectoryPage() {
  const [alumniData, setAlumniData] = useState<any[]>([]);
  const [filteredAlumni, setFilteredAlumni] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [filters, setFilters] = useState({
    program: "",
    season: "",
    location: "",
    role: "",
    updatedOnly: false,
  });

  // ✅ Load alumni on mount
  useEffect(() => {
    async function fetchData() {
      const alumni = await loadVisibleAlumni();
      setAlumniData(alumni);
      setFilteredAlumni(alumni);
    }
    fetchData();
  }, []);

  // ✅ Build dynamic filter options
  const programs = useMemo(() => {
    const set = new Set<string>();
    alumniData.forEach((a) => a.programs?.forEach((p: string) => set.add(p)));
    return Array.from(set);
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

  // ✅ Filter Logic
  useEffect(() => {
    let result = [...alumniData];

    // Keyword
    if (query.trim()) {
      const lower = query.toLowerCase();
      result = result.filter(
        (a) =>
          a.name?.toLowerCase().includes(lower) ||
          a.roles?.some((r: string) => r.toLowerCase().includes(lower))
      );
    }

    // Advanced filters
    if (filters.program) {
      result = result.filter((a) => a.programs?.includes(filters.program));
    }
    if (filters.season) {
      result = result.filter((a) => a.seasons?.includes(filters.season));
    }
    if (filters.location) {
      result = result.filter((a) => a.location === filters.location);
    }
    if (filters.role) {
      result = result.filter((a) => a.roles?.includes(filters.role));
    }
    if (filters.updatedOnly) {
      result = result.filter((a) => a.updatedRecently); // Assuming boolean flag
    }

    setFilteredAlumni(result);
  }, [query, filters, alumniData]);

  const clearFilters = () => {
    setFilters({
      program: "",
      season: "",
      location: "",
      role: "",
      updatedOnly: false,
    });
    setQuery("");
  };

  return (
    <div style={{ marginTop: "-750px" }}>
      {/* ✅ HERO */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "55vh",
          boxShadow: "0px 0px 33px rgba(0,0,0,0.5)",
          zIndex: 1,
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
      <main
        style={{
          marginTop: "55vh",
          backgroundImage: "url('/images/kraft-texture.png')",
          backgroundSize: "cover",
          padding: "2rem 0",
        }}
      >
        {/* ✅ Intro & Search */}
        <section style={{ width: "90%", maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              color: "#6C00AF",
              fontSize: "clamp(2.8rem, 5vw, 3.25rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Explore our global community.
          </h2>

          {/* ✅ Search Bar & Advanced Toggle */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                backgroundColor: "#F6E4C1",
                padding: "0.5rem",
                borderRadius: "6px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="#241123"
                style={{ width: "30px", height: "30px", marginRight: "0.25rem" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search alumni by keyword..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.25rem 0.5rem",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1.2rem",
                  backgroundColor: "#F6E4C1",
                  border: "none",
                }}
              />
            </div>
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              style={{
                fontFamily: "Space Grotesk",
                fontWeight: 600,
                backgroundColor: "#6C00AF",
                color: "#f2f2f2",
                padding: "0.75rem 1.25rem",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Advanced Search
            </button>
          </div>

          {/* ✅ Advanced Search Panel */}
          <AnimatePresence>
            {advancedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  backgroundColor: "rgba(36, 17, 35, 0.2)",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                }}
              >
                {/* Filters */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Keyword"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ padding: "0.5rem" }}
                  />
                  <select
                    value={filters.program}
                    onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                  >
                    <option value="">Program</option>
                    {programs.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <select
                    value={filters.season}
                    onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                  >
                    <option value="">Season</option>
                    {seasons.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  >
                    <option value="">Location</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  >
                    <option value="">Role</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <label>
                    <input
                      type="checkbox"
                      checked={filters.updatedOnly}
                      onChange={(e) => setFilters({ ...filters, updatedOnly: e.target.checked })}
                    /> Recently Updated
                  </label>
                </div>
                <div style={{ marginTop: "1rem" }}>
                  <button
                    onClick={clearFilters}
                    style={{
                      backgroundColor: "#F23359",
                      color: "#fff",
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ✅ Active Filters */}
        {Object.values(filters).some((val) => val) && (
          <div style={{ width: "90%", margin: "1rem auto", color: "#f2f2f2" }}>
            Active Filters:
            {Object.entries(filters).map(
              ([key, val]) => val && (
                <span key={key} style={{ marginLeft: "0.5rem", backgroundColor: "#6C00AF", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                  {key}: {val}
                </span>
              )
            )}
          </div>
        )}

        {/* ✅ Alumni Grid */}
        <section style={{ width: "90%", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {filteredAlumni.map((alum, index) => (
              <MiniProfileCard
                key={index}
                name={alum.name}
                role={alum.roles?.join(", ")}
                slug={alum.slug}
                headshotUrl={alum.headshotUrl}
              />
            ))}
          </div>
        </section>

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
