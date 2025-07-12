// utils/random.ts

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Font variable names (for CSS-in-JS usage)
export const fontVars = [
  "var(--font-vt323)",               // Pixel-style, punchy and stylized
  "var(--font-special-elite)",       // Grungy typewriter
  "var(--font-share-tech)",          // Futuristic digital feel
  "var(--font-cutive-mono)",         // Slightly serifed typewriter feel
  "var(--font-anonymous-pro)",       // Clean and contemporary mono
  "var(--font-syne-mono)",           // Rounded, graphic, modern
  "var(--font-zilla-slab)",          // Slab serif, elegant and readable
  "var(--font-dm-sans)",
  "var(--font-space-grotesk)",
  "var(--font-anton)",
];

// Returns full fallback-safe font stack
export function getRandomFont(): string {
  const font = randomFromArray(fontVars);
  const fallback = "'Space Grotesk', 'DM Sans', sans-serif";
  return `${font}, ${fallback}`;
}
