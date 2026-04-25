"use client";

import * as React from "react";
import Link from "next/link";
import styles from "./TitlesGrid.module.css";
import type { AlumniRow } from "@/lib/types";
import { buildTitleBuckets, slugifyTitle } from "@/lib/titles";

type Props = { alumni: AlumniRow[] };

// Show-more thresholds.
// CSS handles the actual visible count (8 mobile / 12 desktop for roles, 15 for pathways).
// These thresholds decide whether the toggle button renders at all.
const ROLES_TOGGLE_THRESHOLD = 8;
const PATHWAYS_TOGGLE_THRESHOLD = 15;

export default function TitlesGrid({ alumni }: Props) {
  const [rolesExpanded, setRolesExpanded] = React.useState(false);
  const [pathwaysExpanded, setPathwaysExpanded] = React.useState(false);

  const buckets = buildTitleBuckets(alumni);

  const allItems = Array.from(buckets.values())
    .filter((b) => b.people.size > 0)
    .map((b) => {
      const key = String(b.meta.key);
      const isDynamic = key.startsWith("title:") || key.startsWith("pathway:");
      const href = isDynamic ? `/title/${slugifyTitle(b.meta.label)}` : `/title/${key}`;
      return {
        key,
        label: b.meta.label,
        color: b.meta.color,
        icon: b.meta.icon,
        count: b.people.size,
        href,
        category: b.category,
      };
    });

  // DAT Roles: largest first, then A→Z
  const datRoles = allItems
    .filter((b) => b.category === "dat-role")
    .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));

  // Professional Pathways: largest first, then A→Z
  const pathways = allItems
    .filter((b) => b.category === "professional-pathway")
    .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));

  if (!datRoles.length && !pathways.length) return null;

  const showRolesToggle = datRoles.length > ROLES_TOGGLE_THRESHOLD;
  const showPathwaysToggle = pathways.length > PATHWAYS_TOGGLE_THRESHOLD;

  return (
    <div className={styles.titlesGridRoot}>
      {datRoles.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionHeading}>DAT Roles</span>
            <p className={styles.sectionDesc}>
              Official roles and creative positions within Dramatic Adventure Theatre.
            </p>
          </div>
          <div
            className={
              showRolesToggle && !rolesExpanded
                ? `${styles.titlesGrid} ${styles.titlesGridCollapsed}`
                : styles.titlesGrid
            }
          >
            {datRoles.map((b) => (
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
          {showRolesToggle && (
            <button
              type="button"
              className={styles.showMoreBtn}
              onClick={() => setRolesExpanded((v) => !v)}
              aria-expanded={rolesExpanded}
            >
              {rolesExpanded ? "See less" : "See more"}
            </button>
          )}
        </section>
      )}

      {pathways.length > 0 && (
        <section className={styles.pathwaysSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionHeading}>Professional Pathways</span>
            <p className={styles.sectionDesc}>
              Current fields, practices, and professions represented across the DAT alumni network.
            </p>
          </div>
          <div
            className={
              showPathwaysToggle && !pathwaysExpanded
                ? `${styles.pathwaysGrid} ${styles.pathwaysGridCollapsed}`
                : styles.pathwaysGrid
            }
          >
            {pathways.map((b) => (
              <Link key={b.key} href={b.href} className={styles.pathwayLink}>
                {b.label}
                <span className={styles.pathwayCount}>{b.count}</span>
              </Link>
            ))}
          </div>
          {showPathwaysToggle && (
            <button
              type="button"
              className={styles.showMorePathwaysBtn}
              onClick={() => setPathwaysExpanded((v) => !v)}
              aria-expanded={pathwaysExpanded}
            >
              {pathwaysExpanded ? "See less" : "See more"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
