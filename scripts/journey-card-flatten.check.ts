// scripts/journey-card-flatten.check.ts
//
// Standalone fixture verification for the "also on the card" publish path
// (review/audio build, 2026-08): the chaptersJson schema additions
// (morePhotoUrls / moreAudioUrls), the Q6 featured-only normalization in
// draftToChapterBlocks, the mediaUrls flatten, and — most importantly — the
// MAX_CHAPTERS_JSON_CHARS cell guard (fitChaptersJson): a deliberately
// over-full card must trim from the more* tails, never featured content,
// never silently, never failing the stamp. Run with:
//
//     npm run verify:card-flatten
//
// NB: written without TS type annotations on purpose — eslint-config-next
// parses scripts/ with espree (see journey-auto-composer.check.ts).

import {
  parseChaptersJson,
  serializeChaptersJson,
  flattenChaptersToMediaUrls,
  fitChaptersJson,
  journeyCardRowToCard,
  MAX_CHAPTERS_JSON_CHARS,
  MAX_FEATURED_PHOTOS_PER_CHAPTER,
  MAX_MORE_PHOTOS_PER_CHAPTER,
  MAX_MORE_AUDIO_PER_CHAPTER,
} from "../lib/journeyCard";
import {
  draftToChapterBlocks,
  draftToPreviewCard,
  flattenDraftForPublish,
} from "../lib/journeyDraft";

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${name}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ""}`);
  }
}

// ── 1. Schema: parse/serialize round-trips more* with caps ───────────────────

console.log("\n[1] chaptersJson schema tolerance + caps");
{
  const raw = JSON.stringify([
    {
      chapterId: "ch-1", kind: "chapter", title: "One", status: "written",
      photoUrls: ["/p1", "/p2"],
      audioUrl: "/a-feat",
      morePhotoUrls: Array.from({ length: 10 }, (_, i) => `/more-${i}`),
      moreAudioUrls: Array.from({ length: 6 }, (_, i) => `/voice-${i}`),
    },
    { chapterId: "ch-2", kind: "chapter", title: "Two", status: "written", body: "Words." },
  ]);
  const parsed = parseChaptersJson(raw);
  check("morePhotoUrls capped at 7 on parse", parsed[0].morePhotoUrls.length === MAX_MORE_PHOTOS_PER_CHAPTER, parsed[0].morePhotoUrls);
  check("moreAudioUrls capped at 4 on parse", parsed[0].moreAudioUrls.length === MAX_MORE_AUDIO_PER_CHAPTER, parsed[0].moreAudioUrls);
  check("chapter without more* parses with the keys absent", parsed[1].morePhotoUrls === undefined && parsed[1].moreAudioUrls === undefined);
  const reserialized = serializeChaptersJson(parsed);
  check("serialize → parse is stable", JSON.stringify(parseChaptersJson(reserialized)) === JSON.stringify(parsed));

  // Pre-existing cards: a legacy blob with no more* fields must round-trip
  // byte-identically through parse → serialize (published cards stay frozen).
  const legacy = serializeChaptersJson(parseChaptersJson(JSON.stringify([
    { chapterId: "old-1", kind: "chapter", title: "Old", status: "written", photoUrls: ["/x"], body: "B" },
  ])));
  check("legacy blob keeps no trace of more* keys", !legacy.includes("morePhotoUrls") && !legacy.includes("moreAudioUrls"), legacy);
}

// ── 2. mediaUrls flatten includes the more tier, deduped ─────────────────────

console.log("\n[2] flattenChaptersToMediaUrls");
{
  const chapters = parseChaptersJson(JSON.stringify([
    { chapterId: "c1", kind: "chapter", title: "A", status: "written", photoUrls: ["/1", "/2"], morePhotoUrls: ["/3", "/2"] },
    { chapterId: "c2", kind: "chapter", title: "B", status: "written", photoUrls: ["/4"], morePhotoUrls: ["/1", "/5"] },
    { chapterId: "c3", kind: "chapter", title: "Ghost", status: "empty", photoUrls: ["/ghost"] },
  ]));
  const media = flattenChaptersToMediaUrls(chapters);
  check("featured then more, card order, deduped", media.join() === "/1,/2,/3,/4,/5", media);
  check("empty chapters contribute nothing", !media.includes("/ghost"));
}

// ── 3. Q6: draftToChapterBlocks normalizes photoUrls to featured-only ────────

console.log("\n[3] draftToChapterBlocks featured/more split");
{
  const draft = {
    draftId: "d", kind: "retro", programId: "p", authorSlug: "a",
    program: "PASSAGE", location: "", country: "Slovakia", year: "2026",
    title: "", primaryRole: "", accent: "teal", pullQuote: "",
    updatedAt: new Date(0).toISOString(),
    chapters: [
      {
        chapterId: "r1", kind: "chapter", title: "Retro", response: "Line.", body: "", reflection: "SECRET-NOTE",
        photoCaptureIds: [],
        photoUrls: Array.from({ length: 12 }, (_, i) => `/retro-${i}`),
      },
      {
        chapterId: "l1", kind: "chapter", title: "Live", response: "Line.", body: "", reflection: "",
        photoCaptureIds: ["f1", "f2"],
        morePhotoCaptureIds: ["m1", "m2"],
        audioCaptureId: "v1",
        moreAudioCaptureIds: ["v2", "v1"],
      },
    ],
  };
  const urls = { f1: "/u-f1", f2: "/u-f2", m1: "/u-m1", m2: "/u-m2", v1: "/u-v1", v2: "/u-v2" };
  const blocks = draftToChapterBlocks(
    draft,
    (ch) => ch.photoCaptureIds.map((id) => urls[id]).filter(Boolean),
    (ch) => (ch.audioCaptureId ? urls[ch.audioCaptureId] : undefined),
    (ch) => (ch.morePhotoCaptureIds ?? []).map((id) => urls[id]).filter(Boolean),
    (ch) => (ch.moreAudioCaptureIds ?? []).map((id) => urls[id]).filter(Boolean)
  );
  const [retro, live] = blocks;
  check("retro: 12 photoUrls → featured-only 5", retro.photoUrls.length === MAX_FEATURED_PHOTOS_PER_CHAPTER, retro.photoUrls);
  check("retro: overflow 6..12 moves to morePhotoUrls", retro.morePhotoUrls.join() === Array.from({ length: 7 }, (_, i) => `/retro-${i + 5}`).join(), retro.morePhotoUrls);
  check("live: featured photos + more resolve to URLs", live.photoUrls.join() === "/u-f1,/u-f2" && live.morePhotoUrls.join() === "/u-m1,/u-m2");
  check("live: featured audio reaches the block", live.audioUrl === "/u-v1");
  check("live: moreAudio excludes the featured voice", live.moreAudioUrls.join() === "/u-v2", live.moreAudioUrls);
  check("reflection (private notes) never copied", !JSON.stringify(blocks).includes("SECRET-NOTE"));

  // Unpromoted/sealed captures resolve to no URL — they simply never appear.
  const noneResolved = draftToChapterBlocks(
    draft,
    () => [],
    () => undefined,
    () => [],
    () => []
  );
  check("unresolved captures leave audio/more absent", noneResolved[1].audioUrl === undefined && noneResolved[1].moreAudioUrls === undefined && noneResolved[1].morePhotoUrls === undefined);
}

// ── 4. Cell guard: deliberately over-full card ────────────────────────────────

console.log("\n[4] fitChaptersJson cell guard");
{
  // Long bodies + full more* tiers across enough chapters to blow 40k chars.
  const body = "A long paragraph of honest trip writing. ".repeat(40).trim(); // ~1.6k
  const mk = (i) => ({
    chapterId: `ch-${i}`, kind: "chapter", title: `Chapter ${i}`, status: "written",
    response: "The response line.", body,
    photoUrls: Array.from({ length: 5 }, (_, p) => `/api/media/thumb/photo-${i}-${p}`),
    audioUrl: `/api/media/audio/feat-${i}`,
    morePhotoUrls: Array.from({ length: 7 }, (_, p) => `/api/media/thumb/more-${i}-${p}`),
    moreAudioUrls: Array.from({ length: 4 }, (_, a) => `/api/media/audio/more-${i}-${a}`),
  });
  // Built as raw blocks (the way draftToChapterBlocks hands them to the stamp),
  // NOT through parseChaptersJson — which by design rejects >40k input outright.
  const over = Array.from({ length: 18 }, (_, i) => mk(i));
  check("fixture really is over the cap", JSON.stringify(over).length > MAX_CHAPTERS_JSON_CHARS, JSON.stringify(over).length);

  const { chapters: fitted, dropped } = fitChaptersJson(over);
  const fittedJson = JSON.stringify(fitted);
  check("fitted card is within the cap", fittedJson.length <= MAX_CHAPTERS_JSON_CHARS, fittedJson.length);
  check("something was dropped and reported", dropped.length > 0, dropped.length);
  check("serialize succeeds on the fitted card (stamp never fails)", serializeChaptersJson(fitted).length > 0);
  check("every drop came from a more* tier", dropped.every((d) => d.url.includes("/more-")), dropped.filter((d) => !d.url.includes("/more-")).slice(0, 3));
  const featuredIntact = fitted.every((ch, i) =>
    (ch.photoUrls ?? []).join() === (over[i].photoUrls ?? []).join() && ch.audioUrl === over[i].audioUrl
  );
  check("featured photos + featured audio untouched", featuredIntact);
  const textIntact = fitted.every((ch, i) => ch.body === over[i].body && ch.response === over[i].response);
  check("chapter text untouched", textIntact);
  check("drops come from the END (last chapter loses extras first)", dropped[0].chapterId === "ch-17", dropped[0]);

  // An under-cap card passes through untouched, by reference semantics of content.
  const small = parseChaptersJson(JSON.stringify([mk(0)]));
  const fit2 = fitChaptersJson(small);
  check("under-cap card is untouched with zero drops", fit2.dropped.length === 0 && JSON.stringify(fit2.chapters) === JSON.stringify(small));
}

// ── 5. Preview fidelity: draftToPreviewCard vs the published card ────────────
// §8: for the same draft, the Composer preview and the post-publish public card
// must show the same pages/content — the ONLY intended difference is which URLs
// the resolvers minted (private capture-media pre-publish, promoted public
// after). Both sides run the same draftToChapterBlocks; this asserts the
// structural equality end-to-end through both card constructors.

console.log("\n[5] preview fidelity (private vs promoted URLs aside)");
{
  const draft = {
    draftId: "d-fid", kind: "live", programId: "passage-slovakia-2026", authorSlug: "test-artist",
    program: "PASSAGE", location: "Slovakia", country: "Slovakia", year: "2026",
    dates: "Jul 12 – Aug 2, 2026", title: "The Card Title", primaryRole: "Teaching Artist",
    accent: "teal", pullQuote: "The pull quote line.", heroCaptureId: "p1",
    updatedAt: new Date(0).toISOString(),
    chapters: [
      {
        chapterId: "ch-1", kind: "chapter", num: "01", title: "Arrival", location: "Bratislava",
        dateLabel: "Jul 12", response: "The response line.", body: "Body words.\n\nMore body words.",
        reflection: "PRIVATE", photoCaptureIds: ["p1", "p2"], morePhotoCaptureIds: ["p3"],
        audioCaptureId: "v1", moreAudioCaptureIds: ["v2"],
      },
      {
        chapterId: "ch-2", kind: "daily", title: "A postcard", response: "Daily line.",
        body: "", reflection: "", photoCaptureIds: [],
      },
      {
        chapterId: "ch-3", kind: "chapter", num: "03", title: "Ghost", response: "",
        body: "", reflection: "", photoCaptureIds: [],
      },
    ],
  };
  // Two resolver sets: private (preview) vs promoted (publish).
  const priv = (id) => `/api/field-kit/capture/media/df-${id}`;
  const pub = (id) => (id.startsWith("v") ? `/api/media/audio/pub-${id}` : `/api/media/thumb/pub-${id}`);
  const mk = (url) => [
    (ch) => ch.photoCaptureIds.map(url),
    (ch) => (ch.audioCaptureId ? url(ch.audioCaptureId) : undefined),
    (ch) => (ch.morePhotoCaptureIds ?? []).map(url),
    (ch) => (ch.moreAudioCaptureIds ?? []).map(url),
  ];
  const [pp, pa, pmp, pma] = mk(priv);
  const [qp, qa, qmp, qma] = mk(pub);

  const previewBlocks = draftToChapterBlocks(draft, pp, pa, pmp, pma);
  const publishBlocks = draftToChapterBlocks(draft, qp, qa, qmp, qma);
  const previewCard = draftToPreviewCard(draft, previewBlocks, priv("p1"));

  // The published card, reconstructed the way the stamp + loader would.
  const flat = flattenDraftForPublish(draft, publishBlocks, pub("p1"));
  const publishedCard = journeyCardRowToCard({
    id: "card-1", profileSlug: draft.authorSlug, programId: draft.programId,
    program: draft.program, location: draft.location, country: draft.country, year: draft.year,
    title: draft.title, primaryRole: draft.primaryRole, pullQuote: flat.pullQuote,
    heroUrl: flat.heroUrl, accent: draft.accent, dates: draft.dates ?? "", body: flat.body,
    mediaUrls: flat.mediaUrls, ctaText: "", ctaUrl: "", featured: false, sortDate: "",
    status: "live", removalReason: "", createdAt: "",
    chaptersJson: serializeChaptersJson(publishBlocks),
  });

  // Erase the URL difference, then require structural equality.
  const scrub = (s) => JSON.stringify(s).replace(/\/api\/[a-z-/]+\/(?:df-|pub-)/g, "/URL/");
  const strip = (card) => ({
    title: card.title, pullQuote: card.pullQuote, body: card.body,
    programLabel: card.programLabel, dates: card.dates, accent: card.accent,
    primaryRole: card.primaryRole,
    mediaUrls: JSON.parse(scrub(card.mediaUrls)),
    heroUrl: JSON.parse(scrub(card.heroUrl)),
    chapters: JSON.parse(scrub(card.chapters)),
  });
  check("preview card ≡ published card (URLs scrubbed)",
    JSON.stringify(strip(previewCard)) === JSON.stringify(strip(publishedCard)),
    { preview: strip(previewCard), published: strip(publishedCard) });
  check("private notes reach neither card", !JSON.stringify(previewCard).includes("PRIVATE") && !JSON.stringify(publishedCard).includes("PRIVATE"));
}

// ── Result ────────────────────────────────────────────────────────────────────

console.log("");
if (failures) {
  console.error(`✗ ${failures} check(s) FAILED`);
  process.exit(1);
}
console.log("✓ all journey-card flatten/cell-guard checks passed");
