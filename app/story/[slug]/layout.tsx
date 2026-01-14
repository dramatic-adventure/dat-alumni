// app/story/[slug]/layout.tsx
import type { ReactNode } from "react";
import "@/app/globals.css";
import { serverDebug } from "@/lib/serverDebug";

export default function StorySlugLayout({ children }: { children: ReactNode }) {
  // ✅ Server Component by default — use serverDebug here, NOT clientDebug
  serverDebug("✔ [story]/[slug]/layout.tsx loaded");
  return <>{children}</>;
}
