// lib/ulid.ts
//
// Crockford base32 ULID: 48-bit timestamp + 80 bits of randomness. Good enough
// as an idempotency/entity key without pulling in a dependency. Client-side
// (uses crypto.getRandomValues). Extracted from CaptureForm for Slice 6 so the
// Composer/Publish/Retroactive surfaces mint ids the same way captures do.

const ULID_ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function ulid(): string {
  let now = Date.now();
  const time: string[] = new Array(10);
  for (let i = 9; i >= 0; i--) {
    time[i] = ULID_ENCODING[now % 32];
    now = Math.floor(now / 32);
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes, (b) => ULID_ENCODING[b % 32]);
  return time.join("") + rand.join("");
}
