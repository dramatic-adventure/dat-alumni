// app/apply/page.tsx
import type { Metadata } from "next";
import { findOpportunity, loadOpportunities } from "@/lib/loadOpportunities";
import ApplyClient from "./ApplyClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Apply — DAT Opportunities",
  description:
    "Apply to a Dramatic Adventure Theatre opportunity, audition, role, or volunteer position.",
};

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ opp?: string }>;
}) {
  const { opp: oppParam } = await searchParams;
  const [opportunity, all] = await Promise.all([
    oppParam ? findOpportunity(oppParam) : Promise.resolve(null),
    loadOpportunities(),
  ]);

  // For the standalone "general" application, surface a list of open opportunities
  // so the user can choose which one they're applying to.
  const openOpportunities = all.filter(
    (o) => o.status === "open" || o.status === "coming_soon" || o.status === "evergreen",
  );

  return (
    <ApplyClient
      opportunity={opportunity}
      openOpportunities={openOpportunities.map((o) => ({
        id: o.id,
        title: o.title,
        type: o.type,
        hub: o.hub,
      }))}
    />
  );
}
