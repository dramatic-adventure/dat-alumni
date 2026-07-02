// lib/companyChoice.ts
//
// Slice 5 (Field Ops) — the Company Choice store. Mirrors lib/rallyPoint.ts /
// lib/rollCall.ts: Sheet-tab-backed, header-keyed, withRetry + idxOf/normId,
// never-throws-on-read. Two tabs in ALUMNI_SHEET_ID:
//
//   "Field Kit Company Choice"        id, programId, question, choices,
//                                     deadline, resultsVisibility, outcome,
//                                     postedAt, closedAt
//   "Field Kit Company Choice Votes"  choiceSetId, alumniSlug, selection, votedAt
//
// ONE ACTIVE QUESTION AT A TIME (latest postedAt wins — the Rally Point
// pattern); older rows stay in the Sheet as the record. Results visibility is
// PER QUESTION (Jesse, 2026-07-02): "private" (staff/leaders only, always),
// "public" (full breakdown to artists once closed), "result-only" (announced
// outcome to artists once closed, no breakdown). Live tallies are never
// artist-visible in any mode. `outcome` is an optional staff override for the
// announced result; blank means the top-voted choice.
//
// Votes UPSERT by (choiceSetId, alumniSlug) — one vote per artist, changeable
// while open, and naturally idempotent under the offline queue's at-least-once
// retries.

import "server-only";
import { sheetsClient } from "@/lib/googleClients";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";
import type { CompanyChoiceState, CompanyChoiceVisibility } from "@/lib/programItinerary";

const TAB = "Field Kit Company Choice";
const RANGE = `'${TAB}'!A:I`;
export const COMPANY_CHOICE_HEADERS = [
  "id", "programId", "question", "choices", "deadline",
  "resultsVisibility", "outcome", "postedAt", "closedAt",
] as const;

const VOTE_TAB = "Field Kit Company Choice Votes";
const VOTE_RANGE = `'${VOTE_TAB}'!A:D`;
export const COMPANY_CHOICE_VOTE_HEADERS = ["choiceSetId", "alumniSlug", "selection", "votedAt"] as const;

/** The raw row, before artist-safe shaping (includes visibility + outcome as stored). */
export type CompanyChoiceRow = {
  id: string;
  programId: string;
  question: string;
  choices: string[];
  deadline: string;
  resultsVisibility: CompanyChoiceVisibility;
  outcome: string;
  postedAt: string;
  closedAt: string;
};

export type CompanyChoiceVote = {
  choiceSetId: string;
  alumniSlug: string;
  selection: string;
  votedAt: string;
};

function spreadsheetId(): string {
  const id = process.env.ALUMNI_SHEET_ID;
  if (!id) throw new Error("Missing ALUMNI_SHEET_ID");
  return id;
}

type Grid = {
  sheets: ReturnType<typeof sheetsClient>;
  header: string[];
  rows: string[][];
};

async function readGrid(range: string, fallback: readonly string[], label: string): Promise<Grid> {
  const sheets = sheetsClient();
  const res = await withRetry(
    () => sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range }),
    label
  );
  const rows = (res.data.values ?? []) as string[][];
  const header = rows[0]?.length ? rows[0] : [...fallback];
  return { sheets, header, rows };
}

function columns(header: string[]) {
  return {
    id: idxOf(header, ["id"]),
    programId: idxOf(header, ["programid"]),
    question: idxOf(header, ["question"]),
    choices: idxOf(header, ["choices"]),
    deadline: idxOf(header, ["deadline"]),
    resultsVisibility: idxOf(header, ["resultsvisibility", "results visibility", "visibility"]),
    outcome: idxOf(header, ["outcome"]),
    postedAt: idxOf(header, ["postedat", "posted at"]),
    closedAt: idxOf(header, ["closedat", "closed at"]),
  };
}

function voteColumns(header: string[]) {
  return {
    choiceSetId: idxOf(header, ["choicesetid", "choice set id"]),
    alumniSlug: idxOf(header, ["alumnislug", "alumni slug"]),
    selection: idxOf(header, ["selection"]),
    votedAt: idxOf(header, ["votedat", "voted at"]),
  };
}

export function coerceVisibility(v: unknown): CompanyChoiceVisibility {
  const s = normId(v);
  if (s === "public") return "public";
  if (s === "result-only" || s === "result only" || s === "resultonly") return "result-only";
  return "private"; // the default Jesse chose — never accidentally widen
}

