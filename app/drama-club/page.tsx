// app/drama-club/page.tsx
import Image from "next/image";
import Link from "next/link";

import { dramaClubs } from "@/lib/dramaClubMap";
import type { DramaClub } from "@/lib/dramaClubMap";

import StatsStrip from "@/components/shared/StatsStrip";
import JoinTheJourneyPanel from "@/components/shared/JoinTheJourneyPanel";
import {
  computeDramaClubStatus,
  type DramaClubStatus,
} from "@/lib/dramaClubStatus";
import { DATButtonLink } from "@/components/ui/DATButton";
import DramaClubRootsSidebar from "@/components/drama/DramaClubRootsSidebar";
import DramaClubIndexShell from "@/components/drama/DramaClubIndexShell";

export const revalidate = 3600;

export const metadata = {
  title: "Drama Clubs | Dramatic Adventure Theatre",
  description:
    "Drama Clubs are where young artists find their voices, communities shape their own stories, and DAT’s work continues long after the plane ride home.",
};

// Shared ordering for this page
const statusOrder: Record<DramaClubStatus, number> = {
  new: 0,
  ongoing: 1,
  legacy: 2,
};

export default function DramaClubIndexPage() {
  const nowYear = new Date().getFullYear();
  const yearsOfImpact = nowYear - 2006; // DAT founded in 2006

  // ---------- Sort by status → country → name ----------
  const sortedClubs: DramaClub[] = [...dramaClubs].sort((a, b) => {
    const aStatus: DramaClubStatus = computeDramaClubStatus(a);
    const bStatus: DramaClubStatus = computeDramaClubStatus(b);

    const statusDiff = statusOrder[aStatus] - statusOrder[bStatus];
    if (statusDiff !== 0) return statusDiff;

    const aCountry = a.country ?? "";
    const bCountry = b.country ?? "";
    const countryDiff = aCountry.localeCompare(bCountry);
    if (countryDiff !== 0) return countryDiff;

    const aName = a.name ?? "";
    const bName = b.name ?? "";
    return aName.localeCompare(bName);
  });

  // ---------- Status counts for filters ----------
  const statusCounts: Record<DramaClubStatus, number> = {
    new: 0,
    ongoing: 0,
    legacy: 0,
  };

  sortedClubs.forEach((club) => {
    const status = computeDramaClubStatus(club);
    statusCounts[status] += 1;
  });

  // ---------- Stats base values ----------
  const totalYouth = sortedClubs.reduce(
    (sum, club) => sum + (club.approxYouthServed ?? 0),
    0
  );
  const totalShowcases = sortedClubs.reduce(
    (sum, club) => sum + (club.showcasesCount ?? 0),
    0
  );
  const countryCount = new Set(sortedClubs.map((c) => c.country)).size;

  // ---------- Multi-year communities (3+ years) ----------
  const multiYearCommunities = new Set<string>();

  sortedClubs.forEach((club) => {
    const firstYear =
      typeof club.firstYearActive === "number"
        ? club.firstYearActive
        : nowYear;

    let lastYear: number;
    if (club.lastYearActive === "present") {
      lastYear = nowYear;
    } else if (typeof club.lastYearActive === "number") {
      lastYear = club.lastYearActive;
    } else {
      lastYear = firstYear;
    }

    // 3+ years of activity → lastYear - firstYear >= 2
    if (lastYear - firstYear >= 2) {
      const fallbackLocation = [club.city, club.region, club.country]
        .filter(Boolean)
        .join(" • ");

      const key =
        (club as any).communityKey ?? (fallbackLocation || club.name);

      multiYearCommunities.add(key);
    }
  });

  const multiYearCommunitiesCount = multiYearCommunities.size;

  // ---------- Final stats (6) ----------
  const dramaStats = [
    {
      value: totalYouth,
      label: "Youth Reached",
      subLabel: "through Drama Clubs",
    },
    {
      value: totalShowcases,
      label: "Community Performances",
      subLabel: "original showcases & sharings",
    },
    {
      value: sortedClubs.length,
      label: "Drama Clubs",
      subLabel: "created with local partners",
    },
    {
      value: countryCount,
      label: "Countries",
      subLabel: "hosting Drama Clubs",
    },
    {
      value: yearsOfImpact,
      label: "Years of Drama Club Work",
      subLabel: "since October 21, 2006",
    },
    {
      value: multiYearCommunitiesCount,
      label: "Long-Term Partner Communities",
      subLabel: "with 3+ years of clubs",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: 'url("/texture/kraft-paper.png")',
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundRepeat: "repeat",
      }}
    >
      <main className="min-h-screen">
        <style>{`
  /* 📸 Drama Club photo splay sizing */
  .drama-photo-splay-wrapper {
    display: flex;
    justify-content: center;
  }

  .drama-photo-splay {
    transform-origin: top center;
  }

  @media (min-width: 576px) {
    .drama-photo-splay {
      transform: scale(0.8);
    }
  }

  /* 🎭 Shared 2-column layout (Section 2 + Supporting section) */
  .drama-club-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr); /* single column by default */
    gap: 1.75rem; /* vertical + horizontal spacing */
  }

  @media (min-width: 1024px) {
    .drama-club-layout {
      grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
      align-items: flex-start;
    }
  }

  /* =========================
     HOW A DRAMA CLUB TAKES ROOT
     Width + centering controls
  ========================== */

  .drama-roots-section {
    padding: 3rem 0;
  }

  @media (min-width: 768px) {
    .drama-roots-section {
      padding: 4rem 0;
    }
  }

  .drama-roots-container {
    width: 90vw;
    max-width: 72rem; /* ~1152px, tweak if needed */
    margin: 0 auto;
    display: flex;
    justify-content: center;
  }

  .drama-roots-wrapper {
    width: 100%;       /* full width on mobile/tablet */
    max-width: 980px;  /* hard cap so it never gets huge */
  }

  @media (min-width: 1024px) {
    .drama-roots-wrapper {
      width: 65%;      /* ← PLAY WITH THIS PERCENTAGE */
    }
  }
`}</style>


        {/* =========================
            HERO
        ========================== */}
        <section
          style={{
            position: "relative",
            width: "100%",
            height: "75vh",
            boxShadow: "0px 0px 33px rgba(0, 0, 0, 0.5)",
          }}
        >
          <Image
            src="/images/drama-clubs/club-fallback.jpg"
            alt="Young artists performing in a Drama Club showcase."
            fill
            priority
            className="object-cover object-center"
          />

          <div
            style={{
              position: "absolute",
              bottom: "4vw",
              right: "5%",
              maxWidth: "90vw",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-anton), system-ui, sans-serif",
                margin: 0,
                lineHeight: 1.0,
                textTransform: "uppercase",
                textShadow: "0 8px 20px rgba(0, 0, 0, 0.8)",
              }}
            >
              <span
                style={{
                  display: "block",
                  color: "#F2f2f2",
                  opacity: 0.9,
                  fontSize: "clamp(3.4rem, 10vw, 7.2rem)",
                  textAlign: "right",
                }}
              >
                DRAMA CLUBS
              </span>
            </h1>

            <h4
              style={{
                fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                margin: 0,
                lineHeight: 1.2,
                textShadow: "0 3px 9px rgba(0,0,0,1.8)",
              }}
            >
              <span
                style={{
                  display: "block",
                  color: "#f2f2f2",
                  opacity: 0.75,
                  fontSize: "clamp(1.25rem, 2.2vw, 1.8rem)",
                  fontWeight: "500",
                  textAlign: "right",
                }}
              >
                cultivating community, culture, and imagination
              </span>
            </h4>
            <br />

            {/* Hero CTAs */}
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              {/* Secondary: Clubs */}
              <DATButtonLink href="#clubs-index" variant="pink" size="sm">
                Meet the Clubs
              </DATButtonLink>
            </div>

            
          </div>
        </section>

