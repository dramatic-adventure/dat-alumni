# Claude Code task — "Your Public Profile" onboarding preview + Take-it-further upgrades

> Paste this into Claude Code, run from the repo root. **Use the `dat-app-guardrails` skill** (surgical, smallest file set, no broad refactors). Run `npm run check` before finishing.

## Problem

When an alum logs into `/alumni/update` for the first time, they may never have seen their public profile (`stories.dramaticadventure.com/alumni/{slug}`). The Profile Studio drops them straight into editing with no sense of what they're editing or what visitors see. Many profiles are pre-filled from DAT records, so this is often "here's the profile we built for you — review/extend it," not "start from scratch."

## Solution (decided)

A lightweight, **encouraging** preview card at the top of the Profile Studio (NOT a faithful clone of the real hero — we deliberately chose the nudge card over reusing `DesktopProfileHeader`), plus a small secondary link in the page hero. Below the preview, a dynamic "Take it further" block advertising the richer features. Everything is driven by the form's live state — no new data fetches, **no new Sheets column.**

## Files to touch (smallest set)

- **New:** `components/alumni/update/PublicProfilePreview.tsx` — self-contained; renders the preview card + the "Take it further" ads. Props are passed in from the form (no internal data loading).
- **New (or colocated):** a pure helper `deriveProfileState(form)` — put in `app/alumni/update/helpers/` next to `baseline.ts`.
- **Edit:** `app/alumni/update/update-form.tsx`
  - Render `<PublicProfilePreview/>` at the **top of the Profile Studio panel**, just above the `Profile Studio` label/tab bar (around the `{/* ====== PROFILE STUDIO ... */}` block, ~line 2324).
  - Add a small **secondary "View public profile" link in the hero**, next to `Signed in as {email}` (~line 2262). Guard on `currentSlug`.
  - Pass `setStudioTab` down so ad tiles can open the matching tab.
  - Give the community composer a `ref`/`id` + a focus method so "Add a headline / Share an update" can scroll to it and focus the textarea.

## Data — all already in `update-form` state

`currentSlug`, `currentHeadshotUrl`, `name`, `currentTitle`, `location`, `secondLocation`, `isBiCoastal`, `currentUpdateText`, `identityTags`, `practiceTags`, `exploreCareTags`, `languages`, `website` / `primarySocial` / `publicEmail`. Feature content for the ad flags: media (`/api/alumni/media/list` or existing media state), story-map stories (`myStories` in `StoryPanel` flow), journey cards + highlights (spotlight/highlight preload), `upcomingEvent`. Where a flag's data isn't readily in state, **default to showing the ad** (i.e. treat as "not done") rather than guessing "Added."

## Design spec

**Tokens** (`app/alumni/update/updateStyles.ts`): ink `#241123`, brand `#6C00AF`, gold `#D9A919`, snow `#F2F2F2`. The card sits on the warm kraft surface (`#dac9a6`, like the composer) to read as friendly onboarding, distinct from the plum studio. **Fonts:** `var(--font-space-grotesk)` for labels/name/buttons, `var(--font-dm-sans)` for body, `var(--font-anton)` only if you want the name condensed.

