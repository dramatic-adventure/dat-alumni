// lib/media/resolveVideo.ts

export type VideoEmbedInput =
  | string
  | {
      url: string;
      title?: string;
      poster?: string;
    };

export type ResolvedVideo =
  | {
      kind: "embed";
      provider: "youtube" | "vimeo";
      url: string; // original input URL
      embedUrl: string; // iframe-ready
      openUrl?: string; // canonical watch page
      title?: string;
    }
  | {
      kind: "file";
      provider: "file";
      url: string; // original input URL/path
      src: string; // <video src>
      title?: string;
      poster?: string;
      mimeType?: string;
    };

function normalizeInput(input: VideoEmbedInput): {
  url: string;
  title?: string;
  poster?: string;
} {
  if (typeof input === "string") return { url: input };
  return { url: input.url, title: input.title, poster: input.poster };
}

function safeParseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    // allow relative URLs/paths by providing a dummy base
    try {
      return new URL(raw, "https://example.invalid");
    } catch {
      return null;
    }
  }
}

function extractYouTubeId(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  // youtu.be/<id>
  if (host === "youtu.be") {
    const id = u.pathname.split("/").filter(Boolean)[0];
    return id && id.length >= 8 ? id : null;
  }

  // youtube.com/*
  if (host.endsWith("youtube.com")) {
    const path = u.pathname || "";

    // /watch?v=<id>
    if (path === "/watch") {
      const v = u.searchParams.get("v");
      return v && v.length >= 8 ? v : null;
    }

    // /embed/<id>
    if (path.startsWith("/embed/")) {
      const id = path.split("/")[2];
      return id && id.length >= 8 ? id : null;
    }

    // /shorts/<id>
    if (path.startsWith("/shorts/")) {
      const id = path.split("/")[2];
      return id && id.length >= 8 ? id : null;
    }

    // /live/<id>
    if (path.startsWith("/live/")) {
      const id = path.split("/")[2];
      return id && id.length >= 8 ? id : null;
    }
  }

  return null;
}

function extractVimeoId(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  if (!host.endsWith("vimeo.com")) return null;

  const parts = (u.pathname || "").split("/").filter(Boolean);

  // player.vimeo.com/video/<id>
  if (host === "player.vimeo.com") {
    const idx = parts.indexOf("video");
    const id = idx >= 0 ? parts[idx + 1] : undefined;
    return id && /^\d+$/.test(id) ? id : null;
  }

  // vimeo.com/<id> or vimeo.com/channels/.../<id> etc: find last numeric segment
  for (let i = parts.length - 1; i >= 0; i--) {
    const seg = parts[i];
    if (/^\d+$/.test(seg)) return seg;
  }

  return null;
}

function guessMimeType(urlOrPath: string): string | undefined {
  const lower = urlOrPath.toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".ogg") || lower.endsWith(".ogv")) return "video/ogg";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return undefined;
}

function isDirectVideoFile(urlOrPath: string): boolean {
  const lower = urlOrPath.toLowerCase();
  return (
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".ogv") ||
    lower.endsWith(".mov") ||
    lower.startsWith("blob:") ||
    lower.startsWith("data:video/")
  );
}

export function resolveVideo(input: VideoEmbedInput): ResolvedVideo | null {
  const { url: rawUrl, title, poster } = normalizeInput(input);
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) return null;

  const parsed = safeParseUrl(trimmed);

  // YouTube / Vimeo (needs URL parsing)
  if (parsed) {
    const ytId = extractYouTubeId(parsed);
    if (ytId) {
      // nocookie embed by default
      const embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}`;
      const openUrl = `https://www.youtube.com/watch?v=${ytId}`;
      return {
        kind: "embed",
        provider: "youtube",
        url: trimmed,
        embedUrl,
        openUrl,
        title,
      };
    }

    const vimeoId = extractVimeoId(parsed);
    if (vimeoId) {
      const embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
      const openUrl = `https://vimeo.com/${vimeoId}`;
      return {
        kind: "embed",
        provider: "vimeo",
        url: trimmed,
        embedUrl,
        openUrl,
        title,
      };
    }
  }

  // Direct/self-hosted files (can be relative paths)
  if (isDirectVideoFile(trimmed) || trimmed.startsWith("/videos/") || trimmed.startsWith("/media/")) {
    return {
      kind: "file",
      provider: "file",
      url: trimmed,
      src: trimmed,
      title,
      poster,
      mimeType: guessMimeType(trimmed),
    };
  }

  return null;
}
