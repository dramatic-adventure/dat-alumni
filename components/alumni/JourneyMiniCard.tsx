// components/alumni/JourneyMiniCard.tsx
"use client";

import Image from "next/image";
import styles from "./JourneyMiniCard.module.css";
import type { Update } from "@/lib/types";

// ✅ FIX: Properly type the component props
type JourneyMiniCardProps = {
  update: Update;
  onClick: () => void;
};

export default function JourneyMiniCard({ update, onClick }: JourneyMiniCardProps) {
  const imageUrl = update.mediaUrls?.split(",")?.[0]?.trim() || "";
  const title = update.title?.trim() || "Untitled";
  const ctaText = update.ctaText?.trim() || "Learn More";

  return (
    <div
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      {imageUrl && imageUrl.startsWith("http") && (
        <Image
          src={imageUrl}
          alt={title}
          width={100}
          height={100}
          className={styles.image}
          loading="lazy"
        />
      )}
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        <button className={styles.button}>{ctaText}</button>
      </div>
    </div>
  );
}
