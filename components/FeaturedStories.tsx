"use client";

import React from "react";
import Link from "next/link";
import { StoryRow } from "@/lib/types";

interface FeaturedStoriesProps {
  stories: StoryRow[];
}

export default function FeaturedStories({ stories }: FeaturedStoriesProps) {
  // Filter valid stories
  const validStories = stories
    .filter(
      (story) =>
        story &&
        story.slug &&
        story.title &&
        story.story &&
        story.imageUrl &&
        story.imageUrl.trim() !== ""
    )
    .slice(0, 4);

  if (validStories.length === 0) return null;

  const coverStory = validStories[0];
  const sideStories = validStories.slice(1);

  return (
    <section style={{ marginTop: "3rem", padding: "0 1rem" }}>
      {/* 🔶 Header */}
      <h2
        style={{
          backgroundColor: "#FFCC00",
          color: "#000",
          fontFamily: "Anton, sans-serif",
          fontSize: "3rem",
          fontWeight: 700,
          textTransform: "uppercase",
          display: "inline-block",
          padding: "0.4rem 0.6rem",
          marginBottom: "2rem",
        }}
      >
        Notes from the Field
      </h2>

      {/* 📰 Layout */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        {/* 🌍 Cover Story (Left) */}
        <Link
          href={`/story/${coverStory.slug}`}
          style={{
            flex: "1 1 60%",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <img
            src={coverStory.imageUrl}
            alt={coverStory.title}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "6px",
              marginBottom: "1rem",
            }}
          />
          <h3
            style={{
              fontSize: "2rem",
              fontFamily: "Anton, sans-serif",
              marginBottom: "0.5rem",
              color: "#241123",
            }}
          >
            {coverStory.title}
          </h3>
          <p
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: "1rem",
              color: "#333",
              lineHeight: 1.5,
            }}
          >
            {coverStory.story?.slice(0, 160)}...
          </p>
        </Link>

        {/* 🧾 Sidebar Stories (Right) */}
        <div
          style={{
            flex: "1 1 35%",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {sideStories.map((story) => (
            <Link
              key={story.slug}
              href={`/story/${story.slug}`}
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "1rem",
                alignItems: "flex-start",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <img
                src={story.imageUrl}
                alt={story.title}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  flexShrink: 0,
                }}
              />
              <div>
                <h4
                  style={{
                    fontFamily: "Anton, sans-serif",
                    fontSize: "1.2rem",
                    marginBottom: "0.25rem",
                    color: "#241123",
                  }}
                >
                  {story.title}
                </h4>
                <p
                  style={{
                    fontSize: "0.9rem",
                    fontFamily: '"DM Sans", sans-serif',
                    color: "#444",
                    lineHeight: 1.4,
                  }}
                >
                  {story.story?.slice(0, 100)}...
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 🔗 View All Link */}
      <div style={{ marginTop: "2rem" }}>
        <Link
          href="/story"
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: "1rem",
            fontWeight: 600,
            color: "#241123",
            textDecoration: "underline",
          }}
        >
          View All Stories →
        </Link>
      </div>
    </section>
  );
}
