// app/opportunities/page.tsx
import type { Metadata } from "next";
import { loadOpportunities } from "@/lib/loadOpportunities";
import OpportunitiesClient from "./OpportunitiesClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Opportunities — Dramatic Adventure Theatre",
  description:
    "Find your scene with DAT. Artist opportunities, auditions, jobs, volunteer roles, and the PLX program — across our global hubs.",
  openGraph: {
    title: "Opportunities — Dramatic Adventure Theatre",
    description:
      "Find your scene with DAT. Artist opportunities, auditions, jobs, volunteer roles, and the PLX program — across our global hubs.",
    images: ["/images/performing-zanzibar.jpg"],
  },
};

export default async function OpportunitiesPage() {
  const opportunities = await loadOpportunities();
  return <OpportunitiesClient opportunities={opportunities} />;
}