{/* =========================
    SECTION 2 – WHAT IS A DRAMA CLUB? + ROOTS SIDEBAR
========================== */}
<section>
  <div className="mx-auto w-[90vw] max-w-6xl py-8 md:py-10">
    <div className="drama-club-layout">
      {/* LEFT: main copy + CTAs */}
      <div className="max-w-[640px]">
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
            color: "#530087ff",
            opacity: 0.9,
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            fontWeight: 800,
            marginBottom: "0.75rem",
          }}
        >
          Community theatre-making rooted in local story
        </h2>

        <h3
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            color: "#f2f2f2",
            opacity: 0.8,
            fontSize: "clamp(1rem, 2vw, 1.9rem)",
            fontWeight: 500,
            marginBottom: "0.75rem",
          }}
        >
          DAT Drama Clubs support young artists through mentorship and workshops
          as they shape and share stories rooted in their lives, landscapes, and
          local traditions.
        </h3>

        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontWeight: 500,
            color: "#ffe478ff",
            opacity: 0.8,
            fontSize: "clamp(0.98rem, 1.05rem, 1.8rem)",
            lineHeight: 1.7,
          }}
        >
          Drama Clubs grow out of DAT residencies and continue long after. Young
          artists gather in courtyards, community centers, jungle clearings, and
          living rooms to create performances drawn from their lived experiences.
          Co-created with our community partners, these clubs become creative
          homes where imagination is practiced, confidence develops, and young
          people begin to understand their power to shape the next chapter of
          their story.
        </p>

        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontWeight: 500,
            color: "#ffe478ff",
            opacity: 0.8,
            fontSize: "clamp(0.98rem, 1.05rem, 1.8rem)",
            lineHeight: 1.7,
            marginTop: "1rem",
          }}
        >
          Each club — youth-led and supported by local artists, educators, and
          DAT teaching artists — reflects the spirit and needs of its community.
          Ensembles devise new plays and cultivate emerging artist-leaders
          shaped by local folklore, traditional arts, community elders, and the
          causes that matter most to the people who gather there.
        </p><br/>

        {/* CTAs live INSIDE the left column now */}
