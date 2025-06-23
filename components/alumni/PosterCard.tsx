import Image from "next/image";

interface PosterCardProps {
  title: string;
  imageUrl: string;
  layout?: "landscape" | "portrait";
  titlePosition?: "bottom-left" | "bottom-center" | "top-left" | "top-right";
  priority?: boolean;
  slug?: string;
}

const positionClasses: Record<
  NonNullable<PosterCardProps["titlePosition"]>,
  string
> = {
  "bottom-left": "bottom-4 left-4 text-left",
  "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2 text-center",
  "top-left": "top-4 left-4 text-left",
  "top-right": "top-4 right-4 text-right",
};

export default function PosterCard({
  title,
  imageUrl,
  layout = "landscape",
  titlePosition = "bottom-left",
  priority = false,
  slug,
}: PosterCardProps) {
  const positionClass = positionClasses[titlePosition];
  const fullUrl = slug ? `https://www.dramaticadventure.com/${slug}` : null;

  const imageCard = (
    <div
      className={`group relative w-full overflow-hidden shadow-lg rounded-none ${
        layout === "portrait" ? "aspect-[2/3]" : "aspect-[16/10]"
      } border-4 border-transparent hover:border-[#F23359] transition-all duration-300`}
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover"
        priority={priority}
      />
      <div
        className={`absolute ${positionClass} bg-[#F9F4E7]/90 px-0 py-0 rounded text-sm font-semibold tracking-wide text-[#241123] pointer-events-none`}
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
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
