// components/story/StoryPage.tsx
"use client";

import Link from "next/link";
import ShareButton from "@/components/ui/ShareButton";
import StoryMedia from "@/components/shared/StoryMedia";
import type { StoryRow } from "@/lib/types";

interface StoryPageProps {
  story: StoryRow;
}

export default function StoryPage({ story }: StoryPageProps) {
  const {
    slug,
    title,
    location,
    program,
    country,
    year,
    partners,
    quote,
    quoteAuthor,
    story: shortStory,
    author,
    authorSlug,
    moreInfoLink,
    imageUrl,
  } = story;

  const programLine =
    program && (country || year)
      ? `${program}: ${[country, year].filter(Boolean).join(" ")}`
      : program || [country, year].filter(Boolean).join(" ");

  const storyUrl = `https://stories.dramaticadventure.com/story/${slug}`;

  const authorName = (story as any)?.authorName || author || "";
  const authorHrefSlug = (story as any)?.authorSlug || authorSlug || "";

  return (
    <main>
      <div
        className="story-page pointer-events-auto"
        style={{ marginTop: "8rem", marginBottom: "8rem" }}
      >
        {/* Top Bar: Back Link + Share */}
        <div className="flex justify-between items-center mb-4">
          <a
            href="/story-map#story"
            style={{
              fontFamily: "var(--font-rock-salt), cursive",
              fontSize: "1.15rem",
              color: "#ff007f",
              textDecoration: "none",
            }}
          >
            ← Explore More Stories
          </a>
          <ShareButton url={storyUrl} />
        </div>

        {/* Location */}
        {location && <p className="popup-location">{location}</p>}

        {/* Title */}
        {title && <h1 className="popup-title">{title}</h1>}

        {/* Program Info */}
        {programLine && <p className="popup-program">{programLine}</p>}

        {/* Media */}
        <StoryMedia imageUrl={imageUrl} title={title} />

        {/* Partners */}
        {partners?.trim() && partners !== "-" && (
          <p className="popup-partners">
            Created in collaboration with {partners}, rooted in a shared vision.
          </p>
        )}

        {/* Quote */}
        {quote && (
          <blockquote className="popup-quote">
            “{quote}”
            {quoteAuthor && (
              <footer className="popup-quote-author">— {quoteAuthor}</footer>
            )}
          </blockquote>
        )}

        {/* Story Body */}
        {shortStory && <p className="popup-story">{shortStory}</p>}

        {/* Author */}
        {authorName ? (
          <p className="popup-author">
            By{" "}
            {authorHrefSlug ? (
              <Link href={`/alumni/${authorHrefSlug}`}>{authorName}</Link>
            ) : (
              <span>{authorName}</span>
            )}
          </p>
        ) : null}

        {/* CTA Button */}
        {moreInfoLink && (
          <a
            href={moreInfoLink}
            className="popup-button"
            style={{
              textDecoration: "none",
              color: "#f2f2f2",
              WebkitTextFillColor: "#f2f2f2",
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            STEP INTO THE STORY
          </a>
        )}
      </div>
    </main>
  );
}