/** Split the delimited choices cell on pipes or newlines; trims + drops blanks. */
function splitChoices(raw: string): string[] {
  return String(raw ?? "")
    .split(/[\n|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function rowToChoice(header: string[], row: string[]): CompanyChoiceRow {
  const c = columns(header);
  return {
    id: String(row[c.id] ?? "").trim(),
    programId: String(row[c.programId] ?? "").trim(),
    question: String(row[c.question] ?? "").trim(),
    choices: splitChoices(String(row[c.choices] ?? "")),
    deadline: String(row[c.deadline] ?? "").trim(),
    resultsVisibility: coerceVisibility(row[c.resultsVisibility]),
    outcome: String(row[c.outcome] ?? "").trim(),
    postedAt: String(row[c.postedAt] ?? "").trim(),
    closedAt: String(row[c.closedAt] ?? "").trim(),
  };
}

export function newChoiceSetId(): string {
  return `cc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The CURRENT company choice for a program — latest row by postedAt (open or
 * closed). Never throws; null on any read failure so the itinerary load is
 * unaffected.
 */
export async function getCurrentCompanyChoice(programId: string): Promise<CompanyChoiceRow | null> {
  try {
    const pid = normId(programId);
    if (!pid) return null;
    const { header, rows } = await readGrid(RANGE, COMPANY_CHOICE_HEADERS, "Sheets get Field Kit Company Choice");
    const c = columns(header);
    if (c.programId === -1 || c.id === -1) return null;
    let latest: CompanyChoiceRow | null = null;
    for (let i = 1; i < rows.length; i++) {
      if (normId(rows[i]?.[c.programId]) !== pid) continue;
      const row = rowToChoice(header, rows[i]);
      if (!row.id || !row.question) continue;
      if (!latest || row.postedAt.localeCompare(latest.postedAt) > 0) latest = row;
    }
    return latest;
  } catch (err) {
    console.warn("[companyChoice] read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * One question by id (program-scoped). Never throws — null when absent. Used
 * by the vote route to validate queued votes against the exact question they
 * were cast for (not whatever is current by the time the queue drains).
 */
export async function getCompanyChoiceById(
  programId: string,
  choiceSetId: string
): Promise<CompanyChoiceRow | null> {
  try {
    const pid = normId(programId);
    const want = normId(choiceSetId);
    if (!pid || !want) return null;
    const { header, rows } = await readGrid(RANGE, COMPANY_CHOICE_HEADERS, "Sheets get Field Kit Company Choice");
    const c = columns(header);
    if (c.programId === -1 || c.id === -1) return null;
    for (let i = 1; i < rows.length; i++) {
      if (normId(rows[i]?.[c.id]) !== want) continue;
      if (normId(rows[i]?.[c.programId]) !== pid) continue;
      return rowToChoice(header, rows[i]);
    }
    return null;
  } catch (err) {
    console.warn("[companyChoice] read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Post a new question (becomes the current one — latest wins). */
export async function postCompanyChoice(
  programId: string,
  input: {
    question: string;
    choices: string[];
    deadline: string;
    resultsVisibility: CompanyChoiceVisibility;
  }
): Promise<CompanyChoiceRow> {
  const { sheets, header, rows } = await readGrid(RANGE, COMPANY_CHOICE_HEADERS, "Sheets get Field Kit Company Choice");
  if (!rows.length) throw new Error(`${TAB} has no header row`);
  const c = columns(header);
  if (c.id === -1 || c.programId === -1) throw new Error(`${TAB} missing "id"/"programId" header`);

  const row: CompanyChoiceRow = {
    id: newChoiceSetId(),
    programId,
    question: input.question.trim(),
    choices: input.choices.map((s) => s.trim()).filter(Boolean),
    deadline: input.deadline.trim(),
    resultsVisibility: input.resultsVisibility,
    outcome: "",
    postedAt: new Date().toISOString(),
    closedAt: "",
  };

  const out: string[] = Array(header.length).fill("");
  const put = (i: number, v: string) => {
    if (i !== -1) out[i] = v;
  };
  put(c.id, row.id);
  put(c.programId, row.programId);
  put(c.question, row.question);
  put(c.choices, row.choices.join(" | "));
  put(c.deadline, row.deadline);
  put(c.resultsVisibility, row.resultsVisibility);
  put(c.outcome, "");
  put(c.postedAt, row.postedAt);
  put(c.closedAt, "");

  await withRetry(
    () =>
      sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId(),
        range: RANGE,
        valueInputOption: "RAW",
        requestBody: { values: [out] },
      }),
    "Sheets append Field Kit Company Choice"
  );
  return row;
}

/**
 * Close a question (stamps closedAt; optionally records the announced outcome
 * override). Returns the updated row, or null if the id isn't found.
 */
export async function closeCompanyChoice(
  programId: string,
  choiceSetId: string,
  outcome?: string
): Promise<CompanyChoiceRow | null> {
  const { sheets, header, rows } = await readGrid(RANGE, COMPANY_CHOICE_HEADERS, "Sheets get Field Kit Company Choice");
  const c = columns(header);
  if (c.id === -1 || c.closedAt === -1) throw new Error(`${TAB} missing "id"/"closedAt" header`);
  const pid = normId(programId);
  const want = normId(choiceSetId);
  for (let i = 1; i < rows.length; i++) {
    if (normId(rows[i]?.[c.id]) !== want) continue;
    if (c.programId !== -1 && normId(rows[i]?.[c.programId]) !== pid) continue;

    const closedAt = new Date().toISOString();
    const updated = [...(rows[i] ?? [])];
    while (updated.length < header.length) updated.push("");
    updated[c.closedAt] = closedAt;
    if (outcome !== undefined && c.outcome !== -1) updated[c.outcome] = outcome.trim();

    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId(),
          range: `'${TAB}'!A${i + 1}:I${i + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [updated] },
        }),
      "Sheets close Field Kit Company Choice"
    );
    return rowToChoice(header, updated);
  }
  return null;
}

