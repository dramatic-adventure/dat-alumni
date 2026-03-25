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
  const pickFirst = (obj: any, keys: string[]) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v != null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[StoryPage story keys]", Object.keys(story || {}).sort());
    // eslint-disable-next-line no-console
    console.log("[StoryPage story sample]", story);
  }

  const slug =
    pickFirst(story, ["slug", "Slug", "storySlug", "Story Slug", "StorySlug"]) ||
    "";

  const title =
    pickFirst(story, ["title", "Title", "Headline", "headline"]) || "";

  const location =
    pickFirst(story, [
      "location",
      "Location",
      "Location Name",
      "locationName",
      "LocationName",
    ]) || "";

  const program = pickFirst(story, ["program", "Program"]) || "";
  const country = pickFirst(story, ["country", "Country"]) || "";
  const year = pickFirst(story, ["year", "Year", "Year(s)", "Years", "years"]) || "";

  const partners = pickFirst(story, ["partners", "Partners"]) || "";

  const quote = pickFirst(story, ["quote", "Quote"]) || "";

  // ✅ Your sheet uses “Quote Attribution” — support both old and new
  const quoteAttribution =
    pickFirst(story, [
      "Quote Attribution",
      "Quote attribution",
      "quoteAttribution",
      "quote_attribution",
      "quoteAuthor",
      "Quote Author",
      "QuoteAuthor",
    ]) || "";

  // ✅ Story body: prefer full body, fall back to short story/teaser
  const storyBody =
    pickFirst(story, [
      // full body first
      "Full Story",
      "FullStory",
      "fullStory",
      "full_story",
      "Body",
      "body",
      "Content",
      "content",
      "Text",
      "text",
      // then canonical/teaser
      "story",
      "Story",
      "Short Story",
      "ShortStory",
      "shortStory",
      "short_story",
    ]) || "";

  const author =
    pickFirst(story, ["author", "Author", "authorName", "AuthorName"]) || "";

  const authorSlug =
    pickFirst(story, ["authorSlug", "AuthorSlug", "alumniSlug", "profileSlug"]) ||
    "";

  const moreInfoLinkRaw =
    pickFirst(story, ["moreInfoLink", "More Info Link", "MoreInfoLink"]) || "";

  const moreInfoLink =
    moreInfoLinkRaw ||
    ""; // keep explicit; we can add media fallback if you want


  // ✅ Media drift: sheet = mediaUrl, API sometimes = "Image URL"
  const imageUrl = pickFirst(story, [
    "mediaUrl",
    "Media URL",
    "mediaURL",
    "imageUrl",
    "Image URL",
    "ImageURL",
    "image",
  ])
    .replace(/\s+/g, "")
    .trim();

  const programLine =
    program && (country || year)
      ? `${program}: ${[country, year].filter(Boolean).join(" ")}`
      : program || [country, year].filter(Boolean).join(" ");

  const category = pickFirst(story, ["Category", "category"]) || "";
  const regionTag =
    pickFirst(story, ["Region Tag", "RegionTag", "regionTag", "region_tag"]) || "";

  const detailsLine = [location, country, year, category || regionTag]
    .filter(Boolean)
    .join(" • ");

  // ✅ Prefer server-resolved author fields if present (handles name/slug changes)
  const authorName = (story as any)?.authorName || author || "";
  const authorHrefSlug = (story as any)?.authorSlug || authorSlug || "";

  const hasBelowMedia = !!(
    detailsLine.trim() ||
    partners.trim() ||
    quote.trim() ||
    quoteAttribution.trim() ||
    storyBody.trim() ||
    authorName.trim() ||
    moreInfoLink.trim()
  );

  const storyUrl = `https://stories.dramaticadventure.com/story/${slug}`;

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
            className="explore-more-link"
            style={{
              fontFamily: "var(--font-rock-salt), cursive",
              fontSize: "1.15rem",
              color: "#f23359",
              textDecoration: "none",
            }}
          >
            ← Explore More Stories
          </a>
          <ShareButton url={storyUrl} />
        </div>

        {/* Subtle divider: full width of the white container, minus padding */}
        <div
          aria-hidden="true"
          style={{
            width: "100%",
            height: 1,
            background: "rgba(36, 17, 35, 0.12)", // subtle DAT dark
            marginTop: "0.75rem",
            marginBottom: "0.2rem",
          }}
        />

        {/* Location */}
        {location ? <p className="popup-location">{location}</p> : null}

        {/* Title */}
        {title ? <h1 className="popup-title">{title}</h1> : null}

        {/* Program Info */}
        {programLine ? <p className="popup-program">{programLine}</p> : null}

        {/* Media */}
        {imageUrl ? <StoryMedia imageUrl={imageUrl} title={title} /> : null}

        {/* Below-media content: render if ANY content exists (not just body) */}
        {hasBelowMedia ? (
          <>
            {/* detailsLine intentionally removed */}

            {/* Partners */}
            {partners?.trim() && partners !== "-" ? (
              <p className="popup-partners">
                Created in collaboration with {partners}, rooted in a shared vision.
              </p>
            ) : null}

            {/* Quote */}
            {quote?.trim() ? (
              <blockquote className="popup-quote">
                “{quote}”
                {quoteAttribution ? (
                  <footer className="popup-quote-author">— {quoteAttribution}</footer>
                ) : null}
              </blockquote>
            ) : null}

            {/* Story Body */}
            {storyBody?.trim() ? <p className="popup-story">{storyBody}</p> : null}

            {/* Author */}
            {authorName ? (
              <p className="popup-author">
                By{" "}
                {authorHrefSlug ? (
                  <Link
                    href={`/alumni/${authorHrefSlug}`}
                    style={{
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    {authorName}
                  </Link>
                ) : (
                  <span
                    style={{
                      textDecoration: "underline",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    {authorName}
                  </span>
                )}
              </p>
            ) : null}

            {/* CTA Button */}
            {moreInfoLink ? (
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
            ) : null}
          </>
        ) : null}

      </div>
    </main>
  );
}
