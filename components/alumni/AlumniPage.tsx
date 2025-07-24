"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import SeasonsCarouselAlt from "@/components/alumni/SeasonsCarouselAlt";
import FeaturedAlumni from "@/components/alumni/FeaturedAlumni";
import AlumniResults from "@/components/alumni/AlumniResults";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { getRecentUpdates } from "@/lib/getRecentUpdates";

const UpdatesPanel = dynamic(() => import("@/components/shared/UpdatesPanel"), {
  ssr: false,
  loading: () => <div className="text-center py-8 text-[#6C00AF]">Loading updates...</div>,
});

interface AlumniPageProps {
  highlights: { name: string; roles?: string[]; slug: string; headshotUrl?: string }[];
}

interface UpdateItem {
  text: string;
  link?: string;
  author?: string;
}

export default function AlumniPage({ highlights }: AlumniPageProps) {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [alumniData, setAlumniData] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      const alumni = await loadVisibleAlumni();
      setAlumniData(alumni);

      const recent = getRecentUpdates(alumni).map((u: any) => ({
        text: u.message || "Update coming soon...",
        link: `/alumni/${u.slug}`,
        author: u.name || "ALUM",
      }));

      setUpdates(
        recent.length > 0
          ? [...recent].sort(() => Math.random() - 0.5).slice(0, 5)
          : [
              { text: "Just joined a new Broadway cast!", author: "ALEX", link: "/alumni/alex" },
              { text: "Launched a theatre program in Ecuador.", author: "JAMIE", link: "/alumni/jamie" },
              { text: "Published a play about climate change.", author: "PRIYA", link: "/alumni/priya" },
            ]
      );
    }
    fetchData();
  }, []);

  return (
    <div style={{ marginTop: "-750px" }}>
      {/* ✅ HERO */}
      <section style={{ position: "relative", width: "100%", height: "55vh", boxShadow: "0px 0px 33px rgba(0.8,0.8,0.8,0.8)", zIndex: 1 }}>
        <Image
          src="/images/alumni hero.jpg"
          alt="Alumni Hero"
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
            ALUMNI
          </h1>
        </div>
      </section>

      <main style={{ marginTop: "55vh", padding: "2rem 0" }}>
        {/* ✅ Intro Section */}
        <section style={{ width: "70%", maxWidth: "1200px", margin: "0 auto", marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: "Space Grotesk, sans-serif",
              color: "#6C00AF",
              fontSize: "clamp(2.8rem, 5vw, 3.25rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Meet our family of storytellers.
          </h2>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              color: "#f2f2f2",
              opacity: "0.55",
              fontSize: "clamp(1.4rem, 1.5vw, 1.8rem)",
              lineHeight: "1.6",
              marginBottom: "2rem",
            }}
          >
            Each season brings together bold creators who take the journey and stand alongside our
            neighbors—collaborating to craft new stories rooted in real experiences and honest,
            human connection. Explore alumni, revisit past projects, and see how these journeys
            continue to inspire.
          </p>

          {/* ✅ Search Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
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
              style={{ width: "35px", height: "35px", marginRight: "0.25rem" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search alumni by name, program, location..."
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                if (!value.trim()) return setResults([]);
                const lowerQuery = value.toLowerCase();
                const filtered = alumniData.filter(
                  (item) =>
                    (item.name && item.name.toLowerCase().includes(lowerQuery)) ||
                    (item.roles || []).some((role: string) => role.toLowerCase().includes(lowerQuery))
                );
                setResults(filtered);
              }}
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
        </section>

        {/* ✅ Search Results */}
        {results.length > 0 && (
          <section style={{ width: "90%", margin: "0 auto" }}>
            <AlumniResults results={results} />
          </section>
        )}

{/* ✅ Headline Row */}
<section style={{ width: "100%", textAlign: "center", margin: "2rem 0" }}>
  <h2
    style={{
      fontFamily: "Anton, sans-serif",
      fontSize: "clamp(2rem, 6vw, 8rem)",
      textTransform: "uppercase",
      color: "#241123",
      margin: 0,
    }}
  >
    Highlights from the DAT Family
  </h2>
</section>


        {/* ✅ Two-Column Layout */}
        <div className="alumni-grid">
          <div className="featured-col">
            <FeaturedAlumni highlights={highlights} />
          </div>
          <div className="updates-col">
            <UpdatesPanel updates={updates} linkText="Explore All Alumni" linkUrl="/alumni" />
          </div>
        </div>

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


        {/* ✅ Responsive Grid CSS */}
        <style jsx>{`
          .alumni-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
            width: 90%;
            max-width: 1200px;
            margin: 0 auto;
            align-items: start;
          }

          @media (max-width: 1100px) {
            .alumni-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>
    </div>
  );
}
