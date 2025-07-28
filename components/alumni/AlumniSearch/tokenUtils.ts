import { normalizeText } from "./searchUtils";
import { programMap } from "@/lib/programMap";
import { productionMap } from "@/lib/productionMap";
import { AlumniItem, EnrichedAlumniItem } from "@/types/alumni";

/**
 * ✅ Enrich alumni data by adding tokenized fields for:
 * - Programs, productions, festivals
 * - Roles, identity tags, status flags
 * - Bio and artist statement
 * - Location
 *
 * These tokens improve Fuse.js fuzzy matching and custom scoring logic.
 */
export function enrichAlumniData(alumni: AlumniItem[]): EnrichedAlumniItem[] {
  return alumni.map((item) => {
    const programTokens = new Set<string>();
    const productionTokens = new Set<string>();
    const festivalTokens = new Set<string>();
    const identityTokens = new Set<string>();
    const statusTokens = new Set<string>();
    const roleTokens = new Set<string>();
    const bioTokens = new Set<string>();
    const locationTokens = new Set<string>(); // ✅ NEW

    /** ✅ Programs */
    for (const key in programMap) {
      const prog = programMap[key];
      if (prog.artists[item.slug]) {
        programTokens.add(normalizeText(prog.title));
        programTokens.add(normalizeText(prog.program));
        programTokens.add(normalizeText(`${prog.program} ${prog.location}`));
        programTokens.add(normalizeText(`${prog.program} ${prog.year}`));
      }
    }

    /** ✅ Productions */
    for (const key in productionMap) {
      const prod = productionMap[key];
      if (prod.artists[item.slug]) {
        productionTokens.add(normalizeText(prod.title));
        if (prod.festival) productionTokens.add(normalizeText(prod.festival));
        productionTokens.add(normalizeText(`${prod.title} ${prod.location}`));
        productionTokens.add(normalizeText(`${prod.title} ${prod.year}`));

        if (prod.festival) {
          prod.festival
            .split(/[:—-]/)
            .map((frag) => normalizeText(frag))
            .forEach((p) => festivalTokens.add(p));
        }
      }
    }

    /** ✅ Identity tags */
    (item.identityTags || []).forEach((tag) =>
      identityTokens.add(normalizeText(tag))
    );

    /** ✅ Status flags */
    (item.statusFlags || []).forEach((flag) =>
      statusTokens.add(normalizeText(flag))
    );

    /** ✅ Roles */
    (item.roles || []).forEach((role) =>
      roleTokens.add(normalizeText(role))
    );

    /** ✅ Bio + Artist Statement (split into words for search) */
    if (item.bio) {
      normalizeText(item.bio)
        .split(" ")
        .filter(Boolean)
        .forEach((word) => bioTokens.add(word));
    }
    if (item.artistStatement) {
      normalizeText(item.artistStatement)
        .split(" ")
        .filter(Boolean)
        .forEach((word) => bioTokens.add(word));
    }

    /** ✅ Location tokens (split into individual terms) */
    if (item.location) {
      normalizeText(item.location)
        .split(" ")
        .filter(Boolean)
        .forEach((word) => locationTokens.add(word));
    }

    return {
      ...item,
      programTokens: Array.from(programTokens),
      productionTokens: Array.from(productionTokens),
      festivalTokens: Array.from(festivalTokens),
      identityTokens: Array.from(identityTokens),
      statusTokens: Array.from(statusTokens),
      roleTokens: Array.from(roleTokens),
      bioTokens: Array.from(bioTokens),
      locationTokens: Array.from(locationTokens), // ✅ RETURN NEW FIELD
    };
  });
}
