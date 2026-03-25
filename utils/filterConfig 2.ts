// utils/filterConfig.ts

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
}

export const filterConfig: FilterConfig[] = [
  {
    id: "programs",
    label: "Programs",
    options: [
      { label: "RAW", value: "raw" },
      { label: "CASTAWAY", value: "castaway" },
      { label: "ACTion", value: "action" },
    ],
  },
  {
    id: "season",
    label: "Seasons",
    options: [
      { label: "Season 1", value: "season 1" },
      { label: "Season 2", value: "season 2" },
      { label: "Season 3", value: "season 3" },
    ],
  },
  {
    id: "identityTags",
    label: "Identity Tags",
    options: [
      { label: "Latina", value: "latina" },
      { label: "Indigenous", value: "indigenous" },
      { label: "LGBTQ+", value: "lgbtq" },
    ],
  },
  {
    id: "location",
    label: "Location",
    options: [
      { label: "New York City", value: "nyc" },
      { label: "Los Angeles", value: "los angeles" },
      { label: "Quito", value: "quito" },
    ],
  },
];
