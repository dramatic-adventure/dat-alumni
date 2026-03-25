// app/story/[slug]/ClientStory.tsx
"use client";
import type { StoryRow } from "@/lib/types";
import StoryPage from "@/components/story/StoryPage";

export default function ClientStory({ story }: { story: StoryRow }) {
  return <StoryPage story={story} />;
}
