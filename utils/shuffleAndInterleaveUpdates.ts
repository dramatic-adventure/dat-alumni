// utils/shuffleAndInterleaveUpdates.ts
import type { JourneyCardType } from '@/lib/types';

/**
 * Shuffle and interleave so the same artist doesn't appear back-to-back.
 * Falls back gracefully if it's unavoidable (e.g., many cards from same artist).
 */
export function shuffleAndInterleaveUpdates(updates: JourneyCardType[]): JourneyCardType[] {
  // Fisher–Yates shuffle
  const shuffled = [...updates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const result: JourneyCardType[] = [];

  for (let i = 0; i < shuffled.length; i++) {
    const current = shuffled[i];

    // If previous card is same artist, try to find a different-artist swap ahead
    if (result.length > 0 && result[result.length - 1]?.artistId === current.artistId) {
      let swapIndex = -1;
      for (let k = i + 1; k < shuffled.length; k++) {
        if (shuffled[k].artistId !== current.artistId) {
          swapIndex = k;
          break;
        }
      }
      if (swapIndex !== -1) {
        [shuffled[i], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i]];
      }
    }

    result.push(shuffled[i]);
  }

  return result;
}
