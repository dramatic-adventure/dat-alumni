# Site-Wide Font Loading — Performance Fix

**Status:** Ready to build once §6 audit steps are done. Hand this whole file to a fresh Claude (Fable) task as the anchoring context.
**Prepared:** 2026-07-02, found while live-testing the Slice 5 Field Kit deploy on `stories.dramaticadventure.com`.
**Not a Field Kit slice.** This is a root-layout / site-wide issue that happens to violate the Field Kit's "the whole app must be fast" requirement (see `field-kit-BUILD-SPEC-slice5.md` header) worse than anywhere else, because Field Kit is a mobile PWA meant to work on bad connections. Fixing it benefits every route on the site, not just `/field-kit`.
**Do this independently of Slice 6** (Composer/Publish/Retroactive) — no shared files, no ordering dependency either direction.

---

## 0. First, before any code

1. Honor CLAUDE.md: **no changes until 95% confidence.** §6 below is an audit, not an open-question list to ask Jesse about — this one you can mostly resolve yourself by reading the code, because the answer is "is this font file byte ever actually used," which is a factual question, not a design preference. Only bring back to Jesse the handful of judgment calls flagged explicitly in §6.
2. Read `app/fonts.ts`, `app/layout.tsx`, and `tailwind.config.js` (the `fontFamily` block, lines ~41–55) in full before touching anything — the three findings in §1 below all come from these three files plus grepping usage, and you'll need the same picture.
3. `npm run check` must stay clean throughout.

---

## 1. What was found (live, on production)

Loading `stories.dramaticadventure.com/field-kit/admin` (a real, signed-in page load, not a synthetic test) pulled down **48 separate font files** (mostly `.woff2`, a couple `.ttf`) before the page was interactive, and TTFB was ~1.8s. Tracing it:

- `app/layout.tsx` applies **13 font CSS variables** (`anton`, `dmSans`, `spaceGrotesk`, `rockSalt`, `gloucester`, `vt323`, `specialElite`, `shareTechMono`, `cutiveMono`, `anonymousPro`, `syneMono`, `majorMono`, `zillaSlab`) directly on the root `<html>` element. Because this is the **root** layout, every route in the app — including `/field-kit`, whose own design system (`components/field-kit/tokens.ts`) explicitly needs only three of these (Anton, DM Sans, Space Grotesk) — gets all thirteen preloaded on every page load.
- `dmSans` alone is defined with **~20 source files** (2 variable TTFs covering the full weight range, plus 18 separate static `.woff2` files for individual weights 100–900 in both normal and italic — largely redundant with the variable TTFs that already cover that range).
- `spaceGrotesk` defines **each weight twice** — once from a `latin-ext` file set and again from a separate `latin`-only file set for the same weight (`app/fonts.ts` lines 87–98) — which looks like leftover duplication rather than an intentional fallback strategy.
- `majorMono` is defined **inline in `app/layout.tsx`** (lines 32–42) rather than alongside the others in `app/fonts.ts` — a small inconsistency worth fixing while in this file, not a performance issue on its own.
- A rough usage grep (`grep -rl -- "--font-X" app components lib`, excluding `fonts.ts`/`layout.tsx` themselves) found **zero direct references** anywhere in the codebase to `vt323`, `shareTechMono`, `cutiveMono`, `syneMono`, or `majorMono`. **Caveat, and the reason this needs a real audit, not a delete-on-sight:** `tailwind.config.js`'s `fontFamily` block maps some of these to semantic Tailwind utility classes — e.g. `mono` → `var(--font-anonymous-pro)`, `serif` → `var(--font-zilla-slab)` — so a component using the Tailwind class `font-mono` or `font-serif` would use that font without the raw CSS variable ever appearing in a grep. `anonymousPro` (0 direct hits) and `zillaSlab` (1 direct hit) both have Tailwind aliases and must be checked for `font-mono`/`font-serif`/`font-sans`/`font-serif` class usage before being touched. `vt323`, `shareTechMono`, `cutiveMono`, `syneMono`, and `majorMono` have **no Tailwind alias at all** (confirmed by reading the `fontFamily` block) and no direct variable reference — these five are the strongest dead-code candidates.
- `specialElite` had 2 direct usages, `zillaSlab` had 1 — both genuinely used somewhere, not dead.

