"use client";

import React from "react";
import PosterStrip from "@/components/shared/PosterStrip";

interface Poster {
  title: string;
  imageUrl: string;
  url: string;
}

interface FeaturedProductionsSectionProps {
  productions: {
    title: string;
    slug: string;
    url: string;
    year: number;
  }[];
}

export default function FeaturedProductionsSection({
  productions,
}: FeaturedProductionsSectionProps) {
  if (!productions || productions.length === 0) return null;

  const posters: Poster[] = productions.map((p) => ({
    title: p.title,
    imageUrl: `/posters/${p.slug}-landscape.jpg`,
    url: p.url,
  }));

  return (
    <div
      style={{
        backgroundColor: "#16697A",
        padding: "3rem 60px",
        display: "flex",
      }}
    >
      <PosterStrip posters={posters} justify="center" />
    </div>
  );
}
