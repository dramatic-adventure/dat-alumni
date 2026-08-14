# BUILD PROMPT — Mailing list abuse mitigation

**Repo:** `dat-alumni` · work from the current `main` working tree
**Read `CLAUDE.md` first.** It governs conventions here, including: *"Do not make
any changes until you have 95% confidence in what you need to build. Ask me
follow-up questions until you reach that confidence."* That rule applies to this
task, and §3 below is an explicit decision point you must raise before coding.

> **Provenance and health warning.** A prior session diagnosed this problem and
> wrote a partial fix, which is sitting uncommitted in the working tree. That
> work was then independently reviewed and **substantial errors were found in
> both the diagnosis and the code.** This document is the corrected version.
> Where the two disagreed, the numbers below come from re-reading the raw data,
> and the code defects in §4 were confirmed by *executing* the scorer, not by
> reading it. **Do not trust the uncommitted code as a starting point without
> fixing §4 first.**

**Run this in Claude Code, not Cowork.** The prior session worked through a
remote file bridge: `npm run check` never completed in 10+ minutes, the shell
had no network access, and files could not be deleted. This is a multi-file
refactor with a typecheck loop and wants a native local terminal. You will also
need network for the Sheets API — read the subscriber sheet with a throwaway
`tsx` script using the `GCP_SA_JSON` credentials in `.env.local`, the same way
`scripts/flag-mailing-list-spam.ts` authenticates.

---

## 0. Question everything in this document

This brief is a set of **hypotheses with evidence attached, not findings to
implement**. The session that wrote the original version was confident, specific,
and wrong about several things — the errors surfaced only because someone
re-examined the raw data independently. Do the same to this document.

Concretely:

- **Re-read the raw sheet before trusting §1.** The phase boundaries, the row
  counts, and the 45% dot-density figure come from a single analysis pass.
  Recompute them. If your numbers differ, yours are probably right.
- **Execute the scorer; do not read it.** §4.1's false positives were found by
  running `scoreSignup` against real names. The previous author read the same
  code, wrote a comment asserting international names "score clean," and shipped
  the opposite. Reading is how that bug survived.
- **These claims are the weakest and deserve independent checks:**
  - *"Firefox only sent `Origin` on same-origin POSTs from v70"* and the Opera
    Mini behavior (§4.2) — asserted from memory, never verified against a
    source; web access was blocked when this was written. Check MDN and current
    browser-support data before you keep or remove the Origin check.
  - *"`GOOGLE_SHEET_ID` is not set on Netlify"* (§5) — the Netlify CLI returned
    empty output for **every** command, including ones that should have printed
    a table, so it was likely failing rather than reporting. The real evidence
    is that the `Mailing List` tab is empty: strong, but indirect. Confirm in
    the Netlify UI.
  - The M3AAWG guidance characterization in §3 — cited from memory, not fetched.
  - The ~60/min Sheets write quota in §4.3 — check current Google limits.
- **You may discard the uncommitted code entirely.** It is uncommitted precisely
  so that throwing it away costs nothing. If §4 reads like more repair than the
  code is worth, say so and rebuild. That is a legitimate outcome, not a failure.
- **Push back on the owner too.** If the framing in §3 is wrong, or there's a
  simpler fix nobody proposed, argue for it before writing code.

State disagreements plainly and early. Don't manufacture them to appear
rigorous — but where you find real problems, saying so is the job.

---

## 1. What is actually happening

DAT's public mailing-list signup is being abused. The Google Sheet
`DAT Email Subscribers` (`1YgHj3qoXUgdlVd1hOru9grZrDMN-Nh4WuCo2XjYDhA0`) holds **256 rows spanning 29 Oct 2023 –
14 Aug 2026**. Read it yourself before building.

It is **not one phenomenon**. There are four distinct phases, and conflating
them is the single biggest mistake available here:

| Phase | Window | Rows | Character |
|---|---|---|---|
| P1 | Oct 2023 – Jul 2025 | 19 | B2B cold-outreach / lead-gen spam (`nic@wescalehighticketoffers.com`, `Roger@MarketMogulAdvisors.com`) |
| P2 | Sep 2025 – Jan 2026 | 29 | Algorithmically generated CVCV-gibberish Gmail accounts, undotted (`kuzibuneno07`, `horatiyagdo549`) |
| P3 | Jan – 13 Jul 2026 | 67 | **Same generator, now dot-obfuscated** |
| P4 | 14 Jul – 14 Aug 2026 | 141 | **Real people at real institutions** — this is the live attack |

