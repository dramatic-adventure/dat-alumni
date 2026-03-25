// lib/dramaClubStatusStyles.ts
import type { DramaClubStatus } from "@/lib/dramaClubStatus";

export const DRAMA_CLUB_STATUS_META: Record<
  DramaClubStatus,
  { bg: string; text: string; border: string }
> = {
  new: {
    bg: "rgba(242, 51, 89, 0.15)",
    text: "#F23359",
    border: "rgba(242, 51, 89, 0.55)",
  },
  ongoing: {
    bg: "rgba(255, 204, 0, 0.18)",
    text: "#8A6400",
    border: "#8A6400",
  },
  legacy: {
    bg: "rgba(108, 0, 175, 0.22)",
    text: "#3B1D59",
    border: "rgba(108, 0, 175, 0.7)",
  },
};

export const DRAMA_CLUB_STATUS_LABEL: Record<DramaClubStatus, string> = {
  new: "NEW",
  ongoing: "ONGOING",
  legacy: "LEGACY",
};

