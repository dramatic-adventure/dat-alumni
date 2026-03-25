import { SpotlightUpdate, Update } from "./types";

/**
 * Converts a SpotlightUpdate object to a fully valid Update object.
 */
export function mapSpotlightUpdateToUpdate(
  source: SpotlightUpdate,
  profileSlug = "unknown"
): Update {
  return {
    updateId: crypto.randomUUID(),
    profileSlug,
    category: "What I’m Up To",
    title: source.headline || "Untitled",
    subtitle: source.subheadlineTitle || "",
    location: source.location || "",
    eventDate: "",

    bodyNote: source.body || "",
    body: source.body || "",
    mediaUrls: source.mediaUrl || "",
    mediaType: "image",

    ctaText: source.ctaText || "Learn More",
    ctaUrl: source.ctaLink,
    ctaLink: source.ctaLink,

    tags: source.tag ? [source.tag] : [],
    tag: source.tag,
    evergreen: source.evergreen ?? false,
    expirationDate: "",
    featured: false,
    sortDate: source.sortDate || new Date().toISOString().split("T")[0],
    lastModified: new Date(),

    // Optional extras with fallback
    program: undefined,
    year: undefined,
    collaborator: undefined,
    partner: undefined,
    hidden: false,
    institution: undefined,
    externalLink: undefined,
    additionalMediaUrls: undefined,
    notes: undefined,
    timestamp: Date.now(),

    // Story Map fields
    storyMapEligible: false,
    storyMapTitle: "",
    storyMapProgram: "",
    storyMapProgramYear: "",
    storyMapLocationName: "",
    storyMapPartners: "",
    storyMapQuote: "",
    storyMapQuoteAuthor: "",
    storyMapShortStory: "",
    storyMapImageMedia: "",
    storyMapUrl: "",
    storyMapAuthor: "",
    storyMapAuthorSlug: "",
    storyMapMoreInfoLink: "",
    storyMapCountry: "",
  };
}
