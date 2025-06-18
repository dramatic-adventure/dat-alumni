"use client";

interface PosterData {
  title: string;
  imageUrl: string;
  url: string;
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
  heading = "Featured DAT Works",
  headingStyle = {},
  titleStyle = {},
}: PosterStripProps) {
  if (!posters || posters.length === 0) return null;

  return (
    <section
      className="w-full pt-10 pb-14"
      style={{
        paddingLeft: "15px",
        paddingRight: "15px",
      }}
    >
      {/* 🏷️ Section Heading */}
      <h2
        className="mb-10"
        style={{
          fontFamily: "Anton, sans-serif",
          fontSize: "2.5rem",
          letterSpacing: "1px",
          color: "#F6E4C1",
          textAlign: "center",
          margin: "0 auto",
          ...headingStyle, // ✅ Custom overrides
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
            alignItems: "center",
            gap: "15px",
            flexWrap: "nowrap",
          }}
        >
          {posters.map((poster, i) => (
            <div
              key={i}
              style={{
                width: "clamp(220px, 30vw, 300px)",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  backgroundColor: "#000",
                  borderRadius: "6px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={poster.imageUrl}
                  alt={poster.title}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>

              {/* 📝 Title Under Poster */}
              <div
                style={{
                  marginTop: "0.5rem",
                  marginBottom: "0.5rem",
                  backgroundColor: "#f2f2f2",
                  color: "#000",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.8rem",
                  fontWeight: "normal",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  lineHeight: 1.25,
                  boxShadow: "2px 2px 6px rgba(0,0,0,0.25)",
                  ...titleStyle, // ✅ Custom title style
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
