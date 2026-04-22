// lib/campaignLinkedContentResolvers.ts

import type {
  CampaignLinkedAlumnus,
  CampaignLinkedDramaClub,
  CampaignLinkedEvent,
  CampaignLinkedStory,
} from "@/lib/fundraisingCampaigns";

import { dramaClubs } from "@/lib/dramaClubMap";
import { loadAlumniBySlug } from "@/lib/loadAlumni";
import { events, getEventImage } from "@/lib/events";
import { getStoryBySlug } from "@/lib/loadRows";

// TODO: Replace these placeholder imports with your real canonical sources.
// import { profiles } from "@/lib/...";
// import { eventMap } from "@/lib/...";
// import { storyMap } from "@/lib/...";

export const campaignLinkedContentResolvers = {
  getAlumnusBySlug: async (slug: string): Promise<CampaignLinkedAlumnus | null> => {
    const alum = await loadAlumniBySlug(slug);
    if (!alum) return null;

    const roles = Array.isArray((alum as any).roles) ? (alum as any).roles as string[] : [];
    const role =
        roles[0]?.trim() ||
        String((alum as any).role ?? "").trim() ||
        undefined;

    const currentHeadshotId =
        String((alum as any).currentHeadshotId ?? "").trim() || undefined;

    const rawHeadshotUrl =
        String((alum as any).headshotUrl ?? "").trim() || undefined;

    const alumniId =
        String(
        (alum as any).alumniId ??
        (alum as any)["alumni id"] ??
        (alum as any).profileId ??
        (alum as any).id ??
        ""
        ).trim() || undefined;

    const imageUrl = currentHeadshotId
        ? `/api/media/thumb/${encodeURIComponent(currentHeadshotId)}?w=480`
        : rawHeadshotUrl
        ? /^https?:\/\//i.test(rawHeadshotUrl)
            ? `/api/img?url=${encodeURIComponent(rawHeadshotUrl)}`
            : rawHeadshotUrl
        : undefined;

    return {
        slug: String(alum.slug ?? "").trim(),
        name: String(alum.name ?? "").trim(),
        role,
        imageUrl,
        alumniId,
    };
  },

  getDramaClubBySlug: (slug: string): CampaignLinkedDramaClub | null => {
    const club = dramaClubs.find((c) => c.slug === slug);
    if (!club) return null;

    return {
      slug: club.slug,
      name: club.name,
      country: club.country,
      city: club.city,
      imageUrl: club.cardImage ?? club.heroImage,
    };
  },

  getEventById: (id: string): CampaignLinkedEvent | null => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return null;

    return {
        id: ev.id,
        title: ev.title,
        date: ev.date,
        venue: ev.venue,
        city: ev.city,
        country: ev.country,
        ticketUrl: ev.ticketUrl || undefined,
        imageUrl: getEventImage(ev) || undefined,
    };
  },

  getStoryBySlug: async (slug: string): Promise<CampaignLinkedStory | null> => {
    const story: any = await getStoryBySlug(slug);
    if (!story) return null;

    return {
        slug: String(story.slug ?? story.storySlug ?? "").trim(),
        title: String(story.title ?? story.Title ?? "").trim(),
        teaser:
        String(
            story.shortStory ??
            story.story ??
            story["Short Story"] ??
            ""
        ).trim() || undefined,
        imageUrl:
        String(
            story.imageUrl ??
            story["Image URL"] ??
            ""
        ).trim() || undefined,
    };
  },
};