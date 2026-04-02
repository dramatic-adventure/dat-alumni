import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetailPageTemplate from "@/components/events/EventDetailPageTemplate";
import { eventById, events } from "@/lib/events";

type PageProps = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  return events
    .filter((e) => e.category === "fundraiser")
    .map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = eventById(id);
  if (!event || event.category !== "fundraiser") {
    return { title: "Gathering Not Found | Dramatic Adventure Theatre" };
  }

  return {
    title: `${event.title} | Dramatic Adventure Theatre`,
    description: event.description,
    alternates: { canonical: `/gatherings/${event.id}` },
  };
}

export default async function GatheringDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = eventById(id);

  if (!event || event.category !== "fundraiser") notFound();

  return <EventDetailPageTemplate event={event} routeKind="gatherings" />;
}