/* ── Votes ──────────────────────────────────────────────────────────────────── */

// Short cross-request TTL cache — same rationale as rollCall's responses cache.
const VOTES_TTL_MS = Number(process.env.FIELD_KIT_OPS_TTL_MS || 15_000);
let _voteCache: { at: number; rows: CompanyChoiceVote[] } | null = null;

async function readAllVotes(): Promise<CompanyChoiceVote[]> {
  const now = Date.now();
  if (_voteCache && now - _voteCache.at < VOTES_TTL_MS) return _voteCache.rows;
  const { header, rows } = await readGrid(
    VOTE_RANGE,
    COMPANY_CHOICE_VOTE_HEADERS,
    "Sheets get Field Kit Company Choice Votes"
  );
  const c = voteColumns(header);
  // Dedupe by (choiceSetId, alumniSlug), keeping the LATEST votedAt — same
  // rationale as readAllResponses in lib/rollCall.ts: concurrent first-time
  // upserts can append duplicate rows, and one voter must never count twice.
  const latest = new Map<string, CompanyChoiceVote>();
  if (c.choiceSetId !== -1 && c.alumniSlug !== -1) {
    for (let i = 1; i < rows.length; i++) {
      const choiceSetId = String(rows[i]?.[c.choiceSetId] ?? "").trim();
      const alumniSlug = normId(rows[i]?.[c.alumniSlug]);
      const selection = String(rows[i]?.[c.selection] ?? "").trim();
      if (!choiceSetId || !alumniSlug || !selection) continue;
      const vote: CompanyChoiceVote = {
        choiceSetId,
        alumniSlug,
        selection,
        votedAt: String(rows[i]?.[c.votedAt] ?? "").trim(),
      };
      const key = `${normId(choiceSetId)}::${alumniSlug}`;
      const prev = latest.get(key);
      if (!prev || vote.votedAt.localeCompare(prev.votedAt) >= 0) latest.set(key, vote);
    }
  }
  const out = Array.from(latest.values());
  _voteCache = { at: now, rows: out };
  return out;
}

