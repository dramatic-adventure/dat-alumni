import PosterCard from "./alumni/PosterCard"; // ✅ DEFAULT import

interface PosterData {
  title: string;
  imageUrl: string;      // should point to /posters/*.jpg
  url: string;
  layout?: "landscape" | "portrait";  // default: landscape
  titlePosition?: "bottom-left" | "bottom-center" | "top-left" | "top-right";
}

interface PosterStripProps {
  posters: PosterData[];
}

export default function PosterStrip({ posters }: PosterStripProps) {
  if (!posters || posters.length === 0) return null;

  const isSingle = posters.length === 1;

  return (
    <div
      className={`w-full mt-6 ${
        isSingle ? "flex justify-center" : "flex gap-4 overflow-x-auto pb-2"
      }`}
    >
      {posters.map((poster, i) => {
        // Ensure path resolves correctly
        const src = poster.imageUrl?.startsWith("/")
          ? poster.imageUrl
          : `/posters/${poster.imageUrl}`;

        return (
          <a
            key={i}
            href={poster.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${poster.title}`}
          >
            <PosterCard
              title={poster.title}
              imageUrl={src}
              layout={poster.layout ?? "landscape"}
              titlePosition={poster.titlePosition ?? "bottom-left"}
            />
          </a>
        );
      })}
    </div>
  );
}
