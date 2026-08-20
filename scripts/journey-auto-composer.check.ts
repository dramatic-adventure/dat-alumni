// scripts/journey-auto-composer.check.ts
//
// Standalone fixture verification for the Slice 7 Auto-Composer assembly rules
// (lib/journeyAutoComposer.ts — spec §5a/§5b + §4-R Q3/Q4). Run with:
//
//     npm run verify:auto-composer    (alias for `tsx scripts/journey-auto-composer.check.ts`)
//
// WHY THIS EXISTS
// The assembler is the one place machine output lands in an artist's draft. Its
// hard guarantees — every word traces back to a capture verbatim, sealed
// captures never surface, touched fields are never overwritten, updatedAt never
// moves — are exactly the §8 verification cases, asserted here against fixture
// captures (including messy/short/duplicate ones) so a rule change fails loudly.
//
// SCOPE / NON-GOALS: pure assembly only. The scheduled runner, Blobs IO, push
// and email are integration boundaries verified manually (spec §8).
//
// NB: written without TS type annotations on purpose — eslint-config-next
// parses scripts/ with espree (see field-kit-roster.check.ts), and tsconfig
// does not typecheck scripts/.

import {
  assembleDraft,
  formatQuote,
  trimAtBoundary,
  AUTO_MAX_PHOTOS_PER_CHAPTER,
  RESPONSE_MAX_CHARS,
} from "../lib/journeyAutoComposer";

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${name}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ""}`);
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Real itinerary chapters always carry dated days — dayDates drives both the
// date→chapter placement ladder and the "a day-less chapter is scaffolding"
// rule, so fixtures that omit it would not model anything that exists.
const TZ = "Europe/Bratislava";
const spine = [
  { id: "ch-1", num: 1, verb: "Arrive", place: "Bratislava", title: "Arrival", goal: "", prompt: "", accent: "teal", dayIds: ["d1"], dayDates: [{ id: "d1", fullDate: "2026-07-12" }], timezone: TZ, dateLabel: "Jul 12" },
  { id: "ch-2", num: 2, verb: "Workshop", place: "Zvolen", title: "The Work", goal: "", prompt: "", accent: "pink", dayIds: ["d2"], dayDates: [{ id: "d2", fullDate: "2026-07-14" }], timezone: TZ, dateLabel: "Jul 14" },
  { id: "ch-3", num: 3, verb: "Perform", place: "Košice", title: "The Show", goal: "", prompt: "", accent: "yellow", dayIds: ["d3"], dayDates: [{ id: "d3", fullDate: "2026-07-18" }], timezone: TZ, dateLabel: "Jul 18" },
];

const program = { program: "PASSAGE", location: "Slovakia", country: "Slovakia", year: "2026", dates: "Jul 12 – Aug 2, 2026" };

let n = 0;
function cap(over) {
  n += 1;
  return {
    captureId: `c${String(n).padStart(3, "0")}`,
    kind: "note",
    bodyText: "",
    createdAt: `2026-07-${String(12 + (n % 15)).padStart(2, "0")}T10:${String(n % 60).padStart(2, "0")}:00.000Z`,
    chapterId: "ch-1",
    dayIndex: "",
    mediaCapturedAt: "",
    visibility: "card",
    quoteSpeaker: "",
    driveFileId: "",
    ...over,
  };
}

function run(captures, existing) {
  return assembleDraft({
    programId: "passage-slovakia-2026",
    authorSlug: "test-artist",
    program,
    spine,
    captures,
    existing: existing ?? null,
    now: "2026-08-03T15:00:00.000Z",
  });
}

// ── 1. Two captures in one chapter, zero in others (§8) ──────────────────────

console.log("\n[1] two captures in one chapter, others empty");
{
  const c1 = cap({ bodyText: "Short note.", createdAt: "2026-07-12T09:00:00.000Z" });
  const c2 = cap({ bodyText: "A much longer note about the first day in the city and what it felt like to arrive.", createdAt: "2026-07-12T11:00:00.000Z" });
  const { draft } = run([c1, c2]);
  const [ch1, ch2, ch3] = draft.chapters;
  check("longest capture becomes the response", ch1.response === c2.bodyText, ch1.response);
  check("the other capture becomes the body, verbatim", ch1.body === c1.bodyText, ch1.body);
  check("other chapters stay empty", !ch2.response && !ch2.body && !ch3.response && !ch3.body);
  const corpus = [c1.bodyText, c2.bodyText].join("\n");
  const words = [ch1.response, ch1.body, draft.title, draft.pullQuote].join(" ").split(/\s+/).filter(Boolean);
  check(
    "every assembled word traces back to a capture (nothing fabricated)",
    words.every((w) => corpus.includes(w.replace(/…$/, ""))),
    words.filter((w) => !corpus.includes(w.replace(/…$/, "")))
  );
  check("updatedAt is epoch on a fresh draft (artist copies always win LWW)", draft.updatedAt === new Date(0).toISOString(), draft.updatedAt);
  check("assembledAt is stamped", draft.assembledAt === "2026-08-03T15:00:00.000Z");
}

// ── 2. Single-capture chapter → response only, no duplication (§8) ───────────

console.log("\n[2] single-capture chapter");
{
  const only = cap({ bodyText: "One lone thought." });
  const { draft } = run([only]);
  check("response = the capture", draft.chapters[0].response === "One lone thought.");
  check("body stays empty (no duplication)", draft.chapters[0].body === "");
}

// ── 3. Sealed captures never surface (§8) ─────────────────────────────────────

console.log("\n[3] sealed captures excluded everywhere");
{
  const sealed = cap({ bodyText: "SEALED-SECRET", visibility: "sealed" });
  const sealedPhoto = cap({ kind: "photo", driveFileId: "df-sealed", visibility: "sealed" });
  const open = cap({ bodyText: "Public note." });
  const { draft } = run([sealed, sealedPhoto, open]);
  const json = JSON.stringify(draft);
  check("sealed text appears nowhere", !json.includes("SEALED-SECRET"));
  check("sealed photo attached nowhere", !json.includes(sealedPhoto.captureId));
  check("non-sealed capture still assembled", draft.chapters[0].response === "Public note.");
}

// ── 4. Touched fields survive re-assembly; untouched keep flowing (§8/Q6) ────

console.log("\n[4] touched fields survive; untouched chapters receive new captures");
{
  const first = run([cap({ bodyText: "Machine-placed line.", chapterId: "ch-1" })]);
  // Artist hand-edits ch-1's response (Composer marks it touched) + card title.
  const edited = {
    ...first.draft,
    title: "MY OWN TITLE",
    touchedFields: ["title"],
    updatedAt: "2026-07-20T12:00:00.000Z",
    chapters: first.draft.chapters.map((c) =>
      c.chapterId === "ch-1"
        ? { ...c, response: "The artist's own sentence.", touchedFields: ["response"] }
        : c
    ),
  };
  const newCaptures = [
    cap({ bodyText: "Machine-placed line.", chapterId: "ch-1", createdAt: "2026-07-12T08:00:00.000Z" }),
    cap({ bodyText: "Late capture in chapter one.", chapterId: "ch-1", createdAt: "2026-07-21T08:00:00.000Z" }),
    cap({ bodyText: "Brand new words for chapter two.", chapterId: "ch-2", createdAt: "2026-07-21T09:00:00.000Z" }),
  ];
  const second = run(newCaptures, edited);
  const ch1 = second.draft.chapters.find((c) => c.chapterId === "ch-1");
  const ch2 = second.draft.chapters.find((c) => c.chapterId === "ch-2");
  check("touched response NOT overwritten", ch1.response === "The artist's own sentence.");
  check("untouched body in the SAME chapter still assembles new captures", ch1.body.includes("Late capture in chapter one."), ch1.body);
  check("untouched chapter receives new captures", ch2.response === "Brand new words for chapter two.");
  check("touched card title survives", second.draft.title === "MY OWN TITLE");
  check("artist's updatedAt is preserved (assembler never bumps it)", second.draft.updatedAt === "2026-07-20T12:00:00.000Z");
}

// ── 5. Anchor-chapter rule: hero + title + pull-quote (§4-R Q3/Q4) ───────────

console.log("\n[5] anchor chapter drives hero + title; pull-quote prefers quotes");
{
  const captures = [
    cap({ bodyText: "A ch-1 note.", chapterId: "ch-1", createdAt: "2026-07-12T09:00:00.000Z" }),
    cap({ kind: "photo", driveFileId: "df1", chapterId: "ch-1", createdAt: "2026-07-12T10:00:00.000Z" }),
    // ch-2 = anchor: 3 captures
    cap({ bodyText: "The long anchor-chapter sentence that should headline the card.", chapterId: "ch-2", createdAt: "2026-07-14T09:00:00.000Z" }),
    cap({ kind: "photo", driveFileId: "df2", chapterId: "ch-2", createdAt: "2026-07-14T10:00:00.000Z" }),
    cap({ kind: "photo", driveFileId: "df3", chapterId: "ch-2", createdAt: "2026-07-14T11:00:00.000Z" }),
    cap({ bodyText: "We are not the same people who left.", kind: "quote", quoteSpeaker: "Marek", chapterId: "ch-3", createdAt: "2026-07-18T09:00:00.000Z" }),
  ];
  const { draft } = run(captures);
  const anchorFirstPhoto = captures[3];
  check("hero = anchor chapter's first photo", draft.heroCaptureId === anchorFirstPhoto.captureId, draft.heroCaptureId);
  check("title = anchor's response line", draft.title === "The long anchor-chapter sentence that should headline the card.", draft.title);
  check("pull-quote = earliest quote capture, attribution preserved", draft.pullQuote === "“We are not the same people who left.” — Marek", draft.pullQuote);
  check("quote response keeps attribution outside the sentence", draft.chapters[2].response === "“We are not the same people who left.” — Marek");
}

// ── 6. Pull-quote fallback excludes the title's source line ──────────────────

console.log("\n[6] pull-quote fallback (no quotes)");
{
  const captures = [
    cap({ bodyText: "Anchor line one.", chapterId: "ch-1", createdAt: "2026-07-12T09:00:00.000Z" }),
    cap({ bodyText: "Anchor line two, a bit longer.", chapterId: "ch-1", createdAt: "2026-07-12T10:00:00.000Z" }),
    cap({ bodyText: "A different chapter's much much longer response sentence for the quote.", chapterId: "ch-2", createdAt: "2026-07-14T09:00:00.000Z" }),
  ];
  const { draft } = run(captures);
  check("title from anchor (ch-1)", draft.title === "Anchor line two, a bit longer.", draft.title);
  check("pull-quote = longest OTHER response line", draft.pullQuote === "A different chapter's much much longer response sentence for the quote.", draft.pullQuote);

  const solo = run([cap({ bodyText: "Only one line on the whole trip.", chapterId: "ch-1" })]);
  check("no second line → pull-quote stays empty (never duplicates the title)", solo.draft.pullQuote === "");

  // Photos-only anchor: the title falls back to another chapter's line — the
  // pull-quote exclusion must follow the ACTUAL title source, not the anchor.
  const photosAnchor = run([
    cap({ kind: "photo", driveFileId: "pa1", chapterId: "ch-1", createdAt: "2026-07-12T09:00:00.000Z" }),
    cap({ kind: "photo", driveFileId: "pa2", chapterId: "ch-1", createdAt: "2026-07-12T10:00:00.000Z" }),
    cap({ bodyText: "The only line, in another chapter.", chapterId: "ch-2" }),
  ]);
  check("photos-only anchor → pull-quote never duplicates the fallback title",
    photosAnchor.draft.title === "The only line, in another chapter." && photosAnchor.draft.pullQuote === "");
}

// ── 7. Unsorted captures held aside, never dropped into chapters (§5a) ───────

console.log("\n[7] unsorted captures");
{
  // Dated AFTER the last itinerary day on purpose. Since the placement ladder
  // landed, a chapter-less capture dated DURING the trip is placed by date — so
  // to exercise the unsorted bucket the date has to be one the ladder declines,
  // and relying on cap()'s rolling counter for that would be luck, not a test.
  const stray = cap({ bodyText: "Stray with no chapter.", chapterId: "", createdAt: "2026-08-20T10:00:00.000Z" });
  const unknown = cap({ bodyText: "Unknown chapter id.", chapterId: "ch-99", createdAt: "2026-08-21T10:00:00.000Z" });
  const placed = cap({ bodyText: "Properly placed.", chapterId: "ch-1" });
  const { draft, unsortedCaptureIds } = run([stray, unknown, placed]);
  check("both strays reported as unsorted", unsortedCaptureIds.length === 2 && unsortedCaptureIds.includes(stray.captureId) && unsortedCaptureIds.includes(unknown.captureId));
  check("stray text never lands in any chapter", !JSON.stringify(draft.chapters).includes("Stray with no chapter."));
}

// ── 8. Idempotence + photo/audio rules ────────────────────────────────────────

console.log("\n[8] idempotence, photo cap, audio pick");
{
  const photos = Array.from({ length: 7 }, (_, i) =>
    cap({ kind: "photo", driveFileId: `df-${i}`, chapterId: "ch-1", createdAt: `2026-07-12T0${i + 1}:00:00.000Z` })
  );
  const voice1 = cap({ kind: "voice", driveFileId: "dv-1", bodyText: "morning bells", chapterId: "ch-1", createdAt: "2026-07-12T05:30:00.000Z" });
  const voice2 = cap({ kind: "voice", driveFileId: "dv-2", chapterId: "ch-1", createdAt: "2026-07-12T09:30:00.000Z" });
  const first = run([...photos, voice1, voice2]);
  const ch1 = first.draft.chapters[0];
  check(`photos capped at ${AUTO_MAX_PHOTOS_PER_CHAPTER}, chronological`, ch1.photoCaptureIds.length === AUTO_MAX_PHOTOS_PER_CHAPTER && ch1.photoCaptureIds[0] === photos[0].captureId);
  check("audio = first voice capture", ch1.audioCaptureId === voice1.captureId);
  check("voice caption text is NOT poured into response/body", ch1.response === "" && ch1.body === "");
  check("hero falls back to trip's first photo", first.draft.heroCaptureId === photos[0].captureId);

  const second = run([...photos, voice1, voice2], first.draft);
  check("re-run over identical captures → changed=false (no write)", second.changed === false);

  // §4-R Q3/Q4: publishing freezes the card-level picks (title/pullQuote/hero)
  // even when untouched; chapter fields keep assembling per Q6.
  const published = { ...first.draft, publishedCardId: "card-123" };
  const late = cap({ kind: "photo", driveFileId: "df-late", chapterId: "ch-2", createdAt: "2026-07-30T09:00:00.000Z" });
  const noteAfter = cap({ bodyText: "Words after the stamp.", chapterId: "ch-3", createdAt: "2026-07-30T10:00:00.000Z" });
  const third = run([...photos, voice1, voice2, late, noteAfter], published);
  check("published → hero pick frozen", third.draft.heroCaptureId === first.draft.heroCaptureId);
  check("published → title/pullQuote frozen", third.draft.title === first.draft.title && third.draft.pullQuote === first.draft.pullQuote);
  const ch3 = third.draft.chapters.find((c) => c.chapterId === "ch-3");
  check("published → untouched CHAPTER fields still assemble", ch3.response === "Words after the stamp.");
}

// ── 9. Trim rules: prefixes only, never rewrites ──────────────────────────────

console.log("\n[9] trim + quote formatting helpers");
{
  const long = "First sentence here. Second sentence is quite a bit longer and just keeps going. " + "x".repeat(300);
  const trimmed = trimAtBoundary(long, RESPONSE_MAX_CHARS);
  check("long text trims at a sentence boundary", trimmed === "First sentence here. Second sentence is quite a bit longer and just keeps going.", trimmed);
  const noSentence = "word ".repeat(60).trim();
  const wordTrim = trimAtBoundary(noSentence, 50);
  check("no sentence boundary → word boundary + ellipsis", wordTrim.length <= 51 && wordTrim.endsWith("…") && noSentence.startsWith(wordTrim.slice(0, -1)));
  check("short text passes through verbatim", trimAtBoundary("As is.", 200) === "As is.");
  check("quote without speaker stays bare", formatQuote("Just words", "") === "Just words");
  const longResponse = cap({ bodyText: long, chapterId: "ch-1" });
  const { draft } = run([longResponse]);
  check("assembled response respects the trim", draft.chapters[0].response === trimmed);

  // Quotes are never altered (§5b): even a quote longer than the response cap
  // stays fully verbatim WITH its attribution — no trim may eat the speaker.
  const longQuoteText = "Quoted words that run well past the response cap. ".repeat(6).trim();
  const longQuote = run([cap({ kind: "quote", bodyText: longQuoteText, quoteSpeaker: "Anna", chapterId: "ch-2" })]);
  check("long quote response = fully verbatim + attribution",
    longQuote.draft.chapters[1].response === `“${longQuoteText}” — Anna`);
}

// ── 10. Placement ladder: chapterId → dayIndex → date (EXIF, else createdAt) ──
//
// The rules under test, in the order they resolve:
//   1. an explicit chapterId always wins — no inferred date overrules the artist
//   2. else the dayIndex they picked at capture
//   3. else the date: EXIF DateTimeOriginal for photos, else createdAt
//   4. before the trip → the first chapter BY NUM (a day-less "ch0")
//   5. after the trip → held aside; no confident guess
//   6. in range but on an unlisted day → the most recent prior day's chapter,
//      matching what resolveToday() does with gap days

console.log("\n[10] placement ladder");
{
  // A day-less pre-departure chapter — scaffolding for packing and orientation.
  const ch0 = { id: "ch-0", num: 0, verb: "Prepare", place: "Departure", title: "Prepare for departure", goal: "", prompt: "", accent: "yellow", dayIds: [], dayDates: [], timezone: TZ, dateLabel: "" };
  const spine0 = [ch0, ...spine];
  const runOn = (sp, captures) => assembleDraft({
    programId: "passage-slovakia-2026",
    authorSlug: "test-artist",
    program,
    spine: sp,
    captures,
    existing: null,
    now: "2026-08-03T15:00:00.000Z",
  });
  const at = (d, id) => d.chapters.find((c) => c.chapterId === id);

  // 1 — explicit chapterId beats a flatly contradictory EXIF date.
  {
    const c = cap({ bodyText: "Filed by hand.", chapterId: "ch-3", mediaCapturedAt: "2026-07-12T09:00:00" });
    const { draft } = runOn(spine, [c]);
    check("explicit chapterId wins over EXIF", at(draft, "ch-3").response === "Filed by hand." && !at(draft, "ch-1").response);
  }

  // 2 — dayIndex places it when no chapter was tagged.
  {
    const c = cap({ bodyText: "Picked the day.", chapterId: "", dayIndex: "d2", createdAt: "2026-08-30T10:00:00.000Z" });
    const { draft, unsortedCaptureIds } = runOn(spine, [c]);
    check("dayIndex places when chapterId is blank", at(draft, "ch-2").response === "Picked the day." && unsortedCaptureIds.length === 0);
  }

  // 3 — THE post-trip backfill case: uploaded weeks late, EXIF says mid-trip.
  {
    const c = cap({ kind: "photo", driveFileId: "df-exif", chapterId: "", dayIndex: "", createdAt: "2026-08-25T18:00:00.000Z", mediaCapturedAt: "2026-07-14T11:00:00" });
    const { draft, unsortedCaptureIds } = runOn(spine, [c]);
    check("EXIF places a photo uploaded after the trip", at(draft, "ch-2").photoCaptureIds.includes(c.captureId) && unsortedCaptureIds.length === 0);
  }

  // 4 — same upload, no EXIF: nothing to go on, so nothing is guessed.
  {
    const c = cap({ kind: "photo", driveFileId: "df-blind", chapterId: "", dayIndex: "", createdAt: "2026-08-25T18:00:00.000Z" });
    const { draft, unsortedCaptureIds } = runOn(spine, [c]);
    check("post-trip photo with no EXIF is held aside", unsortedCaptureIds.includes(c.captureId) && !JSON.stringify(draft.chapters).includes("df-blind"));
  }

  // 5 — before the trip → ch-0, the first chapter BY NUM. Note ch-0 owns no
  //     days, so "chapter of the earliest day" would wrongly answer ch-1 here.
  {
    const c = cap({ bodyText: "Packing the soft shoes.", chapterId: "", dayIndex: "", createdAt: "2026-07-02T10:00:00.000Z" });
    const { draft, unsortedCaptureIds } = runOn(spine0, [c]);
    check("pre-trip capture clamps to the day-less ch-0", at(draft, "ch-0") && at(draft, "ch-0").response === "Packing the soft shoes." && unsortedCaptureIds.length === 0);
    check("it does NOT land in the first dated chapter", !at(draft, "ch-1").response);
  }

  // 6 — the "only if necessary" rule: no pre-trip captures, no ch-0 on the card.
  {
    const c = cap({ bodyText: "Arrived.", chapterId: "ch-1" });
    const { draft } = runOn(spine0, [c]);
    check("day-less ch-0 is absent when nothing lands in it", at(draft, "ch-0") === undefined);
    check("dated chapters are still scaffolded when empty", at(draft, "ch-2") !== undefined && at(draft, "ch-3") !== undefined);
  }

  // 7 — in-range gap day (Jul 16 sits between d2/Jul 14 and d3/Jul 18).
  {
    const c = cap({ bodyText: "A day the itinerary skips.", chapterId: "", dayIndex: "", createdAt: "2026-07-16T10:00:00.000Z" });
    const { draft } = runOn(spine, [c]);
    check("gap day anchors to the most recent prior day", at(draft, "ch-2").response === "A day the itinerary skips.");
  }

  // 8 — timezone: 22:30 UTC on Jul 13 is already 00:30 on Jul 14 in Bratislava,
  //     so this belongs to d2/ch-2. Comparing raw UTC would read "2026-07-13",
  //     fall through as a gap day, and file it a day early under ch-1.
  {
    const c = cap({ bodyText: "Late night, next day really.", chapterId: "", dayIndex: "", createdAt: "2026-07-13T22:30:00.000Z" });
    const { draft } = runOn(spine, [c]);
    check("late-evening capture resolves in the program timezone", at(draft, "ch-2").response === "Late night, next day really.", { ch1: at(draft, "ch-1").response, ch2: at(draft, "ch-2").response });
  }
}

// ── 11. "Also on the card" overflow (morePhotoCaptureIds / moreAudioCaptureIds) ──

console.log("\n[11] more* overflow fields");
{
  const photos = Array.from({ length: 14 }, (_, i) =>
    cap({ kind: "photo", driveFileId: `mf-${i}`, chapterId: "ch-1", createdAt: `2026-07-12T${String(i + 1).padStart(2, "0")}:00:00.000Z` })
  );
  const voices = Array.from({ length: 6 }, (_, i) =>
    cap({ kind: "voice", driveFileId: `mv-${i}`, chapterId: "ch-1", createdAt: `2026-07-12T${String(i + 1).padStart(2, "0")}:30:00.000Z` })
  );
  const first = run([...photos, ...voices]);
  const ch1 = first.draft.chapters[0];
  check("featured photos stay the first 5 chronological", ch1.photoCaptureIds.join() === photos.slice(0, 5).map((c) => c.captureId).join());
  check("morePhotos = photos 6..12 chronological (7 max)", (ch1.morePhotoCaptureIds ?? []).join() === photos.slice(5, 12).map((c) => c.captureId).join(), ch1.morePhotoCaptureIds);
  check("photos beyond 12 stay off the draft entirely", !JSON.stringify(first.draft).includes(photos[12].captureId) && !JSON.stringify(first.draft).includes(photos[13].captureId));
  check("featured audio stays the first voice", ch1.audioCaptureId === voices[0].captureId);
  check("moreAudio = voices 2..5 (4 max)", (ch1.moreAudioCaptureIds ?? []).join() === voices.slice(1, 5).map((c) => c.captureId).join(), ch1.moreAudioCaptureIds);
  check("voice 6 stays off the draft", !JSON.stringify(first.draft).includes(voices[5].captureId));

  const rerun = run([...photos, ...voices], first.draft);
  check("re-run with more* filled → changed=false (no write)", rerun.changed === false);

  // Touched more* fields are the artist's forever.
  const curated = {
    ...first.draft,
    chapters: first.draft.chapters.map((c) =>
      c.chapterId === "ch-1"
        ? { ...c, morePhotoCaptureIds: [photos[9].captureId], moreAudioCaptureIds: [], touchedFields: ["morePhotoCaptureIds", "moreAudioCaptureIds"] }
        : c
    ),
  };
  const afterCurate = run([...photos, ...voices], curated);
  const curCh1 = afterCurate.draft.chapters[0];
  check("touched morePhotos NOT overwritten", (curCh1.morePhotoCaptureIds ?? []).join() === photos[9].captureId);
  check("touched (emptied) moreAudio NOT refilled", (curCh1.moreAudioCaptureIds ?? []).length === 0, curCh1.moreAudioCaptureIds);

  // Hand-picked featured set: auto more* must exclude it — never a duplicate.
  const handPicked = {
    ...first.draft,
    chapters: first.draft.chapters.map((c) =>
      c.chapterId === "ch-1"
        ? { ...c, photoCaptureIds: [photos[8].captureId, photos[2].captureId], touchedFields: ["photoCaptureIds"] }
        : c
    ),
  };
  const afterPick = run([...photos, ...voices], handPicked);
  const pickCh1 = afterPick.draft.chapters[0];
  check("auto morePhotos excludes hand-picked featured ids",
    !(pickCh1.morePhotoCaptureIds ?? []).includes(photos[8].captureId) && !(pickCh1.morePhotoCaptureIds ?? []).includes(photos[2].captureId),
    pickCh1.morePhotoCaptureIds);
  check("morePhotos still capped at 7 after exclusion", (pickCh1.morePhotoCaptureIds ?? []).length === 7);

  // No overflow → the keys stay absent, so pre-existing drafts stay byte-identical.
  const few = run([photos[0], voices[0]]);
  const fewJson = JSON.stringify(few.draft.chapters[0]);
  check("no overflow → more* keys absent from the draft JSON", !fewJson.includes("morePhotoCaptureIds") && !fewJson.includes("moreAudioCaptureIds"), fewJson);

  // Empty-chapter invitation (§10-Q7): the optimistic append put the uploaded
  // photo's captureId into the draft WITHOUT marking the field touched. The
  // next assembly run recomputes the untouched field from the captures — the
  // photo appears exactly once, never duplicated, and auto-fill keeps flowing.
  const uploaded = cap({ kind: "photo", driveFileId: "mf-upload", chapterId: "ch-2", createdAt: "2026-07-14T09:00:00.000Z" });
  const optimistic = {
    ...first.draft,
    chapters: first.draft.chapters.map((c) =>
      c.chapterId === "ch-2" ? { ...c, photoCaptureIds: [...c.photoCaptureIds, uploaded.captureId] } : c
    ),
    updatedAt: "2026-07-14T09:00:05.000Z",
  };
  const afterUpload = run([...photos, ...voices, uploaded], optimistic);
  const upCh2 = afterUpload.draft.chapters.find((c) => c.chapterId === "ch-2");
  check("optimistic insert survives assembly exactly once (no duplication)",
    upCh2.photoCaptureIds.filter((id) => id === uploaded.captureId).length === 1, upCh2.photoCaptureIds);
  check("untouched chapter keeps auto-assembling after the insert",
    !(upCh2.touchedFields ?? []).includes("photoCaptureIds"));

  // Sealed media never reaches the overflow tier.
  const sealedPhoto = cap({ kind: "photo", driveFileId: "mf-sealed", chapterId: "ch-1", visibility: "sealed", createdAt: "2026-07-12T06:15:00.000Z" });
  const sealedVoice = cap({ kind: "voice", driveFileId: "mv-sealed", chapterId: "ch-1", visibility: "sealed", createdAt: "2026-07-12T06:45:00.000Z" });
  const withSealed = run([...photos, ...voices, sealedPhoto, sealedVoice]);
  const sealedJson = JSON.stringify(withSealed.draft);
  check("sealed photo/voice never land in more*", !sealedJson.includes(sealedPhoto.captureId) && !sealedJson.includes(sealedVoice.captureId));
}

// ── 12. Retired-spine chapters: empty ones dropped, written ones kept ─────────

console.log("\n[12] retired-spine chapter cleanup");
{
  // A draft born against an OLDER itinerary generation (2026-08-19 incident:
  // day-1 devices held ch1..ch5 while the live spine is ch-1..ch-3 here).
  const staleEmpty = { chapterId: "old-1", kind: "chapter", num: "01", title: "Old Arrival", response: "", body: "", reflection: "", photoCaptureIds: [] };
  const staleWritten = { chapterId: "old-2", kind: "chapter", num: "02", title: "Old Lab", response: "Words the artist wrote.", body: "", reflection: "", photoCaptureIds: [] };
  const existing = run([]).draft;
  const withStale = { ...existing, chapters: [staleEmpty, staleWritten, ...existing.chapters] };
  const { draft } = run([cap({ bodyText: "New words.", chapterId: "ch-1" })], withStale);
  check("empty retired-spine chapter is dropped", !draft.chapters.some((c) => c.chapterId === "old-1"));
  check("written retired-spine chapter is kept forever", draft.chapters.some((c) => c.chapterId === "old-2" && c.response === "Words the artist wrote."));
  check("current spine chapters unaffected", draft.chapters.filter((c) => c.kind === "chapter" && ["ch-1", "ch-2", "ch-3"].includes(c.chapterId)).length === 3);
  check("no duplicate chapter ids", new Set(draft.chapters.map((c) => c.chapterId)).size === draft.chapters.length);

  // Order repair: a draft scrambled by generation churn (spine chapters out of
  // order, e.g. the pre-departure chapter stranded last) comes back in spine
  // order, with dailies still tucked behind their chapter.
  const scrambled = {
    ...existing,
    chapters: [
      existing.chapters.find((c) => c.chapterId === "ch-3"),
      { chapterId: "daily-x", kind: "daily", title: "Postcard", response: "A line.", body: "", reflection: "", photoCaptureIds: [] },
      existing.chapters.find((c) => c.chapterId === "ch-1"),
      existing.chapters.find((c) => c.chapterId === "ch-2"),
    ],
  };
  const reordered = run([], scrambled).draft;
  check("chapters return to spine order",
    reordered.chapters.filter((c) => c.kind === "chapter").map((c) => c.chapterId).join() === "ch-1,ch-2,ch-3",
    reordered.chapters.map((c) => c.chapterId));
  check("daily stays tucked behind its chapter",
    reordered.chapters[reordered.chapters.findIndex((c) => c.chapterId === "ch-3") + 1]?.chapterId === "daily-x",
    reordered.chapters.map((c) => c.chapterId));

  // Itinerary metadata is authoritative: stale titles/places/dates from an
  // older revision refresh on every run (title only while untouched).
  const staleMeta = {
    ...existing,
    chapters: existing.chapters.map((c) =>
      c.chapterId === "ch-1"
        ? { ...c, title: "Stale Title", num: "09", location: "Wrongville", dateLabel: "Never" }
        : c.chapterId === "ch-2"
          ? { ...c, title: "My Own Title", touchedFields: ["title"], location: "Wrongville" }
          : c
    ),
  };
  const refreshed = run([], staleMeta).draft;
  const r1 = refreshed.chapters.find((c) => c.chapterId === "ch-1");
  const r2 = refreshed.chapters.find((c) => c.chapterId === "ch-2");
  check("untouched title/metadata refresh from the spine",
    r1.title === "Arrival" && r1.num === "01" && r1.location === "Bratislava" && r1.dateLabel === "Jul 12", r1);
  check("touched title survives; metadata still refreshes",
    r2.title === "My Own Title" && r2.location === "Zvolen", r2);
}

// ── Result ────────────────────────────────────────────────────────────────────

console.log("");
if (failures) {
  console.error(`✗ ${failures} check(s) FAILED`);
  process.exit(1);
}
console.log("✓ all auto-composer fixture checks passed");
