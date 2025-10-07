// app/story/[slug]/layout.tsx
import type { ReactNode } from "react";
import "@/app/globals.css";
import { clientDebug } from "@/lib/clientDebug";

export default function StorySlugLayout({ children }: { children: ReactNode }) {
  clientDebug("✔ [slug]/layout.tsx loaded");
  return <>{children}</>;
}
