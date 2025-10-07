// app/story/[slug]/page.tsx
export const dynamic = "force-dynamic"; // avoid prerender so server never executes client paths

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import loadRows from "@/lib/loadRows";
import type { StoryRow } from "@/lib/types";
import ClientStory from "./ClientStory";

// server-safe OG image picker
function pickOgImage(story: StoryRow): string {
  const base = "https://stories.dramaticadventure.com";
  const src = (story.imageUrl || "").trim();
  if (!src) return `${base}/images/og/story-fallback.jpg`;
  return /^https?:\/\//i.test(src) ? src : `${base}${src.startsWith("/") ? "" : "/"}${src}`;
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { slug } = params;
  const all = await loadRows();
  const story = all.find((row) => row.slug === slug);

  if (!story) {
    return {
      title: "Story Not Found – Dramatic Adventure Theatre",
      description: "This story could not be found.",
    };
  }

  const description = story.story?.trim() || "A story from Dramatic Adventure Theatre.";
  const ogImage = pickOgImage(story);
  const url = `https://stories.dramaticadventure.com/story/${story.slug}`;

  return {
    title: story.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: story.title,
      description,
      url,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: story.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function StorySlugPage(
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const all: StoryRow[] = await loadRows();
  const story = all.find((row) => row.slug === slug);
  if (!story) return notFound();

  return <ClientStory story={story} />;
}
