// components/alumni/PosterCard.tsx
import Image from "next/image";

interface PosterCardProps {
  title: string;
  imageUrl: string;
  layout?: "landscape" | "portrait";
  titlePosition?: "bottom-left" | "bottom-center" | "top-left" | "top-right";
  priority?: boolean; // 🧠 Optional for performance tuning
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
}: PosterCardProps) {
  const positionClass =
    positionClasses[titlePosition] ?? positionClasses["bottom-left"];

  return (
    <div
      className={`relative overflow-hidden rounded-none shadow-lg ${
        layout === "portrait" ? "w-[400px] h-[600px]" : "w-[600px] h-[400px]"
      }`}
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 600px"
        className="object-cover"
        priority={priority}
      />
      <div
        className={`absolute ${positionClass} bg-[#F9F4E7]/90 px-3 py-1 rounded text-sm font-semibold tracking-wide text-[#241123]`}
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        {title}
      </div>
    </div>
  );
}
