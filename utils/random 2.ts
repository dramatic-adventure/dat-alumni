export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Font variables (optional for ProgramStamps)
export const fontVars = [
  "var(--font-vt323)",
  "var(--font-special-elite)",
  "var(--font-share-tech)",
  "var(--font-cutive-mono)",
  "var(--font-anonymous-pro)",
  "var(--font-syne-mono)",
  "var(--font-zilla-slab)",
  "var(--font-dm-sans)",
  "var(--font-space-grotesk)",
  "var(--font-anton)",
];

export function getRandomFont(): string {
  const font = randomFromArray(fontVars);
  const fallback = "var(--font-space-grotesk), var(--font-dm-sans), system-ui, sans-serif";
  return `${font}, ${fallback}`;
}

/**
 * ✅ Weighted random selection
 * @param items Array of items to choose from
 * @param weights Array of weights (same length as items)
 * @returns Randomly selected item based on weight distribution
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length !== weights.length) {
    throw new Error("Items and weights arrays must have the same length.");
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const randomNum = Math.random() * totalWeight;

  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (randomNum <= cumulative) {
      return items[i];
    }
  }

  return items[items.length - 1]; // Fallback
}
