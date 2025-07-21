import { notFound } from "next/navigation";
import loadRows from "@/lib/loadRows";
import StoryPage from "@/components/story/StoryPage";
import { StoryRow } from "@/lib/types";
import { getSocialPreviewImage } from "@/lib/getSocialPreviewImage";
import type { Metadata } from "next";

/**
 * 🧠 PARAMS SANITY CHECK (Next.js 15 – App Router)
 *
 * 🚫 DON’T:
 *   export async function Page({ params }: { params: Promise<{ slug: string }> }) {
 *     const { slug } = await params; // ❌ Build error, runtime failure
 *   }
 *
 * ✅ DO:
 *   export async function Page({ params }: { params: { slug: string } }) {
 *     const { slug } = params; // ✅ Works!
 *   }
 *
 * 🔁 WHY:
 *   - In Next.js App Router, `params` is always passed as a plain object.
 *   - Typing it as a Promise causes avoidable chaos.
 *
 * 📌 Mantra:
 *   “Just because a function is async, doesn’t mean its props are Promises.”
 */

// ✅ Works: plain object `params`, no Promise
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

  const ogImage = await getSocialPreviewImage(story);
  const description = story.story?.trim() || "A story from Dramatic Adventure Theatre.";

  return {
    title: story.title,
    description,
    alternates: {
      canonical: `https://stories.dramaticadventure.com/story/${story.slug}`,
    },
    openGraph: {
      title: story.title,
      description,
      url: `https://stories.dramaticadventure.com/story/${story.slug}`,
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: story.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description,
      images: [ogImage],
    },
  };
}

// ✅ Page function using correct params type
export default async function StorySlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const all: StoryRow[] = await loadRows();
  const story = all.find((row) => row.slug === slug);

  if (!story) return notFound();

  // 🔒 Keep ALL story layout & styling intact
  return (
    <>
      <StoryPage story={story} />

      
    </>
  );
}

// ✅ Optional: For Static Generation (safe to keep if you use SSG)
export async function generateStaticParams() {
  const all = await loadRows();
  return all.map((row) => ({
    slug: row.slug,
  }));
}
