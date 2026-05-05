"use client";

import { useRouter } from "next/navigation";
import { slugifyTag } from "@/lib/tags";

export default function IdentityTags({
  tags,
  buttonSpacing = "0.5rem",
}: {
  tags: string[];
  buttonSpacing?: string;
}) {
  const router = useRouter();

  return (
    <>
      <style>{`
        .identity-tag {
          background-color: #16697A;
          font-family: var(--font-space-grotesk), system-ui, sans-serif;
          letter-spacing: 0.15rem;
          padding: 0.65rem 1rem;
          line-height: 1.2;
          min-height: 2.6rem;
          border: none;
          box-shadow: none;
          border-radius: 999px;
          color: #F2F2F2;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          cursor: pointer;
          transition: background-color 150ms ease;
          -webkit-tap-highlight-color: transparent;
        }
        @media (min-width: 641px) {
          .identity-tag {
            padding: 0.9rem 1.25rem;
            min-height: 3rem;
            font-size: 0.8rem;
          }
        }
        .identity-tag:hover {
          background-color: #0f4f5c;
        }
      `}</style>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "flex-end",
          gap: buttonSpacing,
        }}
      >
        {tags.map((tag, i) => (
          <button
            key={i}
            onClick={() => router.push(`/tag/${slugifyTag(tag)}`)}
            className="identity-tag"
          >
            {tag}
          </button>
        ))}
      </div>
    </>
  );
}
