"use client";

// MOCKUP ONLY — Option A: Conservative cleanup (safe to delete)

import { DonationCard, ExplorePills, useMockDonation } from "../MockDonateCore";

export default function OptionA() {
  const d = useMockDonation("monthly");

  return (
    <>
      <header className="dm-hero dm-hero--band">
        <img src="/images/donate/hero-general.jpg" alt="" className="dm-heroImg" />
        <div className="dm-heroShade" />
        <div className="dm-heroInner">
          <p className="dm-heroEyebrow font-sans">Dramatic Adventure Theatre</p>
          <h1 className="dm-heroTitle font-anton">Sponsor the Story</h1>
          <p className="dm-heroBody font-sans">
            Where a child claims their voice, an artist discovers their purpose, and an
            audience finds new meaning.
          </p>
        </div>
      </header>

      <main className="dm-wrap dm-main">
        <a href="#dm-a-card" className="dm-changeBtn font-sans" style={{ display: "inline-block", marginBottom: 10 }}>
          Skip to donation ↓
        </a>

        <section style={{ textAlign: "center", margin: "8px 0 26px" }} aria-label="Current focus">
          <p className="dm-cardKicker font-sans">You&rsquo;re supporting</p>
          <h2 className="dm-cardTitle font-anton" style={{ fontSize: "clamp(1.7rem,3.5vw,2.6rem)" }}>
            {d.designation.label}
          </h2>
          {d.designation.sub ? <p className="dm-cardSub font-sans">{d.designation.sub}</p> : null}
          <button type="button" className="dm-changeBtn font-sans" onClick={() => d.setSheetOpen(true)}>
            Change where your gift goes
          </button>
        </section>

        <div className="dm-twoCol">
          <div className="dm-colStory dm-story">
            <img src="/images/donate/body-general.jpg" alt="DAT artists and youth performing together" className="dm-storyImg" />
            <h3 className="dm-storyTitle font-anton">Fund moments, not maintenance.</h3>
            <p className="dm-storyP font-sans">
              Your gift powers transformative theatre and real impact in communities around
              the world — youth ensembles, traveling artists, original productions, and the
              local partners who make the work possible.
            </p>
            <div className="dm-proofGrid">
              <div className="dm-proof">
                <div className="dm-proofTitle font-sans">Global impact</div>
                <p className="dm-proofBody font-sans">Your gift fuels local artistry and education in communities worldwide.</p>
              </div>
              <div className="dm-proof">
                <div className="dm-proofTitle font-sans">Artists empowered</div>
                <p className="dm-proofBody font-sans">We train, employ, and collaborate with emerging artists on the ground.</p>
              </div>
              <div className="dm-proof">
                <div className="dm-proofTitle font-sans">Stories that matter</div>
                <p className="dm-proofBody font-sans">Bold, original theatre that sparks dialogue and drives change.</p>
              </div>
            </div>
            <ExplorePills />
          </div>

          <div className="dm-colCard">
            <div className="dm-sticky" id="dm-a-card">
              <DonationCard d={d} idPrefix="dm-a" showHeading={false} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
