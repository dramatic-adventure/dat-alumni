export const LANGUAGE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Fluent",
  "Native",
] as const;

export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];
