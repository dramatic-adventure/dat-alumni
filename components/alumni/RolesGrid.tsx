"use client";

import * as React from "react";
import Link from "next/link";
import styles from "./RolesGrid.module.css";
import {
  flagStyles,
  iconMap,
  getCanonicalFlag,
  slugifyFlag,
  FlagLabel,
} from "@/lib/flags";
import { pluralizeTitle } from "@/lib/pluralizeTitle";
import { AlumniRow } from "@/lib/types";

interface RolesGridProps {
  roles?: string[];
  alumni: AlumniRow[];
}

export default function RolesGrid({ roles, alumni }: RolesGridProps) {
  const presentFlags = new Set<FlagLabel>();
  for (const a of alumni) {
    for (const f of a.statusFlags ?? []) {
      const c = getCanonicalFlag(f);
      if (c) presentFlags.add(c);
    }
  }

  const candidates = (roles?.length ? roles : (Object.keys(flagStyles) as FlagLabel[]))
    .map((r) => getCanonicalFlag(r) as FlagLabel | null)
    .filter((r): r is FlagLabel => !!r && presentFlags.has(r));

  if (!candidates.length) return null;

  return (
    <div className={styles.rolesGrid}>
      {candidates.map((role) => {
        const color = flagStyles[role];
        const icon = iconMap[role];
        const slug = slugifyFlag(role);
        const label = pluralizeTitle(role);

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