<div className="mt-4">
  <DATButtonLink href="/cause/drama-clubs" variant="yellow" size="md">
    Sponsor a Drama Club
  </DATButtonLink>

  {/* Explicit padding above the artist link */}
  <div style={{ paddingTop: "0.9rem" }}>
    <Link
      href="/programs"
      className="dc-link dc-link--light"
      style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
      }}
    >
      I&apos;m an artist → programs connected to Drama Clubs
    </Link>
  </div>
</div>


</div>


      {/* RIGHT: Roots sidebar */}
      <div className="mt-8 md:mt-0 md:ml-10 lg:ml-16 max-w-[840px] w-full">
        <DramaClubRootsSidebar />
      </div>
    </div>
  </div>
</section>


{/* =========================
    FULL DRAMA CLUB INDEX (MICRO CARDS) – ALL CLUBS
========================== */}
<section
  id="clubs-index"
  className="py-10 md:py-14"
  style={{ paddingTop: "1.5rem" }}
>
  <div className="mx-auto w-[92vw] max-w-6xl">
    <DramaClubIndexShell
      clubs={sortedClubs}
      statusCounts={statusCounts}
    />
  </div>
  <br />
  <br />
</section>


        {/* =========================
            IMPACT BAND: STATS + PHOTO SPLAY
        ========================== */}
        <section>
          <div className="mx-auto w-[90vw] max-w-6xl py-10 md:py-12">
            <StatsStrip
              stats={dramaStats}
              background="transparent"
              accentColor="#FFCC00"
              textColor="#f2f2f2"
              maxWidth="100%"
              boxed
              boxBg="rgba(36, 17, 35, 0.16)"
              boxRadius="18px"
              id="drama-club-stats"
            />

            {/* Photo fan */}
            <div className="mt-10 bg-transparent py-8 md:py-10">
              <div className="drama-photo-splay-wrapper">
                <div className="drama-photo-splay">
                  <JoinTheJourneyPanel variant="photos-only" />
                </div>
              </div>
            </div>
          </div>
        </section>

       {/* =========================
   SUPPORTING DRAMA CLUBS
========================= */}
<section
  style={{
    padding: "3rem 0 4rem",
    backgroundColor: "#2493a9",
  }}
>
  <div
    style={{
      width: "90vw",
      maxWidth: "1120px",
      margin: "0 auto",
    }}
  >
    {/* Eyebrow */}
    <p
      style={{
        fontFamily:
          'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "0.7rem",
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: "rgba(253, 249, 241, 0.82)",
        margin: 0,
        marginBottom: "0.4rem",
      }}
    >
      Supporting Drama Clubs
    </p>

    {/* Heading */}
    <h2
      style={{
        fontFamily:
          'var(--font-anton), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "clamp(2.3rem, 5vw, 4rem)",
        letterSpacing: ".08em",
        textTransform: "uppercase",
        color: "#002129ff",
        opacity: 0.9,
        margin: 0,
      }}
    >
      Stand with a Drama Club.
    </h2>

    {/* One line of connective tissue */}
    <p
      style={{
        marginTop: "0.9rem",
        marginBottom: 0,
        maxWidth: "640px",
        fontFamily:
          'var(--font-space-grotesk), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "1.25rem",
        lineHeight: 1.6,
        color: "#eaf7fa",
      }}
    >
      Help young people become the creators, advocates, leaders, and culture-keepers at the heart of their communities.
    </p>

    {/* Shared layout with “What is a Drama Club?” */}
    {/* Supporting Drama Clubs – left column */}
