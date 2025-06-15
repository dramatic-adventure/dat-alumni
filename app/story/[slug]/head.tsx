import loadRows from "@/lib/loadRows";
import { loadSluggedStory } from "@/lib/loadSluggedStory";
import type { Metadata } from "next";
import { stripHtml } from "string-strip-html";

type Props = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const rows = await loadRows();
  const story = loadSluggedStory(params.slug, rows);

  if (!story) {
    return {
      title: "Story Not Found | Dramatic Adventure Theatre",
      description: "This story could not be found.",
    };
  }

  const siteUrl = `https://stories.dramaticadventure.com/story/${params.slug}`;
  const imageUrl =
    story.imageUrl?.startsWith("http")
      ? story.imageUrl
      : story.imageUrl
      ? `https://stories.dramaticadventure.com${story.imageUrl}`
      : undefined;

  const rawText = story.quote || story.story || "";
  const cleanDescription = stripHtml(rawText).result.slice(0, 150).trim();

  return {
    title: `${story.title} | Dramatic Adventure Theatre`,
    description:
      cleanDescription || "Discover global stories from Dramatic Adventure Theatre.",
    openGraph: {
      title: story.title,
      description: cleanDescription,
      url: siteUrl,
      type: "article",
      siteName: "Dramatic Adventure Theatre",
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: story.title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description: cleanDescription,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}
