// components/alumni/CanonicalSlugGate.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function CanonicalSlugGate({
  slug,
  basePath = "/alumni",
}: {
  slug: string;
  basePath?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch(`/api/alumni/lookup?alumniId=${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });

      if (!res.ok) return;
      const data = await res.json();

      const canonical = String(data?.alumniId || "").trim().toLowerCase();
      if (!canonical) return;

      if (!cancelled && canonical !== slug.toLowerCase()) {
        router.replace(`${basePath}/${canonical}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, basePath, router]);

  return null;
}
