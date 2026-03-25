// lib/tags.ts

import slugify from "slugify";

export function slugifyTag(tag: string): string {
  return slugify(tag, { lower: true, strict: true });
}

export function getCanonicalTag(tag: string): string {
  return tag.trim();
}