**Preview card**
- Eyebrow `YOUR PUBLIC PROFILE` + a `Public` pill (eye icon).
- **Headshot frame is 4:5 portrait** (e.g. 92×115, radius 12) — NOT a circle. If `currentHeadshotUrl` is set, show it `object-fit: cover`; else a dashed placeholder ("Add headshot" — match the studio's "Headshot" vocabulary, not "photo") that **opens the Basics tab** on click.
- Name (`name`), title (`currentTitle`), location (`location`, append `secondLocation` when `isBiCoastal`).
- A **headline line = latest `currentUpdateText`**. When empty, show a clickable prompt ("Share an update" / "Add a headline") that **scrolls up to the composer and focuses it**.
- **URL + button on their own row, as flex siblings** so the button never overlaps the link: URL is `flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis`; the `View public profile` button is `flex:none`. When `currentSlug` is empty, replace the URL with a muted "Save once to publish your page" and disable the button.
- A **progress bar** bound to completeness (`filled / total`).

**"Add a headline / Share an update" behavior:** scroll to the composer (`UpdateComposer` in the community ledger above the studio) and focus its textarea. Posting there already calls `postCurrentUpdate`, which optimistically sets `profile.currentUpdateText`, so the preview's headline line updates live. (Verify the public render path for the current update — `ProfileCard` `updates` / `UpdatesPanel` — so we can truthfully say it shows on the profile.)

**"Take it further" ads** — each tile click **opens the matching Profile Studio tab AND scrolls that section into view.** Call `setStudioTab(...)`; the studio already maps tabs to anchors (`TAB_ANCHOR_ID` + `scrollToAnchorOnTabChange`), so the tab switch should scroll there — but since the tiles live above the studio, **verify the panel actually scrolls into view** and, if not, explicitly `scrollIntoView({ behavior: "smooth", block: "start" })` on the studio/anchor element after switching. Same applies to the headshot placeholder → Basics and "Add a headline" → composer: switch/focus **and** scroll the target into view.
Tiles, in order, each mapping to a studio tab:

- Share photos or video → `media`
- Pin your story on the map → `story`
- Trace your journey with DAT → `journey` (its own explainer tile; lead with what it **is** — don't define it against the Story Map, no "not a map pin" badge, no "lives on your profile" tag)
- Add a recent highlight → `highlight`
- Share an upcoming event → `event`

(Exact strings are in **Final copy** below — that block is authoritative.)

**Every tile is itself the CTA — NO separate button.** The whole card is clickable (opens + scrolls to its studio tab) and carries a quiet chevron (`ti-chevron-right`, muted purple) to signal it goes somewhere. The `media` tile may also carry a small `ADDED` badge when content exists; the highest-value empty tile may carry a gold `NEXT UP` badge.

### Final copy (authoritative — sentence case)

**Preview card**
- Eyebrow: "Your public profile"
- Status pill: "Public"
- Empty-headshot prompt (opens Basics → headshot): "Add your headshot"
- Empty-update prompt (jumps to + focuses the composer): "Share your latest"
- Encouragement line (beside the progress bar): "Add your headshot and a few details to help visitors recognize you, follow your work, and connect."
- Unsaved / pre-publish state (in place of the live URL + link): "Save changes to update your live profile."

**Take it further** (heading → tab — body)
- Share photos or video → `media` — "Feature a reel, trailer, production photos, or a collection from your travels and projects."
- Pin your story on the map → `story` — "Map one special moment from your DAT journey on the global Story Map."
- Trace your journey with DAT → `journey` — "Create a Journey Card for a past program, reflecting on where you went, what you made, and what stayed with you."
- Add a recent highlight → `highlight` — "Celebrate your work by sharing a project, award, press mention, or creative milestone."
- Share an upcoming event → `event` — "Add your next performance, screening, workshop, exhibition, opening, or other public event."

**Dynamic state:** each ad reads a `featureFlag` (`hasMedia`, `hasStoryMapStory`, `hasJourneyCard`, `hasHighlight`, `hasUpcomingEvent`). Done → muted "Added ✓". The highest-value incomplete one gets a gold "Next up" badge. Sort incomplete-first.

## Dynamic architecture

One memoized selector over live form state:

```
deriveProfileState(form) => {
  preview: { name, title, location, headshotUrl, headline /* = currentUpdateText */, slug },
  completeness: { filled, total, pct, missing: string[] },
  featureFlags: { hasMedia, hasStoryMapStory, hasJourneyCard, hasHighlight, hasUpcomingEvent },
}
```

Preview binds to `preview`, progress bar to `completeness`, ads to `featureFlags`. Form state is already reactive, so everything updates live with no extra fetches.

**Completeness essentials (the `total`, ~9):** headshot, `currentTitle`, `location`, `bioLong`, `identityTags`, `practiceTags`, `exploreCareTags`, `languages`, and "one way to connect" (`website || primarySocial || publicEmail`). Treat each as filled when non-empty.

## Guards / edge cases

- No `currentSlug` (pre-first-save) → disable both public-profile links; preview still renders.
- No headshot → dashed "Add your headshot" placeholder in the card (the public profile itself already falls back to `default-headshot.png`).
- Unclaimed users never reach the form (handled in `page.tsx`) — nothing to do.

## Non-goals

- No embedded/scaled real `ProfileCard` hero (rejected in favor of the nudge card).
- No new Sheets column — the headline reuses `currentUpdateText`.

## Acceptance

- Preview renders at the top of the studio; secondary link in the hero; 4:5 headshot.
- URL never overlaps the "View public profile" button at any width.
- Progress bar, ads, and preview values are all live-dynamic from form state.
- Clicking any "Take it further" tile switches to that studio tab **and scrolls the section into view**.
- "Share your latest" scrolls to + focuses the composer; posting updates the preview.
- The headshot placeholder opens the Basics tab **and scrolls it into view**.
- `npm run check` passes.