---

## 2. Scope

### In scope
- **Tier 1 (low-risk, do first):** remove font source files and `fonts.ts` entries that are confirmed, after a real audit (§6), to have zero usage — direct or via a Tailwind alias — anywhere in the codebase. Candidates per §1: `vt323`, `shareTechMono`, `cutiveMono`, `syneMono`, `majorMono`.
- **Tier 1:** de-duplicate `spaceGrotesk`'s doubled weight files (keep one file set per weight, drop the redundant other) and reconsider whether `dmSans`'s 18 static per-weight files are needed alongside its 2 variable TTFs (the variable files likely already cover the same range).
- **Tier 1:** move `majorMono`'s definition from `app/layout.tsx` into `app/fonts.ts` alongside the rest, for consistency (or remove it entirely if it's confirmed dead per the above).
- **Tier 2 (higher-effort, do after Tier 1 ships and is verified):** stop applying every font variable at the root `<html>` in `app/layout.tsx`. Scope font variables to the layout of the route group that actually needs them — e.g. `app/field-kit/layout.tsx` applies only `anton`/`dmSans`/`spaceGrotesk` (its own tokens.ts already names exactly these three), while marketing-site-only fonts (`rockSalt`, `gloucester`, and whatever survives the Tier-1 audit) stay applied only where the marketing chrome (`SiteChrome`, non-field-kit routes) renders. CSS custom properties inherit down the DOM, so this only works cleanly if the font variables are applied at a wrapping element that's an ancestor of everything that needs them within that route group — verify this per §6, don't assume it "just works."
- **Secondary, lower-confidence item:** the ~1.8s TTFB on the admin page load. Worth a quick look (is this a Netlify cold serverless function, or a slow server-side data fetch/session check in the gate?) but don't let this block or scope-creep the font work — if it turns out to be cold-start latency, that's a separate, probably-not-worth-chasing issue; note the finding either way.

### Explicitly OUT of scope
- Any change to the actual visual design/typography choices on any page — this is about which files get *downloaded*, not which fonts get *used*. If a font is genuinely in use anywhere, it stays, full stop.
- Slice 6 (Composer/Publish/Retroactive) — unrelated, no shared files.

---

## 3. Locked decisions

- **A font only gets removed if a real audit (§6) shows zero usage — direct variable reference AND Tailwind alias.** No "probably unused" deletions.
- **Tier 2's route-scoping only ships after Tier 1 is verified in production** — smaller, safer change first; the bigger structural change second, once you've confirmed the safe win actually landed cleanly.
- **`components/field-kit/tokens.ts` is the source of truth for which fonts Field Kit needs** (Anton, DM Sans, Space Grotesk) — don't re-derive this from scratch, it's already documented there.

---

## 4. Components/files likely touched

