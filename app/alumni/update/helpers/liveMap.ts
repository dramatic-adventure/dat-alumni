import { boolCell } from "@/app/alumni/update/helpers/boolean";

/** Map to Profile-Live schema. */
export function toLiveSavableProfile(p: any) {
  return {
    name: String(p.name || "").trim(),
    slug: String(p.slug || "").trim().toLowerCase(),
    location: String(p.location || "").trim(),
    // ✅ Live sheet-friendly values
    isBiCoastal: boolCell(p.isBiCoastal),
    secondLocation: String(p.secondLocation || "").trim(),

    backgroundStyle: String(p.backgroundStyle || "kraft").trim(),

    pronouns: String(p.pronouns || "").trim(),
    roles: String(p.roles || "").trim(),
    identityTags: String(p.identityTags || "").trim(),
    practiceTags: String(p.practiceTags || "").trim(),
    exploreCareTags: String(p.exploreCareTags || "").trim(),
    languages: String(p.languages || "").trim(),
    currentTitle: String(p.currentTitle || "").trim(),
    currentWork: String(p.currentWork || "").trim(),
    bioShort: String(p.bioShort || "").trim(),
    bioLong: String(p.bioLong || "").trim(),

    website: String(p.website || "").trim(),
    showWebsite: String(p.showWebsite ?? "").trim(),
    showPublicEmail: String(p.showPublicEmail ?? "").trim(),
    instagram: String(p.instagram || "").trim(),
    x: String(p.x || "").trim(),
    tiktok: String(p.tiktok || "").trim(),
    threads: String(p.threads || "").trim(),
    bluesky: String(p.bluesky || "").trim(),
    linkedin: String(p.linkedin || "").trim(),
    primarySocial: String(p.primarySocial || "").trim(),
    youtube: String(p.youtube || "").trim(),
    vimeo: String(p.vimeo || "").trim(),
    imdb: String(p.imdb || "").trim(),
    facebook: String(p.facebook || "").trim(),
    linktree: String(p.linktree || "").trim(),
    newsletter: String(p.newsletter || "").trim(),
    publicEmail: String(p.publicEmail || "").trim(),

    spotlight: String(p.spotlight || "").trim(),
    programs: String(p.programs || "").trim(),
    tags: String(p.tags || "").trim(),
    statusFlags: String(p.statusFlags || "").trim(),

    currentUpdateText: String(p.currentUpdateText || "").trim(),
    currentUpdateLink: String(p.currentUpdateLink || "").trim(),
    currentUpdateExpiresAt: String(p.currentUpdateExpiresAt || "").trim(),

    upcomingEventTitle: String(p.upcomingEventTitle || "").trim(),
    upcomingEventLink: String(p.upcomingEventLink || "").trim(),
    upcomingEventDate: String(p.upcomingEventDate || "").trim(),
    upcomingEventExpiresAt: String(p.upcomingEventExpiresAt || "").trim(),
    upcomingEventDescription: String(p.upcomingEventDescription || "").trim(),
    upcomingEventCity: String(p.upcomingEventCity || "").trim(),
    upcomingEventStateCountry: String(p.upcomingEventStateCountry || "").trim(),
    upcomingEventMediaType: String(p.upcomingEventMediaType || "").trim(),
    upcomingEventMediaUrl: String(p.upcomingEventMediaUrl || "").trim(),
    upcomingEventMediaAlt: String(p.upcomingEventMediaAlt || "").trim(),
    upcomingEventVideoAutoplay: String(p.upcomingEventVideoAutoplay || "").trim(),

    currentHeadshotId: String(p.currentHeadshotId || "").trim(),
    currentHeadshotUrl: String(p.currentHeadshotUrl || "").trim(),
    featuredAlbumId: String(p.featuredAlbumId || "").trim(),
    featuredReelId: String(p.featuredReelId || "").trim(),
    featuredEventId: String(p.featuredEventId || "").trim(),

    storyTitle: String(p.storyTitle || "").trim(),
    storyProgram: String(p.storyProgram || "").trim(),
    storyLocationName: String(p.storyLocationName || "").trim(),
    storyYears: String(p.storyYears || "").trim(),
    storyPartners: String(p.storyPartners || "").trim(),
    storyShortStory: String(p.storyShortStory || "").trim(),
    storyQuote: String(p.storyQuote || "").trim(),
    storyQuoteAttribution: String(p.storyQuoteAttribution || "").trim(),
    storyMediaUrl: String(p.storyMediaUrl || "").trim(),
    storyMoreInfoUrl: String(p.storyMoreInfoUrl || "").trim(),
    storyCountry: String(p.storyCountry || "").trim(),
    storyShowOnMap: boolCell(p.storyShowOnMap),
    storyTimeStamp: String(p.storyTimeStamp || "").trim(), // system-written; passthrough
    // Code-side key is `storyKey`; the save route aliases it to the sheet's
    // `activeStoryKey` column.
    storyKey: String(p.storyKey || "").trim(),

    // Impact
    impactCauses: String(p.impactCauses || "").trim(),
    supportedClubs: String(p.supportedClubs || "").trim(),
    featuredSupportedClub: String(p.featuredSupportedClub || "").trim(),
    featuredImpactCause: String(p.featuredImpactCause || "").trim(),
  };
}

export const totalBytes = (files: File[]) => files.reduce((s, f) => s + (f?.size ?? 0), 0);

export const prettyMB = (n?: number | null) => {
  const mb = Number(n ?? 0) / 1_000_000;
  return Math.round(mb * 10) / 10;
};
