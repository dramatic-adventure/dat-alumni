import type { ReactNode } from "react";
import "@/app/globals.css";

export default function StorySlugLayout({ children }: { children: ReactNode }) {
  console.log("✔ [slug]/layout.tsx loaded");
  return <>{children}</>;
}
