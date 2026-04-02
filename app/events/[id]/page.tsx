import { notFound, redirect } from "next/navigation";
import { canonicalEventPath, eventById } from "@/lib/events";

type PageProps = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return [];
}

export default async function LegacyEventRedirectPage({ params }: PageProps) {
  const { id } = await params;
  const event = eventById(id);

  if (!event) notFound();

  redirect(canonicalEventPath(event));
}