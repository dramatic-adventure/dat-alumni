"use client";

import * as React from "react";
import Link from "next/link";
import styles from "./RolesGrid.module.css";
import {
  flagStyles,
  iconMap,
  getCanonicalFlag,
  slugifyFlag,
  displayFlagLabel,
  FlagLabel,
} from "@/lib/flags";
import { pluralizeTitle } from "@/lib/pluralizeTitle";
import { AlumniRow } from "@/lib/types";

interface RolesGridProps {
  roles?: string[];
  alumni: AlumniRow[];
}

const ROLE_ORDER: FlagLabel[] = [
  "Founding Member",
  "Board Member",
  "Staff",
  "Resident Artist",
  "Associate Artist",
  "Fellow",
  "Artist-in-Residence",
  "Volunteer",
  "Intern",
];

const ROLE_ORDER_INDEX = new Map(
  ROLE_ORDER.map((role, index) => [role, index])
);

export default function RolesGrid({ roles, alumni }: RolesGridProps) {
  const presentFlags = new Set<FlagLabel>();
  for (const a of alumni) {
    for (const f of a.statusFlags ?? []) {
      const c = getCanonicalFlag(f);
      if (c) presentFlags.add(c);
    }
  }

  const candidates = Array.from(
    new Set(
      (roles?.length ? roles : (Object.keys(flagStyles) as FlagLabel[]))
        .map((r) => getCanonicalFlag(r) as FlagLabel | null)
        .filter((r): r is FlagLabel => !!r && presentFlags.has(r))
    )
  ).sort((a, b) => {
    const ai = ROLE_ORDER_INDEX.get(a) ?? 999;
    const bi = ROLE_ORDER_INDEX.get(b) ?? 999;
    return ai - bi || a.localeCompare(b);
  });

  if (!candidates.length) return null;

  return (
    <div className={styles.rolesGrid}>
      {candidates.map((role) => {
        const color = flagStyles[role];
        const icon = iconMap[role];
        const slug = slugifyFlag(role);
        const label = pluralizeTitle(displayFlagLabel(role));

        return (
          <Link key={role} href={`/role/${slug}`} className={styles.roleLink}>
            <div className={styles.iconBox}>
              {/* background layer with reduced opacity */}
              <div className={styles.iconBg} style={{ backgroundColor: color }} />
              {/* emoji on top at full opacity */}
              <span className={styles.icon}>{icon}</span>
            </div>
            <span className={styles.roleLabel}>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
