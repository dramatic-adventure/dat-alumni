"use client";

import { useEffect, useState } from "react";
import StickyNote, { StickyNoteItem } from "@/components/shared/StickyNote";
import SeasonsGrid from "@/components/alumni/SeasonsGrid";
import FeaturedAlumni from "@/components/alumni/FeaturedAlumni";
import AlumniSearch from "@/components/alumni/AlumniSearch";
import AlumniResults from "@/components/alumni/AlumniResults";
import { loadVisibleAlumni } from "@/lib/loadAlumni";
import { getRecentUpdates } from "@/lib/getRecentUpdates";

interface AlumniPageProps {
  highlights: { name: string; roles?: string[]; slug: string; headshotUrl?: string }[];
}

export default function AlumniPage({ highlights }: AlumniPageProps) {
  const [updates, setUpdates] = useState<StickyNoteItem[]>([]);
  const [alumniData, setAlumniData] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const alumni = await loadVisibleAlumni();
      setAlumniData(alumni);

      const recent = getRecentUpdates(alumni).map((u) => ({
        text: u.message,
        link: `/alumni/${u.slug}`,
      }));
      setUpdates([...recent].sort(() => Math.random() - 0.5).slice(0, 5));
    }
    fetchData();
  }, []);

  return (
    <main className="px-4 md:px-6 py-12 max-w-7xl mx-auto">
      <header className="text-center mb-12">
        <h1
          className="text-5xl md:text-6xl text-[#241123] uppercase tracking-wider"
          style={{ fontFamily: "Anton" }}
        >
          Alumni
        </h1>
        <p className="mt-4 text-lg text-[#241123] max-w-2xl mx-auto">
          Our growing family of artists and adventurers. These are the people who said yes to the journey—and left their mark on every story we’ve told together.
        </p>
      </header>

      <AlumniSearch alumniData={alumniData} onResults={setResults} />

      {results.length > 0 && (
        <section className="mb-12">
          <AlumniResults results={results} />
        </section>
      )}

      <FeaturedAlumni highlights={highlights} />

      <section className="mb-16">
        <StickyNote
          title="Recent Updates"
          items={updates}
          linkText="Explore All Alumni →"
          linkUrl="/alumni"
        />
      </section>

      <SeasonsGrid />
    </main>
  );
}
