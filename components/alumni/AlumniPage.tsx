// /components/alumni/AlumniPage.tsx
"use client";

import Link from "next/link";
import type { EnrichedProfileLiveRow } from "@/components/alumni/AlumniSearch/enrichAlumniData.server";

type HighlightItem = {
  name: string;
  slug: string;
  roles?: string[];
  headshotUrl?: string;
};

type AlumniCardItem = {
  name: string;
  slug: string;
  roles: string[];
  headshotUrl: string;
};

type UpdateItem = {
  text: string;
  link: string;
  author: string;
};

export type AlumniPageProps = {
  highlights: HighlightItem[];
  alumniData: AlumniCardItem[];
  enrichedData?: EnrichedProfileLiveRow[]; // optional while wiring
  initialUpdates: UpdateItem[];
};

export default function AlumniPage({
  highlights,
  alumniData,
  enrichedData,
  initialUpdates,
}: AlumniPageProps) {
  // NOTE: This file is intentionally minimal and TS-clean.
  // Wire enrichedData into your search component here (if you have one).

  return (
    <div className="p-6">
      {/* Highlights */}
      {!!highlights?.length && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Highlights</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h) => (
              <Link
                key={h.slug}
                href={`/alumni/${h.slug}`}
                className="rounded-xl border p-4 hover:shadow-sm transition"
              >
                <div className="font-semibold">{h.name}</div>
                {!!(h.roles?.length) && (
                  <div className="text-sm opacity-80 mt-1">{h.roles.join(", ")}</div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Updates */}
      {!!initialUpdates?.length && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Recent Updates</h2>
          <div className="grid gap-3">
            {initialUpdates.map((u, i) => (
              <Link
                key={`${u.author}-${i}`}
                href={u.link}
                className="rounded-xl border p-4 hover:shadow-sm transition"
              >
                <div className="text-sm opacity-70">{u.author}</div>
                <div className="mt-1">{u.text}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search data presence (debug-friendly) */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">Search</h2>
        {enrichedData?.length ? (
          <p className="text-sm opacity-80">
            Search dataset loaded: <strong>{enrichedData.length}</strong> public Profile-Live rows.
          </p>
        ) : (
          <p className="text-sm opacity-80">
            Search dataset not loaded (enrichedData missing). That’s okay while wiring.
          </p>
        )}
        {/* TODO: plug enrichedData into your client search component here */}
      </section>

      {/* Alumni Grid */}
      <section>
        <h2 className="text-xl font-semibold mb-4">All Alumni</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alumniData.map((a) => (
            <Link
              key={a.slug}
              href={`/alumni/${a.slug}`}
              className="rounded-xl border p-4 hover:shadow-sm transition"
            >
              <div className="font-semibold">{a.name}</div>
              {!!a.roles?.length && <div className="text-sm opacity-80 mt-1">{a.roles.join(", ")}</div>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
