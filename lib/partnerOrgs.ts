// lib/partnerOrgs.ts
//
// The partner-org store (net-new, 2026-08-19): slug → display name, logo from
// the repo's /public/images/partners, optional site URL. Grows by hand as
// partners are confirmed; the humanized-slug fallback in
// components/field-kit/partnerOrgName.ts keeps unknown slugs readable.
// Honest rule: a URL appears here only when it's verified — a partner card
// without one renders as a credit, never a fabricated link.

export type PartnerOrg = {
  name: string;
  /** /public path. */
  logo?: string;
  /** Backdrop behind the logo — white-on-transparent marks need a dark chip. */
  logoBg?: string;
  url?: string;
};

export const PARTNER_ORGS: Record<string, PartnerOrg> = {
  "etp-slovensko": {
    name: "ETP Slovensko",
    logo: "/images/partners/etp-slovensko.jpg",
    url: "https://etp.sk",
  },
  "divadlo-na-perone": {
    name: "Divadlo Na Peróne",
    logo: "/images/partners/na-perone-white.png",
    logoBg: "#241123",
  },
  "kosice-kc": {
    name: "Kasárne / Kulturpark",
  },
};