/** Every vote for one question. Never throws — [] on any read failure. */
export async function getCompanyChoiceVotes(choiceSetId: string): Promise<CompanyChoiceVote[]> {
  try {
    const want = normId(choiceSetId);
    if (!want) return [];
    return (await readAllVotes()).filter((v) => normId(v.choiceSetId) === want);
  } catch (err) {
    console.warn("[companyChoice] votes read failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/** Per-choice tallies for one question, in the question's choice order. */
export function tallyVotes(
  choices: string[],
  votes: CompanyChoiceVote[]
): { choice: string; votes: number }[] {
  return choices.map((choice) => ({
    choice,
    votes: votes.filter((v) => normId(v.selection) === normId(choice)).length,
  }));
}

/** The announced result: the staff outcome override when set, else the top-voted choice. */
export function resolveOutcome(row: CompanyChoiceRow, votes: CompanyChoiceVote[]): string {
  if (row.outcome) return row.outcome;
  const tallies = tallyVotes(row.choices, votes);
  const top = [...tallies].sort((a, b) => b.votes - a.votes)[0];
  return top && top.votes > 0 ? top.choice : "";
}

/** Upsert one artist's vote, keyed by (choiceSetId, alumniSlug) — latest wins. */
export async function upsertCompanyChoiceVote(input: {
  choiceSetId: string;
  alumniSlug: string;
  selection: string;
  votedAt?: string;
}): Promise<void> {
  const { sheets, header, rows } = await readGrid(
    VOTE_RANGE,
    COMPANY_CHOICE_VOTE_HEADERS,
    "Sheets get Field Kit Company Choice Votes"
  );
  if (!rows.length) throw new Error(`${VOTE_TAB} has no header row`);
  const c = voteColumns(header);
  if (c.choiceSetId === -1 || c.alumniSlug === -1) {
    throw new Error(`${VOTE_TAB} missing "choiceSetId"/"alumniSlug" header`);
  }

  const wantSet = normId(input.choiceSetId);
  const wantSlug = normId(input.alumniSlug);
  let foundIndex = -1;
  let previousAt = "";
  for (let i = 1; i < rows.length; i++) {
    if (normId(rows[i]?.[c.choiceSetId]) === wantSet && normId(rows[i]?.[c.alumniSlug]) === wantSlug) {
      foundIndex = i;
      previousAt = String(rows[i]?.[c.votedAt] ?? "").trim();
      break;
    }
  }

  // STALE-WRITE GUARD — same as lib/rollCall.ts: the offline queue's backoff
  // can deliver an OLDER changed-vote after a newer one; never let it win.
  const incomingAt = input.votedAt || new Date().toISOString();
  if (foundIndex !== -1 && previousAt && previousAt.localeCompare(incomingAt) > 0) {
    return;
  }

  const out: string[] = Array(header.length).fill("");
  const put = (i: number, v: string) => {
    if (i !== -1) out[i] = v;
  };
  put(c.choiceSetId, input.choiceSetId);
  put(c.alumniSlug, wantSlug);
  put(c.selection, input.selection.trim());
  put(c.votedAt, incomingAt);

  if (foundIndex !== -1) {
    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId(),
          range: `'${VOTE_TAB}'!A${foundIndex + 1}:D${foundIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [out] },
        }),
      "Sheets update Field Kit Company Choice Votes"
    );
  } else {
    await withRetry(
      () =>
        sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheetId(),
          range: VOTE_RANGE,
          valueInputOption: "RAW",
          requestBody: { values: [out] },
        }),
      "Sheets append Field Kit Company Choice Votes"
    );
  }

  _voteCache = null; // the next read sees this write
}

/**
 * Shape a raw row into the ARTIST-SAFE payload state attached to the itinerary
 * (lib/loadProgram.ts). Live tallies never enter this shape; results appear only
 * once closed, per the question's visibility. Pure — the votes read happens in
 * the caller only when the question is closed.
 */
export function toPublicCompanyChoice(
  row: CompanyChoiceRow,
  votesWhenClosed: CompanyChoiceVote[] | null
): CompanyChoiceState {
  const closed = !!row.closedAt;
  const state: CompanyChoiceState = {
    id: row.id,
    question: row.question,
    choices: row.choices,
    deadline: row.deadline,
    resultsVisibility: row.resultsVisibility,
    postedAt: row.postedAt,
    closedAt: row.closedAt,
  };
  if (closed && votesWhenClosed && row.resultsVisibility !== "private") {
    const outcome = resolveOutcome(row, votesWhenClosed);
    if (outcome) state.outcome = outcome;
    if (row.resultsVisibility === "public") {
      state.results = tallyVotes(row.choices, votesWhenClosed);
    }
  }
  return state;
}
