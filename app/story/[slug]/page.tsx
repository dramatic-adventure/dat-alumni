// app/story/[slug]/page.tsx
export const dynamic = "force-dynamic"; // avoid prerender so server never executes client paths
export const revalidate = 0; // explicit: never cache/prerender this route

import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import loadRows from "@/lib/loadRows";
import type { StoryRow } from "@/lib/types";
import ClientStory from "./ClientStory";
import { resolveCanonicalSlug, getSlugAliases, normSlug } from "@/lib/slugAliases";
import { loadAlumniByAliases } from "@/lib/loadAlumni";

/** Next can hand us params as an object OR a Promise in some server contexts. */
type RouteParams = { slug: string };
async function readParams(
  params: RouteParams | Promise<RouteParams>
): Promise<RouteParams> {
  return await Promise.resolve(params);
}

/** Build an absolute base URL from request headers (works on Netlify/Vercel/proxies). */
async function getBaseUrl(): Promise<string> {
  // 1) Netlify/Vercel env fallbacks (helpful in some server contexts)
  const envUrl =
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;

  if (envUrl && /^https?:\/\//i.test(envUrl)) return envUrl;

  // 2) Request headers (works in dev/prod)
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";

  const protoHeader = h.get("x-forwarded-proto") ?? "http";
  const proto =
    host.includes("localhost") || host.includes("127.0.0.1")
      ? "http"
      : protoHeader;

  return `${proto}://${host}`;
}

function normalizeSlug(s: string): string {
  // normalize for lookup: decode + trim + lowercase
  try {
    return decodeURIComponent(String(s || "").trim()).toLowerCase();
  } catch {
    return String(s || "").trim().toLowerCase();
  }
}

function pickFirst(row: any, keys: string[]): string {
  for (const k of keys) {
    const v = row?.[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

// server-safe OG image picker
function pickOgImage(story: StoryRow, baseUrl: string): string {
  const src = (story.imageUrl || "").trim();
  if (!src) return `${baseUrl}/images/og/story-fallback.jpg`;
  return /^https?:\/\//i.test(src)
    ? src
    : `${baseUrl}${src.startsWith("/") ? "" : "/"}${src}`;
}

async function resolveAuthor(authorSlugOrId: string) {
  const incoming = normSlug(authorSlugOrId);
  if (!incoming) return null;

  const canonical = (await resolveCanonicalSlug(incoming)) || incoming;

  const aliasesRaw = await getSlugAliases(canonical); // should include canonical
  const aliases = new Set<string>(
    Array.from(aliasesRaw as any).map((s: any) => normSlug(String(s)))
  );

  aliases.add(canonical);
  aliases.add(incoming);

  const alum = await loadAlumniByAliases(aliases as any);
  if (!alum) return null;

  const name = String((alum as any)?.name || "").trim();
  if (!name) return null;

  return { name, slug: canonical };
}

/**
 * Fallback: if loadRows() doesn't contain the slug, try the same dataset the map uses:
 * GET /api/stories → Clean Map Data CSV.
 */
async function loadStoryFromStoriesApi(
  baseUrl: string,
  slug: string
): Promise<StoryRow | null> {
  try {
    const res = await fetch(`${baseUrl}/api/stories`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.ok || !Array.isArray(data?.stories)) return null;

    const wanted = normalizeSlug(slug);

    const hit = data.stories.find((r: any) => {
      const s = pickFirst(r, ["slug", "Slug", "SLUG"]);
      return normalizeSlug(s) === wanted;
    });

    if (!hit) return null;

    // Synthesize a minimal StoryRow from Clean Map Data fields
    const synthesized: StoryRow = {
      slug: pickFirst(hit, ["slug", "Slug", "SLUG"]) || slug,
      title: pickFirst(hit, ["title", "Title"]) || slug,
      story:
        pickFirst(hit, [
          "story",
          "Story",
          "Short Story",
          "ShortStory",
          "shortStory",
        ]) || "",
      imageUrl:
        pickFirst(hit, ["imageUrl", "Image URL", "ImageURL", "image"]) || "",
      // Optional extras if your StoryRow supports them
      author: (pickFirst(hit, ["author", "Author"]) || undefined) as any,
      authorSlug: (pickFirst(hit, ["authorSlug", "AuthorSlug"]) || undefined) as any,
      locationName: (pickFirst(hit, ["Location Name", "locationName"]) ||
        undefined) as any,
      country: (pickFirst(hit, ["Country", "country"]) || undefined) as any,
      program: (pickFirst(hit, ["Program", "program"]) || undefined) as any,
      years: (pickFirst(hit, ["Year(s)", "Years", "years"]) || undefined) as any,
    } as any;

    return synthesized;
  } catch {
    return null;
  }
}

async function findStoryBySlug(slugRaw: string): Promise<StoryRow | null> {
  const needle = normalizeSlug(slugRaw);

  // Primary dataset
  const all = await loadRows();
  const primaryHit = all.find(
    (row: any) => normalizeSlug(row?.slug) === needle
  ) as StoryRow | undefined;
  if (primaryHit) return primaryHit;

  // Fallback dataset (Clean Map Data via /api/stories)
  const baseUrl = await getBaseUrl();
  const apiHit = await loadStoryFromStoriesApi(baseUrl, slugRaw);
  return apiHit;
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams | Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await readParams(params);
  const story = await findStoryBySlug(rawSlug);

  if (!story) {
    return {
      title: "Story Not Found – Dramatic Adventure Theatre",
      description: "This story could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = await getBaseUrl();
  const description =
    (story.story || "").trim() || "A story from Dramatic Adventure Theatre.";
  const ogImage = pickOgImage(story, baseUrl);

  // Canonical should follow the current host (localhost in dev / prod host in prod)
  const url = `${baseUrl}/story/${encodeURIComponent(story.slug)}`;

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

export default async function StorySlugPage({
  params,
}: {
  params: RouteParams | Promise<RouteParams>;
}) {
  const { slug: rawSlug } = await readParams(params);
  const story = await findStoryBySlug(rawSlug);

  if (!story) return notFound();

  const authorKey =
    pickFirst(story as any, ["authorSlug", "AuthorSlug", "alumniSlug", "profileSlug"]) ||
    pickFirst(story as any, ["author", "Author", "authorName", "AuthorName"]) ||
    "";

  const resolvedAuthor = authorKey ? await resolveAuthor(authorKey) : null;

  const storyWithResolvedAuthor = {
    ...(story as any),
    authorSlug: resolvedAuthor?.slug || (story as any)?.authorSlug,
    author: resolvedAuthor?.name || (story as any)?.author,
    authorName: resolvedAuthor?.name || (story as any)?.authorName,
  };

  return <ClientStory story={storyWithResolvedAuthor as any} />;
}
