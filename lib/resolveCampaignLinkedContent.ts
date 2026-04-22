// lib/resolveCampaignLinkedContent.ts

import type {
  FundraisingCampaign,
  CampaignLinkedAlumnus,
  CampaignLinkedDramaClub,
  CampaignLinkedEvent,
  CampaignLinkedStory,
} from "@/lib/fundraisingCampaigns";

type MaybePromise<T> = T | Promise<T>;

export type CampaignLinkedContentResolvers = {
  getAlumnusBySlug?: (slug: string) => MaybePromise<CampaignLinkedAlumnus | null | undefined>;
  getDramaClubBySlug?: (slug: string) => MaybePromise<CampaignLinkedDramaClub | null | undefined>;
  getEventById?: (id: string) => MaybePromise<CampaignLinkedEvent | null | undefined>;
  getStoryBySlug?: (slug: string) => MaybePromise<CampaignLinkedStory | null | undefined>;
};

function compact<T>(items: Array<T | null | undefined>): T[] {
  return items.filter((item): item is T => item != null);
}

export async function resolveCampaignLinkedContent(
  campaign: FundraisingCampaign,
  resolvers: CampaignLinkedContentResolvers = {}
): Promise<FundraisingCampaign> {
  const alumni =
    campaign.alumniSlugs?.length && resolvers.getAlumnusBySlug
      ? compact(
          await Promise.all(
            campaign.alumniSlugs.map((slug) => resolvers.getAlumnusBySlug!(slug))
          )
        )
      : campaign.alumni;

  const dramaClubs =
    campaign.dramaClubSlugs?.length && resolvers.getDramaClubBySlug
      ? compact(
          await Promise.all(
            campaign.dramaClubSlugs.map((slug) => resolvers.getDramaClubBySlug!(slug))
          )
        )
      : campaign.dramaClubs;

  const events =
    campaign.eventIds?.length && resolvers.getEventById
      ? compact(
          await Promise.all(
            campaign.eventIds.map((id) => resolvers.getEventById!(id))
          )
        )
      : campaign.events;

  const stories =
    campaign.storySlugs?.length && resolvers.getStoryBySlug
      ? compact(
          await Promise.all(
            campaign.storySlugs.map((slug) => resolvers.getStoryBySlug!(slug))
          )
        )
      : campaign.stories;

  return {
    ...campaign,
    alumni,
    dramaClubs,
    events,
    stories,
  };
}