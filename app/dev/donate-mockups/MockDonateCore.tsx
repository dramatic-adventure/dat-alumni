"use client";

// ============================================================
// MOCKUP-ONLY COMPONENTS — /dev/donate-mockups
// Local state only. No checkout calls, no Stripe, no DB.
// Safe to delete with the route.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AMOUNTS,
  AREA_FEATURES,
  CAUSES,
  COUNTRIES,
  FEATURED_AMOUNT,
  GREATEST_NEED,
  IMPACT_AREAS,
  SPECIFICS,
  SUPPORT_PRESETS,
  buildRefCode,
  formatUsd,
  type MockDesignation,
} from "./mockData";

export type Frequency = "monthly" | "one_time";

// ---------- shared state ----------

export function useMockDonation(
  defaultFrequency: Frequency = "monthly",
  defaultDesignation: MockDesignation = GREATEST_NEED
) {
  const searchParams = useSearchParams();
  const preset = searchParams.get("support");

  const [frequency, setFrequency] = useState<Frequency>(defaultFrequency);
  const [amountSel, setAmountSel] = useState<number | "custom" | null>(FEATURED_AMOUNT);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [designation, setDesignation] = useState<MockDesignation>(
    (preset && SUPPORT_PRESETS[preset]) || defaultDesignation
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const effectiveAmount = useMemo(() => {
    if (amountSel === "custom") {
      const n = Number(customAmount);
      return Number.isFinite(n) && n >= 1 ? Math.round(n) : null;
    }
    return amountSel;
  }, [amountSel, customAmount]);

  const switchFrequency = useCallback((f: Frequency) => {
    setFrequency(f);
  }, []);

  return {
    frequency,
    switchFrequency,
    amountSel,
    setAmountSel,
    customAmount,
    setCustomAmount,
    effectiveAmount,
    designation,
    setDesignation,
    sheetOpen,
    setSheetOpen,
  };
}

export type MockDonation = ReturnType<typeof useMockDonation>;

// ---------- frequency toggle ----------

export function FrequencyToggle({ d }: { d: MockDonation }) {
  return (
    <div className="dm-freq" role="group" aria-label="Donation frequency">
      <button
        type="button"
        className="dm-freqBtn font-sans"
        aria-pressed={d.frequency === "monthly"}
        onClick={() => d.switchFrequency("monthly")}
      >
        <span className="dm-freqBtnTitle">Monthly</span>
        <span className="dm-freqBtnSub">Sustain the story</span>
      </button>
      <button
        type="button"
        className="dm-freqBtn font-sans"
        aria-pressed={d.frequency === "one_time"}
        onClick={() => d.switchFrequency("one_time")}
      >
        <span className="dm-freqBtnTitle">One-time</span>
        <span className="dm-freqBtnSub">Make an immediate impact</span>
      </button>
    </div>
  );
}

// ---------- amount grid (valid, accessible markup) ----------

export function AmountGrid({ d, idPrefix }: { d: MockDonation; idPrefix: string }) {
  const per = d.frequency === "monthly" ? "/mo" : "";
  const name = `${idPrefix}-amount`;
  const customInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <fieldset className="dm-amountFieldset">
      <legend className="dm-amountLegend">Choose your amount</legend>

      <div className="dm-amountGrid">
        {AMOUNTS.map((a) => {
          const id = `${idPrefix}-amt-${a}`;
          return (
            <span key={a} style={{ position: "relative", display: "block" }}>
              <input
                type="radio"
                className="dm-srRadio"
                name={name}
                id={id}
                value={a}
                checked={d.amountSel === a}
                onChange={() => d.setAmountSel(a)}
              />
              <label className="dm-amountTile" htmlFor={id}>
                {a === FEATURED_AMOUNT ? <span className="dm-popular">Most popular</span> : null}
                <span className="dm-amountValue font-anton">{formatUsd(a)}</span>
                <span className="dm-amountPer font-sans">{per || "once"}</span>
              </label>
            </span>
          );
        })}
      </div>

      <div className="dm-customRow">
        <input
          type="radio"
          className="dm-srRadio"
          name={name}
          id={`${idPrefix}-amt-custom`}
          value="custom"
          checked={d.amountSel === "custom"}
          onChange={() => {
            d.setAmountSel("custom");
            customInputRef.current?.focus();
          }}
        />
        <label className="dm-customCurrency font-sans" htmlFor={`${idPrefix}-custom-input`}>
          $
        </label>
        <input
          ref={customInputRef}
          id={`${idPrefix}-custom-input`}
          className="dm-customInput font-sans"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Custom amount"
          aria-describedby={`${idPrefix}-custom-hint`}
          value={d.customAmount}
          onFocus={() => d.setAmountSel("custom")}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 7);
            d.setCustomAmount(digits);
            d.setAmountSel("custom");
          }}
        />
        <span className="dm-customPer font-sans" aria-hidden="true">
          {per}
        </span>
      </div>
      <p className="dm-hint font-sans" id={`${idPrefix}-custom-hint`}>
        Minimum $1. Enter a whole dollar amount.
      </p>
    </fieldset>
  );
}