<div className="drama-club-layout" style={{ marginTop: "2.25rem" }}>
  <div style={{ maxWidth: "620px" }}>
    {/* Helper style object if you want to hoist it above the component:
    const bodyCopyStyle: React.CSSProperties = {
      marginTop: "1rem",
      marginBottom: 0,
      fontFamily:
        'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: "0.95rem",
      lineHeight: 1.7,
      color: "#0f3440",
    };
    */}

    <p
      style={{
        marginTop: 0,
        marginBottom: 0,
        fontFamily:
          'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "0.95rem",
        lineHeight: 1.7,
        color: "#0f3440",
      }}
    >
      In many of DAT’s partner communities, young people grow up with very
      little access to arts education. A Drama Club changes that. Each club
      connects them to a team of local artists and educators, plus DAT master
      artists and teaching artists who come in through residencies to lead
      workshops, deepen the work, mentor emerging leaders, and build practical
      skills. Together, they give young people the tools and support to share
      their own stories. For many, it’s the first time anyone has told them,
      <span style={{ fontStyle: "italic" }}> “Your story matters.”</span>
    </p>

    <p
      style={{
        marginTop: "1rem",
        marginBottom: 0,
        fontFamily:
          'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "0.95rem",
        lineHeight: 1.7,
        color: "#0f3440",
      }}
    >
      Your support sustains creative homes where young people gather, where
      cultural traditions are carried forward in the voices of those who will
      inherit them, and where communities on the frontlines of global concerns
      have space to process, respond, and dream through story and imagination.
    </p>

    <p
      style={{
        marginTop: "1rem",
        marginBottom: 0,
        fontFamily:
          'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "1rem",
        lineHeight: 1.7,
        color: "#0f3440",
        fontWeight: 700,
      }}
    >
      DAT Drama Clubs uplift local voices, expand opportunity, and nurture youth
      leadership where it matters most.
    </p>

    <p
      style={{
        marginTop: "1rem",
        marginBottom: 0,
        fontFamily:
          'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: "0.95rem",
        lineHeight: 1.7,
        color: "#0f3440",
      }}
    >
      Whether you&apos;re an alum, a donor, a partner, or a foundation, we’ll
      help you connect your support to a specific community or cause—from
      Indigenous-led work in the Amazon to youth empowerment in Central Europe
      and beyond. Tell us where your heart pulls you, and we’ll help you make
      that connection real.
    </p>

        {/* Primary CTA + text link */}
        <div
          style={{
            marginTop: "1.75rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.9rem",
          }}
        >
          {/* Custom DAT-style CTA (no DATButton / no variants) */}
          <Link href="/cause/drama-clubs/" className="dc-cta">
            Sponsor a Drama Club
          </Link>

          {/* Simple text link (no underline, hover effect) */}
          <Link href="/alumni" className="dc-link dc-link--light">
            Meet the artists behind this work →
          </Link>
        </div>
      </div>

      {/* RIGHT column: donors / alumni / partners card */}
      <aside
        style={{
          maxWidth: "580px",
          width: "100%",
          borderRadius: "18px",
          border: "1px solid rgba(192, 236, 248, 0.35)",
          backgroundColor: "#003e4bff",
          opacity: 0.9,
          padding: "1.3rem 1.7rem 1.6rem",
          marginTop: "1.5rem",
          marginLeft: "auto",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily:
              'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: "0.7rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#7fd0df",
          }}
        >
          For donors, alumni &amp; partners
        </p>

        <p
          style={{
            marginTop: "0.75rem",
            marginBottom: 0,
            fontFamily:
              'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "#c4f3ff",
          }}
        >
          Want to sponsor a specific Drama Club—like the Shuar Drama Club in Gualaquiza, the Košice Roma Youth Drama Club, or the Floreana Youth Drama Lab? Tell us who you feel called to stand with, and we’ll help you build a meaningful, long-term relationship with that club.
        </p>

        <div
          style={{
            marginTop: "0.9rem",
            paddingTop: "0.7rem",
            borderTop: "1px solid rgba(124, 210, 232, 0.35)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily:
                'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: "0.78rem",
              color: "#9eddea",
            }}
          >
            When you&apos;re serious about partnering, we can help you:
          </p>
          <ul
            style={{
              margin: "0.45rem 0 0",
              paddingLeft: "1.15rem",
              fontFamily:
                'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontSize: "0.78rem",
              lineHeight: 1.55,
              color: "#9eddea",
            }}
          >
            <li>Structure multi-year sponsorship commitments</li>
            <li>Match your support to specific cause areas</li>
            <li>Align giving with your company&apos;s social impact goals</li>
          </ul>
        </div>

        <Link href="/contact" className="dc-link dc-link--teal">
          Start a conversation about Drama Club sponsorship →
        </Link>
        {/* NEW impact / sponsorship card */}
        <div
          style={{
            marginTop: "1rem",
            borderRadius: "1.75rem",
            backgroundColor: "#032c34ff",
            padding: "1.5rem 1.75rem 1.7rem",
            color: "rgba(242, 252, 255, 0.96)",
            fontFamily:
              'var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: "0.9rem",
            lineHeight: 1.7,
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: "0.55rem",
              fontSize: "0.7rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "#7fd0df",
            }}
          >
            Your sponsorship helps
          </p>

          <ul
            style={{
              margin: 0,
              paddingLeft: "1.1rem",
              listStyleType: "disc",
              color: "#7fd0df",
              fontSize: "0.8rem",
            }}
          >
            <li>
              young people access arts education, mentorship, and creative
              opportunity
            </li>
            <li>
              communities facing climate pressure, cultural loss, and social
              inequity stand strong
            </li>
            <li>
              Indigenous and marginalized communities carry their culture
              forward and advocate for their needs
            </li>
            <li>
              artist-leaders take root and lead from within their own communities
            </li>
          </ul>

          <p
            style={{
              marginTop: "0.9rem",
              marginBottom: 0,
              fontSize: "0.9rem",
              color: "#c4f3ff",
              fontWeight: 600,
            }}
          >
            When you sponsor a Drama Club, you’re investing in young
            artist-leaders and the communities they call home.
          </p>
        </div>
      </aside>
      
    </div>
  </div>



  {/* Scoped styles just for this section */}
  <style>{`
    /* ==== CTA BUTTON (no variant, fully custom) ==== */
    .dc-cta {
      /* tweak these four vars freely */
      --dc-cta-bg: #00313bff;
      --dc-cta-bg-hover: #00313baf;
      --dc-cta-text: #F2F2F2;

      display: inline-flex;
      justify-content: center;
      align-items: center;
      padding: 0.85rem 1.15rem;
      border-radius: 14px;
      background-color: var(--dc-cta-bg);
      color: var(--dc-cta-text);
      border: none;
      text-decoration: none;
      font-family: var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 0.78rem;
      line-height: 1.15;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      box-shadow: 0 0px 44px rgba(255, 255, 255, 0.75);
      cursor: pointer;
      transition:
        background-color 150ms ease,
        box-shadow 150ms ease,
        transform 120ms ease,
        opacity 120ms ease;
    }

    .dc-cta:hover {
      background-color: var(--dc-cta-bg-hover);
      transform: translateY(-1px);
      font-weight: 800;
      box-shadow: 0 0px 44px rgba(255, 255, 255, 1);
      opacity: 0.98;
    }

    /* ==== TEXT LINKS (no underlines, hover micro-motion) ==== */
    .dc-link,
    .dc-link:visited {
      text-decoration: none;
      cursor: pointer;
      font-family: var(--font-dm-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      transform-origin: left center;
      transition:
        color 150ms ease-out,
        opacity 150ms ease-out,
        transform 130ms ease-out,
        letter-spacing 130ms ease-out;
    }

    /* Light link on teal background (left column) */
    .dc-link--light {
      color: #6c00af;
      opacity: 1;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      font-size: 0.75rem;
      font-weight: 800;
      transition:
        color 150ms ease-out,
        opacity 150ms ease-out,
        transform 130ms ease-out,
        letter-spacing 130ms ease-out;
    }

    .dc-link--light:hover {
    color: #ffcc00;
      letter-spacing: 0.19em;
      opacity: 1;
    }

    /* Teal link inside dark donor card */
    .dc-link--teal {
      display: inline-flex;
      margin-top: 1rem;
      color: #ce7effff;
      opacity: 1;
      text-transform: uppercase;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.18em;
      transition:
        color 150ms ease-out,
        opacity 150ms ease-out,
        transform 130ms ease-out,
        letter-spacing 130ms ease-out;
    }

    .dc-link--teal:hover {
      color: #ffcc00;
      letter-spacing: 0.21em;
      opacity: 1;
    }
  `}</style>
</section>


      </main>
    </div>
  );
}
