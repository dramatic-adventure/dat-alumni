// lib/productionFundraising.ts

export type ProductionFundraisingMeta = {
  slug: string;
  is_active: boolean;
  label?: string;   // optional override title
  subline?: string; // optional override subline
};

export const productionFundraising: ProductionFundraisingMeta[] = [
  // Example:
  // { slug: "the-serpent-forest", is_active: true, label: "The Serpent Forest", subline: "A new work in development." },
];

export const PRODUCTION_FUNDRAISING_BY_SLUG: Record<string, ProductionFundraisingMeta> =
  productionFundraising.reduce((acc, item) => {
    acc[item.slug] = item;
    return acc;
  }, {} as Record<string, ProductionFundraisingMeta>);
