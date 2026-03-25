"use client";

import dynamic from "next/dynamic";
import type { StoryMapProps } from "./StoryMap";

// Dynamically import the Mapbox component only on the client
const StoryMap = dynamic<StoryMapProps>(() => import("./StoryMap"), {
  ssr: false,
  loading: () => (
    <div
      aria-label="Loading map…"
      style={{
        width: "100%",
        height: "100vh",
        background: "transparent",
      }}
    />
  ),
});

export default function StoryMapClient(props: StoryMapProps) {
  return <StoryMap {...props} />;
}