// ---------- "you're supporting" header + designation row ----------

export function SupportHeading({ d }: { d: MockDonation }) {
  return (
    <div className="dm-supportRow">
      <div style={{ minWidth: 0 }}>
        <div className="dm-cardKicker font-sans">You&rsquo;re supporting</div>
        <h2 className="dm-cardTitle font-anton">{d.designation.label}</h2>
        {d.designation.sub ? <div className="dm-cardSub font-sans">{d.designation.sub}</div> : null}
      </div>
      <button type="button" className="dm-changeBtn font-sans" onClick={() => d.setSheetOpen(true)}>
        Change
      </button>
    </div>
  );
}

export function DesignationRow({ d }: { d: MockDonation }) {
  return (
    <button
      type="button"
      className="dm-designation"
      onClick={() => d.setSheetOpen(true)}
      aria-haspopup="dialog"
    >
      <span style={{ minWidth: 0 }}>
        <span className="dm-designationLabel font-sans">{d.designation.label}</span>
        {d.designation.sub ? (
          <span className="dm-designationSub font-sans" style={{ display: "block" }}>
            {d.designation.sub}
          </span>
        ) : null}
      </span>
      <span className="dm-designationChev font-sans" aria-hidden="true">
        Change ▾
      </span>
    </button>
  );
}

// ---------- specificity-ladder selector sheet ----------

type SheetView =
  | { type: "root" }
  | { type: "area"; areaId: string }
  | { type: "country"; countryId: string }
  | { type: "causes" }
  | { type: "specific" };

