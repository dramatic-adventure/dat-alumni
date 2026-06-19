"use client";

// MOCKUP ONLY — Option C v4: DAT system applied (safe to delete)
// Body only — the global site header/footer are assumed around this.
// Visual language derived from app/globals.css + components/donate/donationPage.css.

import { useState } from "react";
import {
  AmountGrid,
  GiftTicket,
  SelectorSheet,
  SupportHeading,
  useMockDonation,
  type MockDonation,
} from "../MockDonateCore";
import { SUPPORT_PRESETS, formatUsd } from "../mockData";

/* ---------- inline line icons (mockup-local, stroke style) ---------- */

function Icon({ d, className, filled }: { d: string; className: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const HEART =
  "M12 20.5c-4.7-3.2-8-6.1-8-9.6C4 8.3 6 6.5 8.4 6.5c1.5 0 2.8.8 3.6 2 .8-1.2 2.1-2 3.6-2C18 6.5 20 8.3 20 10.9c0 3.5-3.3 6.4-8 9.6z";
const LOCK = "M6 11h12v8.5H6zM8.7 11V8.2a3.3 3.3 0 016.6 0V11";
const ARTIST =
  "M11 11a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4zM4.5 20c.7-3.2 3.2-5.2 6.5-5.2s5.8 2 6.5 5.2M17.8 3.2l.55 1.45L19.8 5.2l-1.45.55-.55 1.45-.55-1.45-1.45-.55 1.45-.55z";
const HOUSE = "M4 11l8-7 8 7M6.3 9.4V20h11.4V9.4M10 20v-6h4v6";
const LAYERS = "M12 3l9 5-9 5-9-5zM5 12.6l7 3.9 7-3.9M5 16.6l7 3.9 7-3.9";
const SHIELD = "M12 3l7 2.8v5.4c0 4.6-3 8-7 9.8-4-1.8-7-5.2-7-9.8V5.8zM9 12l2.2 2.2L15.4 10";
const DOLLAR =
  "M12 4v16M16.2 7.2c-.8-1-2.2-1.7-4.2-1.7-2.3 0-4 1.2-4 3s1.6 2.6 4 3c2.6.4 4.3 1.3 4.3 3.2s-1.9 3.1-4.3 3.1c-2.1 0-3.7-.8-4.4-1.9";

function GlobeIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
    </svg>
  );
}

function PeopleIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" />
      <circle cx="16.8" cy="9.5" r="2.5" />
      <path d="M15.6 14.4c2.4.2 4.3 1.8 4.9 4.6" />
    </svg>
  );
}

/* keys match IMPACT_AREAS ids (production sponsor modes) */
const DOOR_ICONS = {
  "greatest-need": <Icon d={HEART} className="dx-doorIcon" />,
  "drama-club": <PeopleIcon className="dx-doorIcon" />,
  "artist": <Icon d={ARTIST} className="dx-doorIcon" />,
  "new-work": <Icon d={LAYERS} className="dx-doorIcon" />,
  "special-project": <Icon d={HOUSE} className="dx-doorIcon" />,
};

/* ---------- card-local pieces ---------- */

function DxFrequency({ d }: { d: MockDonation }) {
  return (
    <div className="dx-freq" role="group" aria-label="Donation frequency">
      <button
        type="button"
        className="dx-freqBtn font-sans"
        aria-pressed={d.frequency === "monthly"}
        onClick={() => d.switchFrequency("monthly")}
      >
        <span className="dx-freqTitle">Monthly</span>
        <span className="dx-freqSub">Sustain the story</span>
      </button>
      <button
        type="button"
        className="dx-freqBtn font-sans"
        aria-pressed={d.frequency === "one_time"}
        onClick={() => d.switchFrequency("one_time")}
      >
        <span className="dx-freqTitle">One-time</span>
        <span className="dx-freqSub">Make an immediate impact</span>
      </button>
    </div>
  );
}

function DxDesignation({ d }: { d: MockDonation }) {
  return (
    <button type="button" className="dx-desig" onClick={() => d.setSheetOpen(true)} aria-haspopup="dialog">
      <span className="dx-desigIcon">
        <GlobeIcon className="" />
      </span>
      <span className="dx-desigMain">
        <span className="dx-desigLabel font-sans">{d.designation.label}</span>
        <span className="dx-desigSub font-sans">
          {d.designation.sub ?? "Or aim your gift at one part of the story"}
        </span>
      </span>
      <span className="dx-desigChev font-sans">Change ▾</span>
    </button>
  );
}

function DxCta({ d }: { d: MockDonation }) {
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
        className="dx-cta font-sans"
        disabled={d.effectiveAmount == null}
        onClick={() => setNote("Mockup only — no checkout was started.")}
      >
        <Icon d={HEART} className="dx-ctaIcon" filled />
        {label}
      </button>
      <p className="dm-mockNote font-sans" role="status" aria-live="polite">
        {note}
      </p>
      <p className="dx-secure font-sans">
        <Icon d={LOCK} className="dx-secureIcon" />
        Secure checkout powered by Stripe
      </p>
      <p className="dx-trust font-sans">
        <Icon d={HEART} className="dx-trustHeart" filled />
        <span>
          Dramatic Adventure Theatre is a 501(c)(3) nonprofit. Donations are
          tax-deductible. Cancel monthly gifts anytime.
        </span>
      </p>
    </div>
  );
}

