"use client";

import { useRouter } from "next/navigation";

export default function IdentityTags({
  tags,
  buttonSpacing = "0.75rem", // default spacing = 12px
}: {
  tags: string[];
  buttonSpacing?: string;
}) {
  const router = useRouter();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-emd",
        gap: buttonSpacing,
      }}
    >
      {tags.map((tag, i) => (
        <button
          key={i}
          onClick={() =>
            router.push(`/directory?identity=${encodeURIComponent(tag)}`)
          }
          className="px-5 py-3 rounded-full text-[#F2F2F2] text-sm font-bold uppercase tracking-wider text-center transition-colors duration-150"
          style={{
            backgroundColor: "#16697A",
            fontFamily: '"Space Grotesk", sans-serif',
            letterSpacing: "0.2rem",
            padding: "1.25rem",
            lineHeight: "1.2",
            minHeight: "3.6rem",
            border: "none",
            boxShadow: "none",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#0f4f5c")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#16697A")
          }
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
