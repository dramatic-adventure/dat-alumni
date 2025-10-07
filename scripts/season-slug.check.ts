import { getSeasonNumberFromSlug } from "../lib/seasonSlug";

const cases = ["season-01", "season-7", "season-12", "Season-003", "SEASON-20", "bad"];

for (const c of cases) {
  const n = getSeasonNumberFromSlug(c);
  console.log(c, "→", n, n ? `/seasons/season-${n}.jpg` : "(fallback)");
}

// Expected:
// season-01  → 1  /seasons/season-1.jpg
// season-7   → 7  /seasons/season-7.jpg
// season-12  → 12 /seasons/season-12.jpg
// Season-003 → 3  /seasons/season-3.jpg
// SEASON-20  → 20 /seasons/season-20.jpg
// bad        → null (fallback)
