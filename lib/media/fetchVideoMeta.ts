// lib/media/fetchVideoMeta.ts
// Server-side only: fetch oEmbed metadata for YouTube and Vimeo URLs.
// Swallows all errors and returns {} on failure.

export type VideoMeta = { title?: string; aspectRatio?: string };

export async function fetchVideoMeta(url: string): Promise<VideoMeta> {
  if (!url?.trim()) return {};
  try {
    const trimmed = url.trim();
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    let oembedUrl: string | null = null;

    if (host.endsWith("youtube.com") || host === "youtu.be") {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`;
    } else if (host.endsWith("vimeo.com")) {
      oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(trimmed)}`;
    }

    if (!oembedUrl) return {};

    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return {};

    const j = await res.json();
    const title = typeof j.title === "string" ? j.title.trim() || undefined : undefined;
    const w = Number(j.width);
    const h = Number(j.height);
    const aspectRatio = w > 0 && h > 0 ? `${w}/${h}` : undefined;

    return { title, aspectRatio };
  } catch {
    return {};
  }
}
