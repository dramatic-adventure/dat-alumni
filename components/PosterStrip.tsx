"use client";

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
    <section
      className="w-full pt-10 pb-14"
      style={{ paddingLeft: "15px", paddingRight: "15px" }}
    >
      {/* 🏷️ Section Heading */}
      <h2
        className="mb-10"
        style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "2.8rem",
          letterSpacing: "1px",
          color: "#d9a919",
          textAlign: "center",
          margin: "0 auto",
          marginBottom: "0.25rem",
          ...headingStyle,
        }}
      >
        {heading}
      </h2>

      {/* 🎞️ Poster Row */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
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
              {/* 🖼️ Image Link with Hover Border Only */}
              <a
                href={`${baseUrl}${poster.url}`}
                style={{
                  display: "block",
                  width: "100%",
                  height: "180px",
                  backgroundColor: "#000",
                  borderRadius: "6px",
                  overflow: "hidden",
                  transition: "border 0.25s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = "3px solid #F23359";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "none";
                }}
              >
                <img
                  src={poster.imageUrl}
                  alt={poster.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </a>

              {/* 📝 Title */}
              <div
                style={{
                  marginTop: "0.05rem",
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
                  boxShadow: "2px 2px 6px rgba(0,0,0,0)",
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
