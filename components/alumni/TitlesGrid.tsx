"use client";

import * as React from "react";
import Link from "next/link";
import styles from "./TitlesGrid.module.css";
import type { AlumniRow } from "@/lib/types";
import { buildTitleBuckets, slugifyTitle } from "@/lib/titles";

type Props = { alumni: AlumniRow[] };

export default function TitlesGrid({ alumni }: Props) {
  const buckets = buildTitleBuckets(alumni);

  // Flatten buckets with counts
  const items = Array.from(buckets.values())
    .filter((b) => b.people.size > 0)
    .map((b) => {
      const key = String(b.meta.key);
      const isDynamic = key.startsWith("title:");
      const href = isDynamic ? `/title/${slugifyTitle(b.meta.label)}` : `/title/${key}`;
      return {
        key,
        label: b.meta.label,
        color: b.meta.color,
        icon: b.meta.icon,
        count: b.people.size,
        href,
      };
    });

  // Sort: largest bucket first, then label A→Z for ties
  items.sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));

  if (!items.length) return null;

  return (
    <div className={styles.titlesGrid}>
      {items.map((b) => (
        <Link key={b.key} href={b.href} className={styles.titleLink}>
          <div className={styles.iconBox}>
            <div className={styles.iconBg} style={{ backgroundColor: b.color }} />
            <span className={styles.icon}>{b.icon}</span>
          </div>
          <span className={styles.titleLabel}>
            {b.label} ({b.count})
          </span>
        </Link>
      ))}
    </div>
  );
}
