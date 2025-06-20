"use client";
export {}; // ✅ Ensure ES module scope

interface PosterData {
  title: string;
  imageUrl: string;
  url: string; // internal path, like "/productions/the-bridge"
}

interface PosterStripProps {
  posters: PosterData[];
  justify?: "center" | "flex-start" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  heading?: string;
  headingStyle?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
}

export default function PosterStrip({
  posters,
  justify = "center",
  heading = "FEATURED DAT WORKS",
  headingStyle = {},
  titleStyle = {},
}: PosterStripProps) {
  if (!posters || posters.length === 0) return null;

  const baseUrl = "https://www.dramaticadventure.com";

  return (
    <section className="w-full pt-10 pb-14 px-4">
      {/* 🏷️ Section Heading */}
      <h2
        className="mb-4 text-center text-[2.8rem] tracking-wide"
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          color: "#d9a919",
          ...headingStyle,
        }}
      >
        {heading}
      </h2>

      {/* 🎞️ Poster Row */}
      <div className="flex justify-center w-full">
        <div
          style={{
            display: "flex",
            justifyContent: justify,
            alignItems: "flex-start",
            gap: "15px",
            flexWrap: "nowrap",
          }}
        >
          {posters.map((poster, i) => (
            <div
              key={i}
              style={{
                width: "clamp(220px, 30vw, 300px)",
                flexShrink: 0,
              }}
            >
              {/* 🖼️ Image Link with Hover Border */}
              <a
                href={`${baseUrl}${poster.url}`}
                aria-label={`Link to ${poster.title}`}
                rel="noopener noreferrer"
                target="_self"
                className="block w-full h-[180px] bg-black rounded-md overflow-hidden transition-all hover:border-[3px] hover:border-[#F23359]"
              >
                <img
                  src={poster.imageUrl}
                  alt={poster.title}
                  className="w-full h-full object-contain block"
                />
              </a>

              {/* 📝 Title */}
              <div
                style={{
                  marginTop: "0.3rem",
                  color: "#241123",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "1rem",
                  fontWeight: 600,
                  padding: "6px 10px",
                  borderRadius: "4px",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  lineHeight: 1.25,
                  textAlign: "center",
                  ...titleStyle,
                }}
              >
                {poster.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
