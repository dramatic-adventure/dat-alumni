"use client";

// MOCKUP ONLY — Option B: Card-first editorial (safe to delete)

import { DonationCard, ExplorePills, useMockDonation } from "../MockDonateCore";

export default function OptionB() {
  const d = useMockDonation("monthly");

  return (
    <>
      <header className="dm-hero dm-hero--band">
        <img src="/images/donate/hero-drama-club.jpg" alt="" className="dm-heroImg" />
        <div className="dm-heroShade" />
        <div className="dm-heroInner">
          <p className="dm-heroEyebrow font-handwriting" style={{ textTransform: "none", letterSpacing: 0 }}>
            Fund moments, not maintenance.
          </p>
          <h1 className="dm-heroTitle font-anton">Sponsor the Story</h1>
          <p className="dm-heroBody font-sans">
            Your gift powers transformative theatre and real impact in communities around
            the world.
          </p>
        </div>
      </header>

      <main className="dm-wrap dm-main">
        <div className="dm-twoCol dm-twoCol--cardFirst">
          <div className="dm-colCard">
            <div className="dm-sticky">
              <DonationCard d={d} idPrefix="dm-b" />
            </div>
          </div>

          <div className="dm-colStory dm-story">
            <img
              src="/images/donate/body-drama-club.jpg"
              alt="Youth ensemble members rehearsing"
              className="dm-storyImg"
            />
            <h3 className="dm-storyTitle font-anton">Why it matters</h3>
            <p className="dm-storyP font-sans">
              Dramatic Adventure Theatre builds youth drama clubs, sends artists into the
              field, and creates original work born from real places and real people. When
              you sponsor the story, you decide which part of that work you stand behind —
              or simply trust it where it&rsquo;s needed most.
            </p>
            <div className="dm-proofGrid">
              <div className="dm-proof">
                <div className="dm-proofTitle font-sans">Global impact</div>
                <p className="dm-proofBody font-sans">
                  Drama clubs and partnerships across Ecuador, Slovakia, Tanzania, Zimbabwe, and beyond.
                </p>
              </div>
              <div className="dm-proof">
                <div className="dm-proofTitle font-sans">Artists empowered</div>
                <p className="dm-proofBody font-sans">
                  Training, employment, and field experience for emerging artists on the ground.
                </p>
              </div>
              <div className="dm-proof">
                <div className="dm-proofTitle font-sans">Stories that matter</div>
                <p className="dm-proofBody font-sans">
                  Bold original theatre that sparks dialogue and drives change at home and abroad.
                </p>
              </div>
            </div>
            <ExplorePills />
          </div>
        </div>
      </main>
    </>
  );
}