**P4 is subscription bombing.** An attacker submits third parties' real
addresses to many open forms at once; each site's welcome email piles into the
victim's inbox, burying a fraud-confirmation email. Volume: **96 entries in
Aug 9–14 alone**, 45 more in Jul 14–21, with a 19-day quiet gap between —
consistent with discrete "jobs." Median inter-arrival is 61 minutes and
submissions cover 23 of 24 hours, so it is automated, not human.

**The strongest evidence is the targeting pattern, not the address shapes:**

- `korper.nl` hit 7 times across 4 mailboxes in ~36h, including
  `notifications@korper.nl` three times — a notification mailbox is exactly what
  a fraud-burying flood aims at.
- `benachrichtigungen.google@jom-com.de` — German for "Google notifications."
- `7343555976@txt.att.net` — an SMS gateway. That floods a phone, not an inbox.
- Same victim resubmitted hours apart with fresh dot permutations to defeat
  dedupe: `tomharaske@aol.com` ×3 over 26h, `tamiresrodrigues.jr.88` ×3.
- `j.ose.pho.wen.s.it.sno.tme@gmail.com` — the victim's address literally reads
  "it's not me."

**Corrections to the earlier diagnosis, so you don't repeat them:**

- The much-cited dot-variant pairs "minutes apart" (e.g.
  `uvu.ro.l.ariya668@` / `uvu.r.o.lariya6.6.8@`) are **P3 generated burner
  accounts, not victims.** Of 28 normalized-Gmail groups with multiple
  spellings, 23 normalize to gibberish. The 5 groups that look like real people
  are **3.7 to 62 hours apart**, not minutes.
- Aug 9–14 volume was previously reported as ~50. It is **96**.
- "Content heuristics cannot solve this" was **overstated** — see §3.

**What remains true:** P4 victims are real people, DAT's welcome email has been
landing in inboxes at Fox, the UN World Food Programme, Google and several
universities, and that — not the fake addresses — is what damages the Gmail
sending mailbox's reputation.

---

## 2. State of the working tree

All uncommitted. `git diff` plus two untracked files.

**New:** `lib/mailingListGuard.ts` (origin allowlist, structural validation,
disposable domains, `scoreSignup`, `escapeHtml`), `scripts/flag-mailing-list-spam.ts`
(sheet review/flagging, never deletes).

**Modified:** `app/api/mailing-list/route.ts` (layered checks, HTML escaping,
sheet-ID fallback, 4-column fallback write); `app/page.tsx`,
`app/events/page.tsx`, `components/events/MailingListForm.tsx` (send `dwellMs`);
`eslint.config.mjs`, `package.json`.

**Independently verified as correct** — don't re-litigate these: `escapeHtml` is
complete and applied at every interpolation site; the notify *subject* is safe
from header injection because `lib/sendEmail.ts` uses nodemailer's MailComposer;
`useState(() => Date.now())` in the forms is SSR-hydration-safe because the value
is never rendered; structural email validation won't reject international
addresses.

---

## 3. Decision to raise with the site owner BEFORE building

The earlier session recommended double opt-in and described it as making DAT
"useless as a bombing relay." **That is wrong and the owner has been told so.**
Under double opt-in you still send one email per submission at the victim — the
confirm email is a smaller bomb, but it is still a bomb.

Present these three, get a decision, then build:

**(a) Bot wall at the form — Cloudflare Turnstile.** The only control that stops
the submission happening at all, so no email is generated. Free, invisible to
most users. Needs two keys — use the **Netlify Blobs** pattern (§5), not env
vars.

**(b) Double opt-in.** Nothing joins the list and no *welcome* fires until the
owner of the inbox confirms. Doesn't stop the send; it protects DAT's list
hygiene and sender reputation. Correct as a backstop, wrong as the primary
control.

