import type { DramaClubCause } from "@/lib/causes";
import {
  CAUSE_CATEGORIES_BY_ID,
  CAUSE_SUBCATEGORIES_BY_CATEGORY,
} from "@/lib/causes";

type CausePillsProps = {
  causes: DramaClubCause[];
  compact?: boolean;
};

export function CausePills({ causes, compact }: CausePillsProps) {
  if (!causes || causes.length === 0) return null;

  const unique = Array.from(
    new Map(
      causes.map((c) => {
        const subMeta =
          CAUSE_SUBCATEGORIES_BY_CATEGORY[c.category].find(
            (s) => s.id === c.subcategory
          );
        const label = subMeta?.label ?? c.subcategory;
        const key = `${c.category}::${c.subcategory}`;
        return [key, { key, categoryId: c.category, label }];
      })
    ).values()
  );

  return (
    <div
      className="cause-pills"
      data-compact={compact ? "true" : "false"}
    >
      {unique.map((cause) => (
        <span
          key={cause.key}
          className="cause-pill"
          data-category={cause.categoryId}
        >
          {cause.label}
        </span>
      ))}

      {/* existing styles here */}
    </div>
  );
}
