import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventDetailPageTemplate from "@/components/events/EventDetailPageTemplate";
import { eventById, events } from "@/lib/events";

type PageProps = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  return events
    .filter((e) => e.category === "festival")
    .map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = eventById(id);
  if (!event || event.category !== "festival") {
    return { title: "Festival Not Found | Dramatic Adventure Theatre" };
  }

  return {
    title: `${event.title} | Dramatic Adventure Theatre`,
    description: event.description,
    alternates: { canonical: `/festivals/${event.id}` },
  };
}

export default async function FestivalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = eventById(id);

  if (!event || event.category !== "festival") notFound();

  return <EventDetailPageTemplate event={event} routeKind="festivals" />;
}