export function SelectorSheet({
  d,
  doorIcons,
}: {
  d: MockDonation;
  doorIcons?: Record<string, ReactNode>;
}) {
  const [view, setView] = useState<SheetView>({ type: "root" });
  const [query, setQuery] = useState("");
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (d.sheetOpen) {
      setView({ type: "root" });
      setQuery("");
      closeRef.current?.focus();
    }
  }, [d.sheetOpen]);

  useEffect(() => {
    if (!d.sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") d.setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [d]);

  if (!d.sheetOpen) return null;

  const apply = (des: MockDesignation) => {
    d.setDesignation(des);
    d.setSheetOpen(false);
  };

  const title =
    view.type === "root"
      ? "Choose where your gift goes"
      : view.type === "causes"
      ? "Support a cause"
      : view.type === "specific"
      ? "Find something specific"
      : view.type === "area"
      ? IMPACT_AREAS.find((a) => a.id === view.areaId)?.label ?? "Programs"
      : COUNTRIES.find((c) => c.id === view.countryId)?.name ?? "Country";

  const back = () => {
    if (view.type === "country") setView({ type: "area", areaId: "drama-club" });
    else setView({ type: "root" });
  };

  const filteredSpecifics = SPECIFICS.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${s.label} ${s.sub ?? ""} ${s.kind}`.toLowerCase().includes(q);
  });

  return (
    <div
      className="dm-sheetOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) d.setSheetOpen(false);
      }}
    >
      <div className="dm-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dm-sheetHead">
          {view.type !== "root" ? (
            <button type="button" className="dm-sheetBack" onClick={back} aria-label="Back">
              ‹
            </button>
          ) : (
            <span aria-hidden="true" style={{ width: 34 }} />
          )}
          <div className="dm-sheetTitle font-anton">{title}</div>
          <button
            ref={closeRef}
            type="button"
            className="dm-sheetClose"
            onClick={() => d.setSheetOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {view.type === "root" ? (
          <>
            <div className="dm-doorGrid">
              <button
                type="button"
                className="dm-door"
                data-active={d.designation.id === GREATEST_NEED.id}
                onClick={() => apply(GREATEST_NEED)}
              >
                {doorIcons?.["greatest-need"] ?? null}
                <span className="dm-doorTitle font-sans">Greatest Need</span>
                <span className="dm-doorBlurb font-sans" style={{ display: "block" }}>
                  Support what&rsquo;s needed most right now
                </span>
              </button>
              {IMPACT_AREAS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="dm-door"
                  onClick={() => setView({ type: "area", areaId: a.id })}
                >
                  {doorIcons?.[a.id] ?? null}
                  <span className="dm-doorTitle font-sans">{a.label}</span>
                  <span className="dm-doorBlurb font-sans" style={{ display: "block" }}>
                    {a.blurb}
                  </span>
                </button>
              ))}
            </div>

            <div className="dm-sheetSectionLabel font-sans">Other ways in</div>
            <button type="button" className="dm-listBtn" onClick={() => setView({ type: "causes" })}>
              <span className="dm-listMain">
                <span className="dm-listTitle font-sans">Support a cause</span>
                <span className="dm-listSub font-sans" style={{ display: "block" }}>
                  Youth creativity, arts education, artist mobility&hellip;
                </span>
              </span>
              <span className="dm-designationChev" aria-hidden="true">
                ›
              </span>
            </button>
            <button type="button" className="dm-listBtn" onClick={() => setView({ type: "specific" })}>
              <span className="dm-listMain">
                <span className="dm-listTitle font-sans">Find something specific</span>
                <span className="dm-listSub font-sans" style={{ display: "block" }}>
                  A drama club, production, campaign, or project
                </span>
              </span>
              <span className="dm-designationChev" aria-hidden="true">
                ›
              </span>
            </button>
          </>
        ) : null}

        {view.type === "area" ? (
          (() => {
            const area = IMPACT_AREAS.find((a) => a.id === view.areaId);
            if (!area) return null;

            const stopDesignation: MockDesignation = {
              id: area.id,
              label: area.desigLabel ?? area.label,
              sub: area.desigSub ?? area.blurb,
              ref: area.ref,
            };

            if (area.id === "drama-club") {
              return (
                <>
                  <div className="dm-sheetSectionLabel font-sans">By country</div>
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="dm-listBtn"
                      onClick={() => setView({ type: "country", countryId: c.id })}
                    >
                      <span className="dm-listMain">
                        <span className="dm-listTitle font-sans">{c.name}</span>
                        <span className="dm-listSub font-sans" style={{ display: "block" }}>
                          {c.clubs.length} {c.clubs.length === 1 ? "ensemble" : "ensembles"}
                        </span>
                      </span>
                      <span className="dm-designationChev" aria-hidden="true">
                        ›
                      </span>
                    </button>
                  ))}
                  <button type="button" className="dm-stopHere font-sans" onClick={() => apply(stopDesignation)}>
                    Give to all Drama Clubs — stop here
                  </button>
                </>
              );
            }

            const related = AREA_FEATURES[area.id] ?? [];

            return (
              <>
                <p className="dm-storyP font-sans" style={{ marginBottom: 8 }}>
                  {area.blurb}.
                </p>
                {related.length ? (
                  <>
                    <div className="dm-sheetSectionLabel font-sans">Featured</div>
                    {related.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="dm-listBtn"
                        data-active={d.designation.id === s.id}
                        onClick={() => apply(s)}
                      >
                        <span className="dm-listMain">
                          <span className="dm-listTitle font-sans">{s.label}</span>
                          {s.sub ? (
                            <span className="dm-listSub font-sans" style={{ display: "block" }}>
                              {s.sub}
                            </span>
                          ) : null}
                        </span>
                        <span className="dm-listTag font-sans">{s.kind}</span>
                      </button>
                    ))}
                  </>
                ) : null}
                <button type="button" className="dm-stopHere font-sans" onClick={() => apply(stopDesignation)}>
                  Give to {stopDesignation.label} — stop here
                </button>
              </>
            );
          })()
        ) : null}

        {view.type === "country" ? (
          (() => {
            const country = COUNTRIES.find((c) => c.id === view.countryId);
            if (!country) return null;
            return (
              <>
                <div className="dm-sheetSectionLabel font-sans">Ensembles in {country.name}</div>
                {country.clubs.map((club) => (
                  <button
                    key={club.id}
                    type="button"
                    className="dm-listBtn"
                    data-active={d.designation.id === club.id}
                    onClick={() => apply(club)}
                  >
                    <span className="dm-listMain">
                      <span className="dm-listTitle font-sans">{club.label}</span>
                      {club.sub ? (
                        <span className="dm-listSub font-sans" style={{ display: "block" }}>
                          {club.sub}
                        </span>
                      ) : null}
                    </span>
                    {club.featured ? <span className="dm-listTag font-sans">Featured</span> : null}
                  </button>
                ))}
                <button
                  type="button"
                  className="dm-stopHere font-sans"
                  onClick={() =>
                    apply({
                      id: `${country.id}-clubs`,
                      label: `Drama Clubs Across ${country.name}`,
                      sub: "Country-wide drama club fund",
                      ref: `DC-${country.id.slice(0, 2).toUpperCase()}`,
                    })
                  }
                >
                  Give to all clubs in {country.name}
                </button>
              </>
            );
          })()
        ) : null}

        {view.type === "causes" ? (
          <>
            {CAUSES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="dm-listBtn"
                data-active={d.designation.id === c.id}
                onClick={() => apply({ id: c.id, label: c.label, sub: "Cause", ref: c.ref })}
              >
                <span className="dm-listMain">
                  <span className="dm-listTitle font-sans">{c.label}</span>
                  <span className="dm-listSub font-sans" style={{ display: "block" }}>
                    {c.blurb}
                  </span>
                </span>
              </button>
            ))}
          </>
        ) : null}

        {view.type === "specific" ? (
          <>
            <input
              className="dm-search font-sans"
              type="search"
              placeholder="Search clubs, productions, campaigns, projects…"
              aria-label="Search for something specific to support"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {filteredSpecifics.map((s) => (
              <button
                key={s.id}
                type="button"
                className="dm-listBtn"
                data-active={d.designation.id === s.id}
                onClick={() => apply(s)}
              >
                <span className="dm-listMain">
                  <span className="dm-listTitle font-sans">{s.label}</span>
                  {s.sub ? (
                    <span className="dm-listSub font-sans" style={{ display: "block" }}>
                      {s.sub}
                    </span>
                  ) : null}
                </span>
                <span className="dm-listTag font-sans">{s.kind}</span>
              </button>
            ))}
            {!filteredSpecifics.length ? (
              <p className="dm-hint font-sans" style={{ marginTop: 12 }}>
                No matches — try a different word, or close and pick a program instead.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ---------- gift ticket summary ----------

export function GiftTicket({ d, blessing }: { d: MockDonation; blessing?: string }) {
  const amountLine =
    d.effectiveAmount != null
      ? d.frequency === "monthly"
        ? `Monthly gift of ${formatUsd(d.effectiveAmount)}`
        : `One-time gift of ${formatUsd(d.effectiveAmount)}`
      : "Choose an amount above";

  return (
    <div className="dm-ticket" aria-label="Your gift summary">
      <div className="dm-ticketSpine font-sans">Your gift summary</div>
      <div className="dm-ticketMain">
        <div className="dm-ticketKicker font-sans">You&rsquo;re sponsoring</div>
        <div className="dm-ticketTitle font-anton">{d.designation.label}</div>
        {d.designation.sub ? <div className="dm-ticketSub font-sans">{d.designation.sub}</div> : null}
        <div className="dm-ticketAmount font-sans">{amountLine}</div>
        {blessing ? <div className="dm-cTicketBless font-sans">{blessing}</div> : null}
      </div>
      <div className="dm-ticketStub">
        <div>
          <div className="dm-ticketRefLabel font-sans">Reference</div>
          <div className="dm-ticketRef font-mono">
            {buildRefCode(d.designation, d.frequency, d.effectiveAmount)}
          </div>
        </div>
        <div className="dm-ticketStamp" aria-hidden="true">
          ✶
        </div>
        <div className="dm-ticketStubKicker font-sans">
          {d.frequency === "monthly" ? "Sustaining sponsorship" : "One-time sponsorship"}
        </div>
      </div>
    </div>
  );
}

// ---------- CTA + trust ----------

export function CtaBlock({ d }: { d: MockDonation }) {
  const [note, setNote] = useState("");

  const label =
    d.effectiveAmount == null
      ? "Choose an amount"
      : d.frequency === "monthly"
      ? `Donate ${formatUsd(d.effectiveAmount)} monthly`
      : `Donate ${formatUsd(d.effectiveAmount)}`;

  return (
    <div>
      <button
        type="button"
        className="dm-cta font-sans"
        disabled={d.effectiveAmount == null}
        onClick={() => setNote("Mockup only — no checkout was started.")}
      >
        {label}
      </button>
      <p className="dm-mockNote font-sans" role="status" aria-live="polite">
        {note}
      </p>
      <p className="dm-trust font-sans">
        🔒 Secure checkout powered by Stripe <em>(disabled in this mockup)</em>.
        <br />
        Dramatic Adventure Theatre is a 501(c)(3) nonprofit. Donations are tax-deductible.
        {d.frequency === "monthly" ? " Cancel monthly gifts anytime." : ""}
      </p>
    </div>
  );
}

// ---------- explore pills ----------

export function ExplorePills() {
  return (
    <div>
      <div className="dm-exploreLabel font-sans">Explore other ways to sponsor the story</div>
      <div className="dm-exploreRow">
        <Link href="/drama-club" className="dm-explorePill font-sans">
          Drama Clubs
        </Link>
        <Link href="/theatre" className="dm-explorePill font-sans">
          Productions
        </Link>
        <Link href="/alumni" className="dm-explorePill font-sans">
          Alumni Artists
        </Link>
        <Link href="/campaign" className="dm-explorePill font-sans">
          Campaigns
        </Link>
        <Link href="/donate" className="dm-explorePill font-sans">
          Current live donate page
        </Link>
      </div>
    </div>
  );
}

// ---------- full donation card (composed) ----------

export function DonationCard({
  d,
  idPrefix,
  showHeading = true,
  ticketBlessing,
}: {
  d: MockDonation;
  idPrefix: string;
  showHeading?: boolean;
  ticketBlessing?: string;
}) {
  return (
    <section className="dm-card" aria-label="Donation card">
      {showHeading ? <SupportHeading d={d} /> : null}

      <div className="dm-stepLabel font-sans">{showHeading ? "1. Choose your gift" : "Choose your gift"}</div>
      <FrequencyToggle d={d} />

      <div style={{ marginTop: 12 }}>
        <AmountGrid d={d} idPrefix={idPrefix} />
      </div>

      <div className="dm-stepLabel font-sans">{showHeading ? "2. Where it goes" : "Where it goes"}</div>
      <DesignationRow d={d} />

      <GiftTicket d={d} blessing={ticketBlessing} />
      <CtaBlock d={d} />
      <SelectorSheet d={d} />
    </section>
  );
}
