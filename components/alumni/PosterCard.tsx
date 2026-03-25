import Image from "next/image";

interface PosterCardProps {
  title: string;
  imageUrl: string;
  layout?: "landscape" | "portrait";
  titlePosition?: "bottom-left" | "bottom-center" | "top-left" | "top-right";
  priority?: boolean;
  slug?: string;
}

const FALLBACK_POSTER_URL = "/posters/fallback-16x9.jpg";

const positionClasses: Record<
  NonNullable<PosterCardProps["titlePosition"]>,
  string
> = {
  "bottom-left": "bottom-4 left-4 text-left",
  "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2 text-center",
  "top-left": "top-4 left-4 text-left",
  "top-right": "top-4 right-4 text-right",
};

// Normalize any poster path into something Next can safely use
function normalizePosterSrc(raw: string | undefined | null): string {
  if (!raw) return FALLBACK_POSTER_URL;

  let src = raw.trim();

  // Strip accidental "public/" prefix
  if (src.startsWith("public/")) {
    src = src.slice("public/".length);
  }

  // If it's not absolute and not an external URL, make it root-relative
  if (!src.startsWith("/") && !src.startsWith("http")) {
    src = `/${src}`;
  }

  return src || FALLBACK_POSTER_URL;
}

// Normalize slug so we don't get double slashes
function buildFullUrl(slug?: string | null): string | null {
  if (!slug) return null;
  const cleanSlug = slug.replace(/^\/+/, ""); // strip leading slashes
  return `https://www.dramaticadventure.com/${cleanSlug}`;
}

export default function PosterCard({
  title,
  imageUrl,
  layout = "landscape",
  titlePosition = "bottom-left",
  priority = false,
  slug,
}: PosterCardProps) {
  const positionClass = positionClasses[titlePosition];
  const fullUrl = buildFullUrl(slug);
  const normalizedSrc = normalizePosterSrc(imageUrl);

  const imageCard = (
    <div
      className={`group relative w-full overflow-hidden shadow-lg rounded-none ${
        layout === "portrait" ? "aspect-[2/3]" : "aspect-[16/10]"
      } border-4 border-transparent hover:border-[#F23359] transition-all duration-300`}
    >
      <Image
        src={normalizedSrc}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover"
        priority={priority}
      />
      <div
        className={`absolute ${positionClass} bg-[#F9F4E7]/90 px-0 py-0 rounded text-sm font-semibold tracking-wide text-[#241123] pointer-events-none`}
        style={{
          fontFamily:
            "var(--font-space-grotesk), system-ui, sans-serif",
        }}
      >
        {title}
      </div>
    </div>
  );

  return fullUrl ? (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline hover:no-underline"
    >
      {imageCard}
    </a>
  ) : (
    imageCard
  );
}
