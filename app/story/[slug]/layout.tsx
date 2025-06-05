// app/story/[slug]/layout.tsx

import "@/app/globals.css";

import type { ReactNode } from "react";

export default function StorySlugLayout({ children }: { children: React.ReactNode }) {
  console.log("✔ [slug]/layout.tsx loaded");
  return <>{children}</>;
}

