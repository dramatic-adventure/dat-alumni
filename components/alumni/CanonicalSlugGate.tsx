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
      const res = await fetch(`/api/alumni/lookup?slug=${encodeURIComponent(slug)}&nocache=1`, {
        cache: "no-store",
      });

      if (!res.ok) return;
      const data = await res.json();

      const canonical = String(data?.canonicalSlug || "").trim().toLowerCase();
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