- `app/fonts.ts` — remove dead font definitions, dedupe Space Grotesk weight files, evaluate DM Sans's static files vs. its variable TTFs, add `majorMono` here (or remove it).
- `app/layout.tsx` — remove the deleted font imports/variables from the root `<html>` className; for Tier 2, stop applying route-specific fonts here at all.
- `app/field-kit/layout.tsx` — for Tier 2, apply Field Kit's own three font variables here instead of inheriting all of them from root.
- Any other route-group layouts that end up needing their own font scoping as a result of removing the root's blanket application (identify via §6, don't guess).
- `public/fonts/` — delete the actual now-unused font files once `fonts.ts` no longer references them (don't leave orphaned files).

---

## 5. Build sequence

1. **Tier 1 audit** (§6) — confirm the dead-font list and the redundant-file list with real grep/Tailwind-usage evidence, not assumption.
2. Remove confirmed-dead fonts from `fonts.ts` and delete their files from `public/fonts/`.
3. De-duplicate Space Grotesk; evaluate and likely trim DM Sans's redundant static files.
4. Move/resolve `majorMono`.
5. `npm run check` + a visual smoke test across a few representative routes (marketing home, an alumni profile, the story map, `/field-kit`) to confirm nothing regressed visually — a missing font falls back silently to the `fallback` stack, which means a real regression could be invisible in a quick glance; check computed styles, not just "does it look okay."
6. Ship Tier 1, verify in production (repeat the same live font-count check that found this issue — reload `/field-kit/admin` or any page and count network requests for `_next/static/media/*`).
7. **Tier 2:** audit which fonts each route group actually needs (§6), then move font variable application from root `app/layout.tsx` into the relevant nested layouts. Field Kit first (it's the motivating case and has the clearest three-font spec already written down in `tokens.ts`).
8. Verify Tier 2 the same way — confirm `/field-kit` now loads only its three fonts' files, and confirm marketing routes still load correctly with whatever they still need at root or in their own layout.
9. Take a quick, non-blocking look at the TTFB finding; report what you find even if you don't fix it.

---

## 6. Audit steps (do these before deleting anything)

1. For each of `vt323`, `shareTechMono`, `cutiveMono`, `syneMono`, `majorMono`: confirm zero references two ways — (a) grep for the raw CSS variable string (`--font-x`) across `app/`, `components/`, `lib/`, and (b) grep for any Tailwind utility class that `tailwind.config.js`'s `fontFamily` block maps to that font (none currently exist for these five, per §1 — but re-verify, don't trust this doc if `tailwind.config.js` has changed since 2026-07-02).
2. For `anonymousPro` (→ Tailwind `mono`) and `zillaSlab` (→ Tailwind `serif`): grep for actual usage of the `font-mono` / `font-serif` Tailwind classes (and any other alias in the `fontFamily` block that resolves to them) across the codebase before concluding anything about their status. These are more likely to be in real use than the five in step 1.
3. For the Space Grotesk / DM Sans duplicate-weight question: confirm via Chrome DevTools' computed font-family / actually-loaded-font inspection (or just careful reading of `next/font/local`'s behavior with multiple `src` entries for the same weight) that dropping the redundant file for a given weight doesn't silently lose glyph coverage (e.g. the `latin-ext` vs `latin`-only distinction might matter for non-English text somewhere on the site — check before assuming it's pure duplication).
4. For Tier 2: for each route group (marketing/home, alumni profiles, story map, donate, journeys/journey cards, field kit, admin diagnostics if it renders any UI), determine which fonts it actually renders with. Use this to decide the final per-route-group font variable scoping — this is real investigative work, not a five-minute grep, since some marketing components may be reused across route groups.

---

## 7. Verification (required final step)

- `npm run check` clean.
- Production build clean.
- Repeat the live network-request count on `/field-kit` (or wherever the Field Kit shell renders) before/after — should drop meaningfully once Field Kit is scoped to its three fonts (Tier 2), and drop somewhat even after Tier 1 alone (fewer total files sitewide).
- Visual regression check across marketing home, an alumni profile page, the story map, donate flow, and all Field Kit screens — confirm no font silently fell back to a generic system font anywhere real typography was intended.
- Confirm the TTFB finding is reported (fixed or explained) even if it turns out to be out of scope for a code fix.

---

## 8. Guardrails

- CLAUDE.md: **no changes until 95% confidence** — for this task that mostly means "prove it's unused before deleting it," not "ask Jesse first" (this is a factual codebase question, not a design preference), except for the handful of genuine judgment calls in §6.3 (glyph coverage) if the evidence is ambiguous.
- `npm run check` before every commit.
- Don't change anything's actual visual typography — this task is purely about which font files get downloaded, never about what a page looks like.
- Ship Tier 1 and verify before starting Tier 2 — don't do both in one unverified pass.
