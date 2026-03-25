import * as React from "react";
import { dramaClubs } from "@/lib/dramaClubMap";
import { CAUSE_CATEGORIES_BY_ID } from "@/lib/causes";
import { PillToggle } from "@/components/ui/PillToggle";
import { Chip } from "@/components/ui/Chip";
import { CountPill } from "@/components/ui/CountPill";

type Mode = "status" | "country" | "cause";

type Selection =
  | { type: "group"; label: string }
  | { type: "club"; slug: string; label: string };

export function DramaClubAccordion({
  value,
  onChange,
}: {
  value?: Selection;
  onChange: (s: Selection) => void;
}) {
  const [mode, setMode] = React.useState<Mode>("status");
  const [openKey, setOpenKey] = React.useState<string | null>(null);

  const groups = React.useMemo(() => {
    if (mode === "status") {
      const buckets: Record<string, typeof dramaClubs> = { new: [], ongoing: [], legacy: [] };
      for (const c of dramaClubs) {
        const st = (c.statusOverride ?? c.status ?? "legacy") as "new" | "ongoing" | "legacy";
        buckets[st].push(c);
      }
      return [
        { key: "new", label: "New", clubs: buckets.new },
        { key: "ongoing", label: "Ongoing", clubs: buckets.ongoing },
        { key: "legacy", label: "Legacy", clubs: buckets.legacy },
      ].filter(g => g.clubs.length);
    }

    if (mode === "country") {
      const byCountry = new Map<string, typeof dramaClubs>();
      for (const c of dramaClubs) {
        const k = c.country || "Other";
        byCountry.set(k, [...(byCountry.get(k) ?? []), c]);
      }
      const items = Array.from(byCountry.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([country, clubs]) => ({ key: country, label: country, clubs }));

      // "All countries" like your image-4 “All Countries”
      return [{ key: "__all__", label: "All Countries", clubs: dramaClubs }, ...items];
    }

    // mode === "cause"
    const byCauseCat = new Map<string, typeof dramaClubs>();
    for (const c of dramaClubs) {
      const cats = new Set((c.causes ?? []).map(x => x.category));
      for (const cat of cats) {
        byCauseCat.set(cat, [...(byCauseCat.get(cat) ?? []), c]);
      }
    }
    const items = Array.from(byCauseCat.entries())
      .map(([catId, clubs]) => ({
        key: catId,
        label: CAUSE_CATEGORIES_BY_ID[catId as keyof typeof CAUSE_CATEGORIES_BY_ID]?.shortLabel
          ?? CAUSE_CATEGORIES_BY_ID[catId as keyof typeof CAUSE_CATEGORIES_BY_ID]?.label
          ?? catId,
        clubs,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [{ key: "__all__", label: "All Causes", clubs: dramaClubs }, ...items];
  }, [mode]);

  return (
    <div className="space-y-4">
      <PillToggle
        value={mode}
        onChange={setMode}
        ariaLabel="Drama club grouping"
        options={[
          { value: "status", label: "Status" },
          { value: "country", label: "Country" },
          { value: "cause", label: "Cause" },
        ]}
      />

      <div className="space-y-3">
        {groups.map((g) => {
          const isOpen = openKey === g.key;

          // Image-3 style for the “NEW / 4 CLUBS” moment:
          const showCountPill = mode === "status" && g.key === "new";

          return (
            <div key={g.key} className="rounded-2xl border border-[rgba(242,242,242,0.12)] bg-black/0">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-4 px-4 py-3"
                onClick={() => setOpenKey(isOpen ? null : g.key)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm uppercase tracking-[0.22em] text-[#f2f2f2]/85">
                    {g.label}
                  </span>

                  {showCountPill ? (
                    <CountPill tag="New" text={`${g.clubs.length} Clubs`} />
                  ) : (
                    <span className="text-xs uppercase tracking-[0.22em] text-[#f2f2f2]/55">
                      {g.clubs.length}
                    </span>
                  )}
                </div>

                {/* Selecting just the heading is a valid selection */}
                <Chip
                  selected={value?.type === "group" && value.label === g.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ type: "group", label: g.label });
                  }}
                >
                  Select
                </Chip>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  {g.clubs.map((c) => (
                    <Chip
                      key={c.slug}
                      selected={value?.type === "club" && value.slug === c.slug}
                      onClick={() => onChange({ type: "club", slug: c.slug, label: c.name })}
                    >
                      {c.name}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