**(c) Dot-density heuristic.** A high-precision signal the earlier session
missed: **116 of 256 rows (45%)** have ≥3 dots in a Gmail local part with mostly
1–2 character segments (`j.e.s.s.i.ca.ba.r.rio.s.202.2`). Gmail never issues
dotted variants and real humans don't type this way, so false-positive risk is
near zero — unlike the existing scorer (§4.1). Combined with normalized dedupe
and CVCV detection this removes well over half the junk, though it cannot catch
plain P4 rows like `nedra.steele@fox.com`.

Standard guidance for this attack (M3AAWG) is roughly (a) + rate limiting +
normalized dedupe, **then** (b) as hygiene. (c) is cheap and complementary.

---

## 4. Confirmed defects in the uncommitted code — fix before shipping

Ranked. §4.1 is the one that actively harms real users.

### 4.1 `scoreSignup` falsely quarantines real international names
`lib/mailingListGuard.ts`. Verified by execution — these score 2 and are
silently quarantined (HTTP 200, no welcome, a row nobody may review):

```
Ernst Schmidt      ernst.schmidt@gmail.com     → long consonant run ×2
Tigran Mkrtchyan   mkrtchyan@yahoo.com         → long consonant run ×2
Karl Schwartz      karl.schwartz@web.de        → long consonant run ×2
Nguyen Thi Phuong  0912345678@gmail.com        → mostly digits + keyboard mash
Ernst Schmidt      eschmidt1985@gmail.com      → word+digits + consonant run
```

Four root causes, all needing fixes:
- `longestConsonantRun` strips **all** non-letters first, so the dot in
  `ernst.schmidt` and the space in "Ernst Schmidt" vanish and `rnst`+`schm`
  fuse into an 8-consonant run. **Split on separators; take the max per word.**
- **The same trait is double-counted.** A surname in both the name field and the
  email local part contributes 2 points by itself — reaching the threshold on
  one benign fact. Deduplicate signals across fields.
- `^[a-z]{7,}\d{4,}$` matches `kowalski1985`, `nguyenphuong1234` — name plus
  birth year is among the most common legitimate address shapes on Earth.
- A phone-number Gmail (very common in Vietnam) trips *both* "mostly digits" and
  "keyboard mash" via the `12345` entry in `KEYBOARD_RUNS`.

The file's own comment claims international names "score clean." It is false.
The scorer is also porous the other way — `qweqweqwe@gmail.com` and any
dictionary-word bot score 0 — so these false positives buy very little.
`scripts/flag-mailing-list-spam.ts` shares the function, so `--write` would
retroactively mark real subscribers "quarantined."

