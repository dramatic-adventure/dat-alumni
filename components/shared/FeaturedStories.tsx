// components/shared/FeaturedStories.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StoryRow } from "@/lib/types";
import StoryMedia from "./StoryMedia";
import ThumbnailMedia from "./ThumbnailMedia";

interface FeaturedStoriesProps {
  stories: StoryRow[];
  authorSlug?: string;
}

function norm(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

function extractSlugFromStoryUrl(url: any): string {
  const u = String(url ?? "").trim();
  if (!u) return "";
  try {
    const parsed = new URL(u, "http://local");
    const m = parsed.pathname.match(/\/story\/([^\/?#]+)/i);
    if (m?.[1]) return decodeURIComponent(m[1]).trim();
  } catch {
    const cleaned = u.replace(/^https?:\/\/[^/]+/i, "");
    const m = cleaned.match(/\/story\/([^\/?#]+)/i);
    if (m?.[1]) return decodeURIComponent(m[1]).trim();
  }
  return "";
}

function pickFirst(obj: any, keys: string[]): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

/** Pull story text from whatever column is actually populated. */
function getStoryText(s: any): string {
  return String(
    s?.story ??
      s?.["Short Story"] ??
      s?.shortStory ??
      s?.short_story ??
      s?.Quote ??
      s?.quote ??
      s?.body ??
      s?.content ??
      s?.text ??
      s?.excerpt ??
      s?.summary ??
      s?.bodyNote ??
      ""
  ).trim();
}

function hasExcerpt(story: any): boolean {
  return String(story?.__storyText ?? "").trim().length > 0;
}

const readLinkBase: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontWeight: "bold",
  color: "#F23359",
  letterSpacing: "0.02em",
  transition: "opacity 0.15s ease, color 0.15s ease, letter-spacing 0.15s ease",
  cursor: "pointer",
  opacity: 1,
};

function onReadHover(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget as HTMLElement;
  el.style.opacity = "0.9";
  el.style.color = "#6C00AF";
  el.style.letterSpacing = "0.12em";
}

function onReadLeave(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget as HTMLElement;
  el.style.opacity = "1";
  el.style.color = "#F23359";
  el.style.letterSpacing = "0.02em";
}

export default function FeaturedStories({
  stories,
  authorSlug,
}: FeaturedStoriesProps) {
  const [showAll, setShowAll] = useState(false);

  if (!stories || stories.length === 0) return null;

  function yesNo(v: any): boolean {
    const s = String(v ?? "").trim().toLowerCase();
    if (!s) return false;
    return ["y", "yes", "true", "1", "show", "visible"].includes(s);
  }
  function showOnMapOk(row: any): boolean {
    const raw = pickFirst(row, [
      "Show on Map?",
      "Show on Map",
      "showOnMap",
      "show_on_map",
      "visible",
    ]);
    return raw.trim() === "" ? true : yesNo(raw);
  }

  const filteredStories = (stories || []).filter((s: any) => {
    if (!s) return false;

    const slugRaw =
      pickFirst(s, [
        "slug",
        "Slug",
        "storySlug",
        "story_slug",
        "Story Slug",
        "StorySlug",
        "SLUG",
      ]) ||
      extractSlugFromStoryUrl(
        pickFirst(s, ["Story URL", "StoryURL", "storyUrl", "story_url", "url", "URL"])
      );

    const slug = String(slugRaw || "")
      .trim()
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    const title = pickFirst(s, [
      "title",
      "Title",
      "storyTitle",
      "story_title",
      "Headline",
      "headline",
    ]).trim();

    if (!slug || !title) return false;

    if (!authorSlug) return true;

    const a = pickFirst(s, [
      "authorSlug",
      "AuthorSlug",
      "profileSlug",
      "author",
      "Author",
    ]).trim();
    return norm(a) === norm(authorSlug);
  });

  const validStories = filteredStories.map((s: any) => {
    const slugRaw =
      pickFirst(s, [
        "slug",
        "Slug",
        "storySlug",
        "story_slug",
        "Story Slug",
        "StorySlug",
        "SLUG",
      ]) ||
      extractSlugFromStoryUrl(
        pickFirst(s, ["Story URL", "StoryURL", "storyUrl", "story_url", "url", "URL"])
      );

    const slug = String(slugRaw || "")
      .trim()
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    const title = pickFirst(s, [
      "title",
      "Title",
      "storyTitle",
      "story_title",
      "Headline",
      "headline",
    ]).trim();

    const imageUrl = pickFirst(s, [
      "imageUrl",
      "Image URL",
      "ImageURL",
      "mediaUrl",
      "Media URL",
      "mediaURL",
    ])
      .trim()
      .replace(/\s+/g, "");

    return {
      ...(s as any),
      slug,
      title,
      imageUrl,
      __storyText: getStoryText(s),
    };
  });

  if (validStories.length === 0) return null;

  const coverStory =
    validStories.find(
      (s: any) =>
        typeof s.imageUrl === "string" &&
        s.imageUrl.trim() !== "" &&
        !s.imageUrl.includes("placeholder") &&
        !s.imageUrl.includes("missing")
    ) || validStories[0];

  if (!coverStory || !coverStory.slug) return null;

  const coverHasExcerpt = hasExcerpt(coverStory);

  const coverSlugNorm = norm(String((coverStory as any)?.slug ?? ""));

  const sidebarStories = validStories
    .filter((s: any) => norm(String(s?.slug ?? "")) !== coverSlugNorm)
    .slice(0, 3);

  const additionalStories = validStories.filter((s: any) => {
    const sn = norm(String(s?.slug ?? ""));
    if (!sn || sn === coverSlugNorm) return false;
    return !sidebarStories.some((side: any) => norm(String(side?.slug ?? "")) === sn);
  });

  const routeSlug =
    String(coverStory?.slug ?? "").trim() ||
    extractSlugFromStoryUrl(
      (coverStory as any)?.storyUrl ?? (coverStory as any)?.["Story URL"]
    );

  const needsToggle = additionalStories.length > 0;

  return (
    <section
      style={{
        padding: "0 0px",
        marginTop: "-2rem",
        marginBottom: "0.2rem",
        maxWidth: "100%",
      }}
    >
      <h2
        style={{
          backgroundColor: "#F23359",
          color: "#000",
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: "3rem", alignItems: "flex-start" }}>
        <Link
          href={`/story/${routeSlug}`}
          style={{
            display: "block",
            cursor: "pointer",
            flex: "1 1 45%",
            textDecoration: "none",
            color: "inherit",
            minWidth: "300px",
          }}
        >
          <StoryMedia imageUrl={coverStory.imageUrl} title={coverStory.title} style={{ borderRadius: 0 }} />

          <h3
            style={{
              fontSize: "2.6rem",
              backgroundColor: "#FFCC00",
              textTransform: "uppercase",
              fontWeight: 400,
              display: "inline-block",
              padding: "0rem 0.4rem",
              fontFamily: "var(--font-anton), system-ui, sans-serif",
              marginBottom: "-0.8rem",
              color: "#241123",
            }}
          >
            {coverStory.title}
          </h3>

          {coverHasExcerpt && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                fontSize: "1rem",
                color: "#333",
                lineHeight: 1.4,
                marginTop: "0.4rem",
              }}
            >
              {String((coverStory as any).__storyText).slice(0, 160)}…
            </p>
          )}

          <span
            style={{
              ...readLinkBase,
              marginTop: coverHasExcerpt ? "0.25rem" : "0.5rem",
              display: "block",
            }}
            onMouseEnter={onReadHover}
            onMouseLeave={onReadLeave}
          >
            Read full story →
          </span>
        </Link>

        {sidebarStories.length > 0 && (
          <div
            style={{
              flex: "0.5 1 35%",
              display: "flex",
              flexDirection: "column",
              gap: "3rem",
              minWidth: "240px",
            }}
          >
            {sidebarStories.map((story: any) => {
              const routeSlug =
                String(story?.slug ?? "").trim() ||
                extractSlugFromStoryUrl(
                  (story as any)?.storyUrl ?? (story as any)?.["Story URL"]
                );

              if (!routeSlug) return null;

              const storyHasExcerpt = hasExcerpt(story);

              return (
                <Link
                  key={story.storyKey || routeSlug}
                  href={`/story/${routeSlug}`}
                  style={{
                    display: "block",
                    cursor: "pointer",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
                    <ThumbnailMedia imageUrl={story.imageUrl} title={story.title} style={{ borderRadius: 0 }} />
                    <div>
                      <h4
                        style={{
                          fontFamily: "var(--font-anton), system-ui, sans-serif",
                          fontSize: "1.5rem",
                          backgroundColor: "#FFCC00",
                          textTransform: "uppercase",
                          fontWeight: 400,
                          display: "inline-block",
                          marginBottom: "-0.2rem",
                          color: "#241123",
                        }}
                      >
                        {story.title}
                      </h4>

                      {storyHasExcerpt && (
                        <p
                          style={{
                            fontSize: "0.9rem",
                            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                            color: "#444",
                            lineHeight: 1.4,
                            marginTop: "0.2rem",
                          }}
                        >
                          {String(story.__storyText).slice(0, 100)}…
                        </p>
                      )}

                      <span
                        style={{
                          ...readLinkBase,
                          marginTop: storyHasExcerpt ? "0.15rem" : "0.4rem",
                          display: storyHasExcerpt ? "inline-block" : "block",
                        }}
                        onMouseEnter={onReadHover}
                        onMouseLeave={onReadLeave}
                      >
                        Read full story →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showAll && additionalStories.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          {additionalStories.map((story: any) => {
            const routeSlug =
              String(story?.slug ?? "").trim() ||
              extractSlugFromStoryUrl(
                (story as any)?.storyUrl ?? (story as any)?.["Story URL"]
              );

            if (!routeSlug) return null;

            const storyHasExcerpt = hasExcerpt(story);

            return (
              <Link
                key={story.storyKey || routeSlug}
                href={`/story/${routeSlug}`}
                style={{
                  display: "block",
                  cursor: "pointer",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <ThumbnailMedia imageUrl={story.imageUrl} title={story.title} style={{ borderRadius: 0 }} />
                <h4
                  style={{
                    fontFamily: "var(--font-anton), system-ui, sans-serif",
                    fontSize: "1.5rem",
                    backgroundColor: "#FFCC00",
                    textTransform: "uppercase",
                    fontWeight: 400,
                    display: "inline-block",
                    marginBottom: "-0.2rem",
                    color: "#241123",
                  }}
                >
                  {story.title}
                </h4>

                {storyHasExcerpt && (
                  <p
                    style={{
                      fontSize: "0.95rem",
                      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                      color: "#444",
                      lineHeight: 1.4,
                      marginTop: "0.2rem",
                    }}
                  >
                    {String(story.__storyText).slice(0, 120)}…
                  </p>
                )}

                <span
                  style={{
                    ...readLinkBase,
                    marginTop: storyHasExcerpt ? "0.15rem" : "0.4rem",
                    display: storyHasExcerpt ? "inline-block" : "block",
                  }}
                  onMouseEnter={onReadHover}
                  onMouseLeave={onReadLeave}
                >
                  Read full story →
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* ✅ Toggle only if needed */}
      {needsToggle && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.35rem",
              fontSize: "1.2rem",
              color: "#f2f2f2",
              backgroundColor: "#F23359",
              padding: "18px 40px",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "opacity 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {showAll ? "Show Fewer Stories" : "Show All My Stories"}
          </button>
        </div>
      )}

      {/* ✅ ALWAYS show Explore link */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: needsToggle ? "0.6rem" : "2rem" }}>
        <Link
          href="/story-map#story"
          style={{
            textAlign: "right",
            width: "100%",
            fontFamily: "var(--font-rock-salt), cursive",
            fontSize: "1rem",
            color: "#F23359",
            textDecoration: "none",
            transition: "color 0.2s ease-in-out",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#6C00AF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#F23359")}
        >
          ← Explore the Story Map&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </Link>
      </div>
    </section>
  );
}