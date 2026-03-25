// lib/productionFundraising.ts

export type ProductionFundraisingMeta = {
  slug: string;
  is_hidden?: boolean;
  label?: string;
  subline?: string;
};

export const productionFundraising: ProductionFundraisingMeta[] = [
  // Optional overrides for productions that are automatically included in fundraising.
  // slug must exactly match productionMap.
  // Upcoming/current productions are auto-included.
  // If a production has no usable runStartISO or runEndISO date, we currently assume it is upcoming/current.
  // Use is_hidden: true to remove a production from the donation dashboard.
  // label and subline can override the default display text.
  //
  // Examples:
  // { slug: "el-arcoiris-de-san-luis", subline: "Support the next stage of this new work." },
  // { slug: "some-production-you-dont-want-listed", is_hidden: true },
];

export const PRODUCTION_FUNDRAISING_BY_SLUG: Record<string, ProductionFundraisingMeta> =
  productionFundraising.reduce((acc, item) => {
    acc[item.slug] = item;
    return acc;
  }, {} as Record<string, ProductionFundraisingMeta>);