/* designation-aware confirmation line for the pass */
function blessingFor(designationId: string): string {
  if (designationId === "zemplinska") {
    return "You're keeping the lights on in their rehearsal room.";
  }
  if (designationId === "ecuador-clubs") {
    return "You're backing every young ensemble in Ecuador at once.";
  }
  if (designationId === "greatest-need") {
    return "You're trusting the story to go where it's needed most.";
  }
  return "Thank you for standing behind this part of the story.";
}

/* ---------- page body ---------- */

export default function OptionC() {
  const d = useMockDonation("monthly", SUPPORT_PRESETS["zemplinska"]);

  return (
    <div className="dx">
      <div className="dx-stage">
        <div className="dm-wrap">
          <div className="dx-grid">
            {/* LEFT — the performance, then the ground it stands on */}
            <div>
              <div className="dx-heroCol">
                <p className="dx-eyebrow">Fund moments, not maintenance.</p>
                <h1 className="dx-title font-anton">
                  Sponsor
                  <br />
                  the Story
                </h1>
                <p className="dx-heroBody font-sans">
                  Your gift powers transformative theatre and real impact in communities
                  around the world.
                </p>
              </div>

              <div className="dx-ground">
                <div className="dx-proofRow">
                  <div className="dx-proof">
                    <div className="dx-proofTitle font-sans">The ensembles</div>
                    <p className="dx-proofBody font-sans">
                      Youth drama clubs where kids who started as audience members now
                      write the plays.
                    </p>
                  </div>
                  <div className="dx-proof">
                    <div className="dx-proofTitle font-sans">The artists</div>
                    <p className="dx-proofBody font-sans">
                      Teaching artists trained, employed, and sent where the stories live.
                    </p>
                  </div>
                  <div className="dx-proof">
                    <div className="dx-proofTitle font-sans">The work</div>
                    <p className="dx-proofBody font-sans">
                      Original theatre built from fieldwork — performed first for the town
                      it came from.
                    </p>
                  </div>
                </div>

                <div className="dx-storyRow">
                  <div className="dx-storyImgWrap">
                    <img
                      src="/images/donate/body-drama-club.jpg"
                      alt="Young performers rehearsing with a DAT teaching artist"
                    />
                    <span className="dx-storyCap font-sans">Zemplínska Teplica · Slovakia</span>
                  </div>
                  <div>
                    <h2 className="dx-storyTitle font-anton">Step into a living story</h2>
                    <p className="dx-storyP font-sans">
                      In Zemplínska Teplica, a village of two thousand, the youth ensemble
                      rehearses every week in a borrowed room — and performs for the whole
                      town. A monthly gift keeps that room theirs. Give broadly, or stand
                      behind the exact part of the story that moves you.
                    </p>
                  </div>
                </div>

                <div className="dx-exploreLabel font-sans">Follow the story</div>
                <div className="dx-exploreRow">
                  <a className="dx-explorePill font-sans" href="/campaign">
                    Campaigns <span aria-hidden="true">→</span>
                  </a>
                  <a className="dx-explorePill font-sans" href="/drama-club">
                    Drama clubs <span aria-hidden="true">→</span>
                  </a>
                  <a className="dx-explorePill font-sans" href="/theatre">
                    Productions <span aria-hidden="true">→</span>
                  </a>
                  <a className="dx-explorePill font-sans" href="/alumni">
                    Artists <span aria-hidden="true">→</span>
                  </a>
                  <a className="dx-explorePill font-sans" href="/donate">
                    Live donate page <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT — the donation card, bridging dark and kraft */}
            <div className="dx-cardCol">
              <section className="dx-card" aria-label="Donation card">
                <SupportHeading d={d} />

                <div className="dx-step font-sans">1. Choose your gift</div>
                <DxFrequency d={d} />
                <div style={{ marginTop: 12 }}>
                  <AmountGrid d={d} idPrefix="dm-c" />
                </div>

                <div className="dx-step font-sans">2. Where it goes</div>
                <DxDesignation d={d} />

                <GiftTicket d={d} blessing={blessingFor(d.designation.id)} />
                <DxCta d={d} />
                <SelectorSheet d={d} doorIcons={DOOR_ICONS} />
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* closing band */}
      <section className="dx-band" aria-label="Trust">
        <div className="dx-bandInner">
          <div>
            <p className="dx-bandQuote font-serif">
              Theatre is not a luxury. It&rsquo;s a lifeline.&rdquo;
            </p>
            <p className="dx-bandAttr font-sans">— Dramatic Adventure Theatre</p>
          </div>
          <div className="dx-bandTrust font-sans">
            <div className="dx-bandItem">
              <Icon d={SHIELD} className="dx-bandIcon" />
              <div>
                <strong>501(c)(3)</strong>
                <span>Tax-deductible</span>
              </div>
            </div>
            <div className="dx-bandItem">
              <Icon d={LOCK} className="dx-bandIcon" />
              <div>
                <strong>Secure checkout</strong>
                <span>Encrypted end to end</span>
              </div>
            </div>
            <div className="dx-bandItem">
              <Icon d={DOLLAR} className="dx-bandIcon" />
              <div>
                <strong>Powered by Stripe</strong>
                <span>Cancel monthly anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
