"use client";

import JourneyMiniCard from "./JourneyMiniCard";
import styles from "./CategoryScroller.module.css";
import type { Update } from "@/lib/types";

interface CategoryBlock {
  category: string;
  updates: Update[];
}

interface Props {
  categories: CategoryBlock[];
  onCardClick: (update: Update) => void;
}

export default function CategoryScroller({ categories, onCardClick }: Props) {
  return (
    <div className={styles.wrapper}>
      {categories.map(({ category, updates }) => (
        <div key={category} className={styles.carouselBlock}>
          <h3 className={styles.categoryLabel}>{category}</h3>

          <div className={styles.carousel}>
            {updates.map((update) => (
              <JourneyMiniCard
                key={update.updateId ?? `${category}-${update.title}`}
                update={update}
                onClick={() => onCardClick(update)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
