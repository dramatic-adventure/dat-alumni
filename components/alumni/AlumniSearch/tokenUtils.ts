// components/alumni/AlumniSearch/tokenUtils.ts
import { normalizeText } from "./searchUtils";

/** Split normalized text into tokens */
export function tokenize(raw?: string): string[] {
  const n = normalizeText((raw || "").trim());
  if (!n) return [];
  return n.split(/\s+/).filter(Boolean);
}

/** Add phrase token + word tokens into a Set */
export function addPhraseTokens(set: Set<string>, raw?: string) {
  const v = (raw || "").trim();
  if (!v) return;

  const n = normalizeText(v);
  if (!n) return;

  set.add(n);
  n.split(/\s+/).filter(Boolean).forEach((t) => set.add(t));
}