### 4.2 Origin hard-reject can silently drop real signups
The claim "browsers always send `Origin` on POST" is not safe. Firefox only
began sending it on same-origin POSTs in **Firefox 70**; **Opera Mini's
data-saver proxy** (meaningful share in Tanzania — DAT's own community) and
sandboxed webviews send `Origin: null`, which fails both the allowlist and
`new URL("null")`. Worse, the block returns `silentOk()` **before the body is
read** — no row, no quarantine, only a log line — directly contradicting the
module's own "nothing is silently thrown away" promise. Record these
(`Status="no-origin"`) or roll out log-only first. Minor: `endsWith(".netlify.app")`
allowlists every Netlify customer site.

### 4.3 The over-limit path is an amplification vector
Every rate-limited request still does `await appendRow(...)`, **before** dedupe
and scoring. A bot past the limit gets one Sheets append per request forever:
the sheet fills with junk, and the service account's ~60/min write quota is
shared site-wide, so **concurrent genuine signups fail and are lost**. Each
failure also triggers the A:D fallback, doubling API calls under exactly that
load. Cap over-limit recording (e.g. N per IP per day, then drop).

### 4.4 Per-IP rate limiting is trivially bypassable
`getClientIp` checks `x-forwarded-for` **first** and takes the **first** element
— which is client-supplied, since proxies append. A bot sending a random XFF per
request gets a fresh bucket every time. **Reverse the order: prefer
`x-nf-client-connection-ip` on Netlify.** This also poisons `ip=` in the logs.

### 4.5 `appendRow` catches too broadly
The A:D fallback fires on **any** error, not just grid-width. A transient quota
error on a quarantined row silently drops `Status="quarantined"` and its
reasons, so spam lands looking like a clean signup. If the first append
committed but the response timed out, the fallback writes a **duplicate row**.
Gate on `/exceeds grid limits/i`.

### 4.6 Dedupe poisoning locks out real people
`existingEmails()` reads all of column C and `appendRow` adds to the cache on
every path — so a `rate-limited` or falsely-`quarantined` row makes that address
**permanently a duplicate**. Every later attempt returns ok with no row and no
email, and the person has no self-service recovery. Exclude non-`subscribed`
statuses from the dedupe set.

### 4.7 `flag-mailing-list-spam.ts` smaller defects
`SCRIPT_OWNED_STATUS` omits `"rate-limited"`, so rows the route itself wrote are
skipped and miscounted as "manually reviewed." Header repair unconditionally
overwrites E1/F1, clobbering any human-added columns. Its duplicate detection
keys on `normalizeEmail`, not `normalizeGmail`, so it misses exactly the
dot-variants the route collapses.

### 4.8 Rate-limit calibration
Fixed windows anchored at first request allow a 2× burst across the boundary.
`SITE_WIDE_DAILY = 100` is **per warm Lambda instance** — leaky as a bot
backstop, and a real cap on a genuinely busy day.

---

## 5. Environment traps

- **`GOOGLE_SHEET_ID` is not set** in `.env.local` *or* on Netlify (verified).
  It was the only var the route read, so the sheet write was a silent no-op from
  the day it shipped — the `Mailing List` tab has never received a row. Current
  code falls back to `ALUMNI_SHEET_ID`
  (`1cWmSuuRv8165i6njtAgm12BGGrqb64dM_DDIKYQkQGU`), where the tab actually
  lives. **Do not "fix" this by setting `GOOGLE_SHEET_ID`.**
- **That tab's grid is 4 columns wide.** Sheets rejects writes past the grid
  edge with `exceeds grid limits` rather than growing it. Widen before writing.
- **Never add a Netlify environment variable.** `CLAUDE.md` records that the
  Lambda env bundle is already against AWS's 4 KB limit and that adding secrets
  there has broken deploys. Use the **Netlify Blobs** pattern —
  `lib/notificationSecrets.ts` is the reference implementation,
  `lib/emailSecrets.ts` the sibling, each with a plain env fallback so local
  `next dev` works off `.env.local`.
- **`normalizeGmail` already exists** in `lib/ownership.ts` and canonicalizes
  dots and `+tags`. Use it everywhere an address is compared or keyed.
- **`npm run check` takes 10+ minutes here.** A scoped `tsconfig` covering only
  touched files typechecks in seconds while iterating — but run the real
  `npm run check` before handing back.
- **`DAT Email Subscribers` is not written by this repo.** Nothing references
  it; `Submitted On | Email Address | Name` is Squarespace's form schema. It is
  a **separate Squarespace pipeline** the owner is handling directly. Out of
  scope — don't chase it.
- **If confirmation flow is chosen:** corporate mail scanners (Outlook ATP and
  similar) fetch every link in inbound mail. Confirming on `GET` means scanners
  auto-confirm on the victim's behalf. The emailed link must land on a **page**
  with a button; the state change happens on `POST`.

---

## 6. Acceptance criteria

- [ ] No real-world name or address in a spot-check set — German, Slovak,
      Armenian, Welsh, Kiswahili, Kichwa, Igbo, Vietnamese, plus `name+birthyear`
      and phone-number Gmail addresses — is quarantined. **Test by executing the
      scorer, not by reading it.**
- [ ] Every rejection path either records a row or is deliberately and visibly
      exempt. No silent, unrecorded loss.
- [ ] A bot forging `X-Forwarded-For` cannot escape per-IP limits.
- [ ] Over-limit traffic cannot cause unbounded Sheets writes.
- [ ] A quarantined or rate-limited address is not permanently locked out.
- [ ] Dot-variants of one Gmail address cannot produce two subscriptions.
- [ ] All three forms show success copy matching whatever flow is chosen.
- [ ] `npm run check` passes. No new Netlify env var.

---

## 7. Out of scope

The Squarespace form and its sheet; remediation for people already mailed.
Ask before touching donations, auth, or Field Kit.

---

## 8. Open question for the owner

`app/events/page.tsx` sends `source: "events-prototype"`, and the DAT inbox
notifications confirm that form is the one currently being hit. If that page is
a prototype that doesn't need to be publicly reachable, **taking it down removes
the vector outright** — cheaper than defending it. Ask before assuming it stays.
