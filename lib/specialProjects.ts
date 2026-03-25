// lib/specialProjects.ts
import type { DonationSelectOption } from "@/lib/donations";

export type SpecialProject = {
  id: string; // stable id used in URLs / query params
  title: string;
  subline?: string;
  is_active: boolean;
};

export const specialProjects: SpecialProject[] = [
  // Example:
  // {
  //   id: "ecuador-earthquake-relief",
  //   title: "Ecuador Artist Relief",
  //   subline: "Rapid response for artists after disaster.",
  //   is_active: true,
  // },
];

export function getActiveSpecialProjects(): DonationSelectOption[] {
  return specialProjects
    .filter((p) => p.is_active)
    .map((p) => ({
      id: p.id,
      label: p.title,
      subline: p.subline,
    }));
}
