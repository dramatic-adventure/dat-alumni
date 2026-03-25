import React from "react";

interface ResponsiveVideoEmbedProps {
  embedUrl: string;
  title?: string;
  ratio?: "16:9" | "4:3" | "1:1" | "21:9"; // Expand as needed
}

const aspectRatios = {
  "16:9": "pb-[56.25%]",  // 9/16 = 0.5625
  "4:3": "pb-[75%]",      // 3/4 = 0.75
  "1:1": "pb-[100%]",
  "21:9": "pb-[42.85%]",
};

export default function ResponsiveVideoEmbed({
  embedUrl,
  title = "Embedded video",
  ratio = "16:9",
}: ResponsiveVideoEmbedProps) {
  return (
    <div className="w-full max-w-[768px] mx-auto">
      <div className={`relative h-0 ${aspectRatios[ratio] || aspectRatios["16:9"]}`}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-md"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
