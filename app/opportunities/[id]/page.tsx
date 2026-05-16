// app/opportunities/[id]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allOpportunityIds } from "@/lib/opportunities";
import { findOpportunity, loadOpportunities } from "@/lib/loadOpportunities";
import OpportunityDetailClient from "./OpportunityDetailClient";

export const revalidate = 3600;

export async function generateStaticParams() {
  return allOpportunityIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const o = await findOpportunity(id);
  if (!o) {
    return { title: "Opportunity — Dramatic Adventure Theatre" };
  }
  return {
    title: `${o.title} — DAT Opportunities`,
    description: o.description,
    openGraph: {
      title: `${o.title} — DAT Opportunities`,
      description: o.description,
      images: o.heroImage ? [o.heroImage] : ["/images/opportunities/PLX-hero.jpg"],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: o.title,
      description: o.description,
      images: o.heroImage ? [o.heroImage] : undefined,
    },
  };
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [opportunity, all] = await Promise.all([
    findOpportunity(id),
    loadOpportunities(),
  ]);

  if (!opportunity) notFound();

  // Related: same type, different id, status open / coming_soon / evergreen
  const related = all
    .filter(
      (o) =>
        o.id !== opportunity.id &&
        o.type === opportunity.type &&
        o.status !== "closed",
    )
    .slice(0, 3);

  return <OpportunityDetailClient opportunity={opportunity} related={related} />;
}
