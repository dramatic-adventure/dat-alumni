import { boolCell } from "@/app/alumni/update/helpers/boolean";

export function baselineFromLookup(j: any, slug: string, nm: string, loc: string) {
  return {
    slug: String(slug || "").trim().toLowerCase(),
    name: String(nm || "").trim(),
    location: String(loc || "").trim(),

    isBiCoastal: boolCell(j?.isBiCoastal),
    secondLocation: String(j?.secondLocation || ""),
    backgroundStyle: String(j?.backgroundStyle || "kraft"),

    pronouns: String(j?.pronouns || ""),
    roles: String(j?.roles || ""),
    identityTags: String(j?.identityTags || ""),
    practiceTags: String(j?.practiceTags || ""),
    exploreCareTags: String(j?.exploreCareTags || ""),
    languages: String(j?.languages || ""),
    currentTitle: String(j?.currentTitle || ""),
    currentWork: String(j?.currentWork || ""),

    bioShort: String(j?.bioShort || ""),
    bioLong: String(j?.bioLong || ""),

    website: String(j?.website || ""),
    showWebsite: String(j?.showWebsite ?? ""),
    showPublicEmail: String(j?.showPublicEmail ?? ""),
    instagram: String(j?.instagram || ""),
    x: String(j?.x || ""),
    tiktok: String(j?.tiktok || ""),
    threads: String(j?.threads || ""),
    bluesky: String(j?.bluesky || ""),
    linkedin: String(j?.linkedin || ""),
    primarySocial: String(j?.primarySocial || "instagram"),

    youtube: String(j?.youtube || ""),
    vimeo: String(j?.vimeo || ""),
    imdb: String(j?.imdb || ""),
    facebook: String(j?.facebook || ""),
    linktree: String(j?.linktree || ""),
    newsletter: String(j?.newsletter || ""),
    publicEmail: String(j?.publicEmail || ""),

    spotlight: String(j?.spotlight || ""),
    programs: String(j?.programs || ""),
    tags: String(j?.tags || ""),
    statusFlags: String(j?.statusFlags || ""),

    currentUpdateText: String(j?.currentUpdateText || ""),
    currentUpdateLink: String(j?.currentUpdateLink || ""),
    currentUpdateExpiresAt: String(j?.currentUpdateExpiresAt || ""),

    upcomingEventTitle: String(j?.upcomingEventTitle || ""),
    upcomingEventLink: String(j?.upcomingEventLink || ""),
    upcomingEventDate: String(j?.upcomingEventDate || ""),
    upcomingEventExpiresAt: String(j?.upcomingEventExpiresAt || ""),
    upcomingEventDescription: String(j?.upcomingEventDescription || ""),
    upcomingEventCity: String(j?.upcomingEventCity || ""),
    upcomingEventStateCountry: String(j?.upcomingEventStateCountry || ""),
    upcomingEventMediaType: String(j?.upcomingEventMediaType || ""),
    upcomingEventMediaUrl: String(j?.upcomingEventMediaUrl || ""),
    upcomingEventMediaAlt: String(j?.upcomingEventMediaAlt || ""),
    upcomingEventVideoAutoplay: String(j?.upcomingEventVideoAutoplay ?? ""),

    currentHeadshotId: String(j?.currentHeadshotId || ""),
    currentHeadshotUrl: String(j?.currentHeadshotUrl || ""),
    featuredAlbumId: String(j?.featuredAlbumId || ""),
    featuredReelId: String(j?.featuredReelId || ""),
    featuredEventId: String(j?.featuredEventId || ""),

    storyTitle: String(j?.storyTitle || ""),
    storyProgram: String(j?.storyProgram || ""),
    storyLocationName: String(j?.storyLocationName || ""),
    storyYears: String(j?.storyYears || ""),
    storyPartners: String(j?.storyPartners || ""),
    storyShortStory: String(j?.storyShortStory || ""),
    storyQuote: String(j?.storyQuote || ""),
    storyQuoteAttribution: String(j?.storyQuoteAttribution || ""),
    storyMediaUrl: String(j?.storyMediaUrl || ""),
    storyMoreInfoUrl: String(j?.storyMoreInfoUrl || ""),
    storyCountry: String(j?.storyCountry || ""),
    storyShowOnMap: boolCell(j?.storyShowOnMap),
    // Sheet header is `activeStoryKey`; code/UI uses `storyKey`. Accept either.
    storyKey: String(j?.storyKey || j?.activeStoryKey || ""),
  };
}
