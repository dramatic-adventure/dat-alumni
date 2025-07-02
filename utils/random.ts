// utils/random.ts
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomFont() {
  const fonts = [
    "Courier New, monospace",
    "Lucida Console, monospace",
    "Courier, monospace",
    "monospace",
  ];
  return randomFromArray(fonts);
}
