// MOCKUP-ONLY INDEX — /dev/donate-mockups (safe to delete)
import Link from "next/link";

export default function DonateMockupsIndex() {
  return (
    <main className="dm-wrap dm-main">
      <p className="dm-cardKicker font-sans">Internal design exploration</p>
      <h1 className="dm-cardTitle font-anton" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
        /donate mockups
      </h1>
      <p className="dm-storyP font-sans" style={{ marginTop: 10 }}>
        Three visual directions for the donate redesign. All donation cards are locally
        interactive — frequency, amounts, custom amount, and the &ldquo;where it goes&rdquo;
        specificity ladder all work — but no checkout is ever started. Resize the window
        (or use device mode) to review mobile and desktop layouts.
      </p>

      <div className="dm-indexGrid">
        <Link href="/dev/donate-mockups/option-a" className="dm-indexCard">
          <span className="dm-indexKicker font-sans">Option A</span>
          <span className="dm-indexTitle font-anton" style={{ display: "block" }}>
            Conservative cleanup
          </span>
          <span className="dm-indexBody font-sans" style={{ display: "block" }}>
            Keeps the current story-left / donation-rail-right structure, but with one
            clean card, a condensed designation row, and no repeated tier noise.
          </span>
        </Link>

        <Link href="/dev/donate-mockups/option-b" className="dm-indexCard">
          <span className="dm-indexKicker font-sans">Option B</span>
          <span className="dm-indexTitle font-anton" style={{ display: "block" }}>
            Card-first editorial
          </span>
          <span className="dm-indexBody font-sans" style={{ display: "block" }}>
            The donation card is the first object after the hero — especially on mobile.
            Story and impact content follow below. The strongest conversion contender.
          </span>
        </Link>

        <Link href="/dev/donate-mockups/option-c" className="dm-indexCard">
          <span className="dm-indexKicker font-sans">Option C</span>
          <span className="dm-indexTitle font-anton" style={{ display: "block" }}>
            Campaign story / DAT bold
          </span>
          <span className="dm-indexBody font-sans" style={{ display: "block" }}>
            &ldquo;One stage, two materials&rdquo;: dark theatrical canvas over a kraft
            giving field, with the donation card bridging the two — sponsor-pass ticket,
            doorway selector, and a closing quote/trust band.
          </span>
        </Link>
      </div>

      <div className="dm-exploreLabel font-sans" style={{ marginTop: 40 }}>
        Campaign → donate deep-link demo
      </div>
      <p className="dm-storyP font-sans" style={{ marginBottom: 12 }}>
        How a campaign card or campaign page would hand off into the donation card with the
        designation preselected (note the &ldquo;You&rsquo;re supporting&rdquo; state after
        you click through):
      </p>
      <div className="dm-indexGrid" style={{ marginTop: 0 }}>
        <Link href="/dev/donate-mockups/option-b?support=zemplinska" className="dm-campaignCard">
          <span className="dm-campaignKicker font-sans">Campaign card</span>
          <span className="dm-campaignTitle font-anton" style={{ display: "block" }}>
            Zemplínska Teplica Youth Ensemble
          </span>
          <span className="dm-campaignSub font-sans" style={{ display: "block" }}>
            Drama Club · Slovakia
          </span>
          <span className="dm-campaignCtaHint font-sans" style={{ display: "block" }}>
            Sponsor this ensemble →
          </span>
        </Link>

        <Link href="/dev/donate-mockups/option-b?support=ecuador-clubs" className="dm-campaignCard">
          <span className="dm-campaignKicker font-sans">Campaign card</span>
          <span className="dm-campaignTitle font-anton" style={{ display: "block" }}>
            Drama Clubs Across Ecuador
          </span>
          <span className="dm-campaignSub font-sans" style={{ display: "block" }}>
            Country-wide drama club fund
          </span>
          <span className="dm-campaignCtaHint font-sans" style={{ display: "block" }}>
            Sponsor this work →
          </span>
        </Link>

        <Link href="/dev/donate-mockups/option-c?support=youth-creativity" className="dm-campaignCard">
          <span className="dm-campaignKicker font-sans">Cause link</span>
          <span className="dm-campaignTitle font-anton" style={{ display: "block" }}>
            Youth Creativity
          </span>
          <span className="dm-campaignSub font-sans" style={{ display: "block" }}>
            Cause doorway, preselected into Option C
          </span>
          <span className="dm-campaignCtaHint font-sans" style={{ display: "block" }}>
            Stand behind this cause →
          </span>
        </Link>
      </div>
    </main>
  );
}
