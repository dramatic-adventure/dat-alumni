"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StoryRow } from "@/lib/types";
import StoryMedia from "./StoryMedia";
import ThumbnailMedia from "./ThumbnailMedia";

interface FeaturedStoriesProps {
  stories: StoryRow[];
}

export default function FeaturedStories({ stories }: FeaturedStoriesProps) {
  const [showAll, setShowAll] = useState(false);

  const validStories = stories.filter(
    (s) => s && s.slug && s.title && s.story
  );

  if (validStories.length === 0) return null;

  const coverStory =
    validStories.find(
      (s) =>
        typeof s.imageUrl === "string" &&
        s.imageUrl.trim() !== "" &&
        !s.imageUrl.includes("placeholder") &&
        !s.imageUrl.includes("missing")
    ) || validStories[0];

  const sidebarStories = validStories
    .filter((s) => s.slug !== coverStory.slug)
    .slice(0, 3);

  const additionalStories = validStories.filter(
    (s) =>
      s.slug !== coverStory.slug &&
      !sidebarStories.some((side) => side.slug === s.slug)
  );

  const hasExtraStories = validStories.length >= 5;

  return (
    <section style={{ padding: "0 0px", marginBottom: "0.2rem", maxWidth: "100%" }}>
      <h2
        style={{
          backgroundColor: "#FFCC00",
          color: "#000",
          fontFamily: "Anton, sans-serif",
          fontSize: "3.5rem",
          letterSpacing: "0.2rem",
          fontWeight: 400,
          textTransform: "uppercase",
          display: "inline-block",
          padding: "0rem 0.4rem",
          marginBottom: "1rem",
        }}
      >
        Stories from the Field
      </h2>

      {/* Cover + Sidebar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "3rem",
          alignItems: "flex-start",
        }}
      >
        {/* Cover Story */}
        <Link
          href={`/story/${coverStory.slug}`}
          style={{
            flex: "1 1 45%",
            textDecoration: "none",
            color: "inherit",
            minWidth: "320px",
          }}
        >
          <StoryMedia imageUrl={coverStory.imageUrl} title={coverStory.title} />
          <h3 style={{ fontSize: "2.6rem", fontFamily: "Anton, sans-serif", marginBottom: "0.25rem", color: "#241123" }}>
            {coverStory.title}
          </h3>
          <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: "1rem", color: "#333", lineHeight: 1 }}>
            {coverStory.story?.slice(0, 160)}...
          </p>
        </Link>

        {/* Sidebar */}
        {sidebarStories.length > 0 && (
          <div
            style={{
              flex: "1 1 35%",
              display: "flex",
              flexDirection: "column",
              gap: "3rem",
              minWidth: "240px",
            }}
          >
            {sidebarStories.map((story) => (
              <Link
                key={story.slug}
                href={`/story/${story.slug}`}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "1rem",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <ThumbnailMedia imageUrl={story.imageUrl} title={story.title} />
                <div>
                  <h4 style={{ fontFamily: "Anton, sans-serif", fontSize: "1.5rem", marginBottom: "0.25rem", color: "#241123" }}>
                    {story.title}
                  </h4>
                  <p style={{ fontSize: "0.9rem", fontFamily: '"DM Sans", sans-serif', color: "#444", lineHeight: 1 }}>
                    {story.story?.slice(0, 100)}...
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* View All Button */}
      {hasExtraStories && !showAll && (
        <div style={{ marginTop: "1.5rem" }}>
          <button
            onClick={() => setShowAll(true)}
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: "1.2rem",
              fontWeight: 600,
              color: "#241123",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            View All Stories →
          </button>
        </div>
      )}

      {/* Grid of Additional Stories */}
      {showAll && additionalStories.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            {additionalStories.map((story) => (
              <Link
                key={story.slug}
                href={`/story/${story.slug}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <ThumbnailMedia imageUrl={story.imageUrl} title={story.title} />
                <h4 style={{ fontFamily: "Anton, sans-serif", fontSize: "1.5rem", marginBottom: "0.25rem", color: "#241123" }}>
                  {story.title}
                </h4>
                <p style={{ fontSize: "0.95rem", fontFamily: '"DM Sans", sans-serif', color: "#444", lineHeight: 1 }}>
                  {story.story?.slice(0, 120)}...
                </p>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={() => setShowAll(false)}
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "#241123",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Show Less ↑
            </button>
          </div>
        </>
      )}
    </section>
  );
}
