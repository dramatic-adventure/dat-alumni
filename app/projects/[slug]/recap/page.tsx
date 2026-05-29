// app/projects/[slug]/recap/page.tsx
//
// Campaign recap — the "close the loop" donor-stewardship view of a project.
// Only exists when the project has a fundraising campaign (else notFound).
//
// Sequence (gratitude → proof → recognition → one soft forward invite):
//   Hero + final tally → lead impact paragraph → stat band + progress
//   → Where It Went (giftImpact) → Campaign Journal (updates) → Testimonials
//   → Donor wall (consent-gated) → Forward invitation.

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { programMap } from "@/lib/programMap";
import {
  getCampaign,
  campaignProgress,
  formatCurrency,
  formatCurrencyMinor,
} from "@/lib/fundraisingCampaigns";
import { getProjectArchiveData } from "@/lib/projectArchive";
import { partitionDonorWall } from "@/lib/donorConsent";

export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(programMap)
    .filter((slug) => getCampaign(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = programMap[slug];
  const campaign = getCampaign(slug);
  if (!p || !campaign) {
    return { title: "Campaign Recap — Dramatic Adventure Theatre" };
  }
  const title = `${p.title} — Campaign Recap`;
  const description =
    campaign.archiveSummary || `What your support made possible for ${p.title}.`;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${slug}/recap` },
    openGraph: { title, description, url: `/projects/${slug}/recap`, type: "article" },
  };
}

const C = {
  ink: "#241123",
  gold: "#FFCC00",
  teal: "#2493a9",
  green: "#3b6d11",
  grape: "#7b4fa6",
  white: "#f2f2f2",
  paper: "#f4eee1",
} as const;

const FONT_ANTON = "var(--font-anton), system-ui, sans-serif";
const FONT_GROTESK = "var(--font-space-grotesk), system-ui, sans-serif";
const FONT_DM = "var(--font-dm-sans), system-ui, sans-serif";

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <p
        style={{
          fontFamily: FONT_DM,
          fontSize: "0.8rem",
          fontWeight: 900,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: C.ink,
          opacity: 0.65,
          margin: "0 0 0.4rem",
        }}
      >
        {kicker}
      </p>
      <h2
        style={{
          fontFamily: FONT_ANTON,
          textTransform: "uppercase",
          color: C.ink,
          fontSize: "clamp(1.7rem, 4vw, 2.6rem)",
          lineHeight: 1,
          margin: "0 0 1.1rem",
        }}
      >
        {title}
      </h2>
    </>
  );
}

export default async function CampaignRecapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getProjectArchiveData(slug);
  if (!data || !data.campaign || !data.campaignTotals) return notFound();

  const { program, campaign, campaignTotals, roster, clubCount, recruitingUrl, heroImage } = data;
  const totals = campaignTotals;
  const currency = campaign.currency;
  const pct = Math.round(campaignProgress(totals.raisedMinor, campaign.goalAmount));
  const goalMet = totals.raisedMinor / 100 >= campaign.goalAmount;
  const wall = partitionDonorWall(totals);

  const giftImpact = campaign.giftImpact ?? [];
  const updates = campaign.updates ?? [];
  const testimonials = campaign.testimonials ?? [];
  const forwardUrl = recruitingUrl || campaign.secondaryUrl;

  return (
    <div>
      {/* ── HERO ── */}
      <div
        style={{
          position: "relative",
          height: "70vh",
          minHeight: "460px",
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(36,17,35,0.5)",
        }}
      >
        <Image src={heroImage} alt={`${program.title} hero`} fill priority className="object-cover object-center" />
        {/* concentric rings */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {[180, 360, 560, 780].map((d) => (
            <i
              key={d}
              style={{
                position: "absolute",
                width: `${d}px`,
                height: `${d}px`,
                borderRadius: "50%",
                border: "1px solid rgba(255,204,0,0.16)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(36,17,35,0.94) 4%, rgba(36,17,35,0.4) 46%, transparent 72%)",
          }}
        />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "0 0 3rem" }}>
          <div style={{ maxWidth: "1080px", margin: "0 auto", width: "92vw" }}>
            <p
              style={{
                fontFamily: FONT_DM,
                fontSize: "0.86rem",
                fontWeight: 900,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.gold,
                margin: "0 0 0.6rem",
              }}
            >
              {program.title} · Campaign complete
            </p>
            <h1
              style={{
                fontFamily: FONT_ANTON,
                textTransform: "uppercase",
                color: C.white,
                fontSize: "clamp(2.6rem, 7vw, 6rem)",
                lineHeight: 0.95,
                margin: 0,
                textShadow: "0 8px 24px rgba(0,0,0,0.8)",
              }}
            >
              {campaign.archiveHeadline || "Because You Made This Possible"}
            </h1>
            <p
              style={{
                fontFamily: FONT_GROTESK,
                color: C.white,
                margin: "0.9rem 0 0",
                fontSize: "clamp(1.05rem, 2vw, 1.5rem)",
                fontWeight: 500,
                textShadow: "0 3px 10px rgba(0,0,0,0.8)",
              }}
            >
              <b style={{ color: C.gold }}>{formatCurrencyMinor(totals.raisedMinor, currency)}</b> raised
              {totals.donorCount > 0 && (
                <>
                  {" "}
                  from <b style={{ color: C.gold }}>{totals.donorCount}</b>{" "}
                  {totals.donorCount === 1 ? "donor" : "donors"}
                </>
              )}
              {goalMet ? " — goal met." : "."}
            </p>
          </div>
        </div>
      </div>

      {/* ── SHEET ── */}
      <div
        style={{
          maxWidth: "1080px",
          margin: "2.5rem auto 3.5rem",
          width: "92vw",
          background: C.paper,
          borderRadius: "24px",
          padding: "2.6rem 2.6rem 3rem",
          position: "relative",
          zIndex: 5,
          boxShadow: "0 6px 26px rgba(36,17,35,0.16)",
        }}
        className="rcp-sheet"
      >
        {/* Lead impact paragraph */}
        <p
          style={{
            fontFamily: FONT_GROTESK,
            fontSize: "1.25rem",
            lineHeight: 1.8,
            opacity: 0.92,
            maxWidth: "64ch",
            paddingTop: "2.4rem",
          }}
        >
          <span
            style={{
              fontFamily: FONT_ANTON,
              textTransform: "uppercase",
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              color: C.ink,
              display: "block",
              marginBottom: "1rem",
              lineHeight: 1.05,
            }}
          >
            Thank you.
          </span>
          {campaign.archiveSummary}
        </p>

        {/* Stat band */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            background: C.ink,
            borderRadius: "16px",
            overflow: "hidden",
            margin: "2.4rem 0 0",
            boxShadow: "0 8px 24px rgba(36,17,35,0.22)",
          }}
        >
          {[
            {
              n: formatCurrencyMinor(totals.raisedMinor, currency),
              l: "Raised",
              s: `of a ${formatCurrency(campaign.goalAmount, currency)} goal`,
            },
            ...(totals.donorCount > 0
              ? [{ n: String(totals.donorCount), l: totals.donorCount === 1 ? "Donor" : "Donors", s: "who made it real" }]
              : []),
            ...(roster.length > 0
              ? [{ n: String(roster.length), l: "Artists supported", s: "+ local collaborators" }]
              : []),
            ...(clubCount > 0
              ? [{ n: String(clubCount), l: clubCount === 1 ? "Community" : "Communities", s: "in partnership" }]
              : []),
          ].map((s, i, arr) => (
            <div
              key={`${s.l}-${i}`}
              style={{
                padding: "1.4rem",
                textAlign: "center",
                borderRight: i < arr.length - 1 ? "1px solid rgba(242,242,242,0.12)" : "none",
              }}
            >
              <div style={{ fontFamily: FONT_ANTON, color: C.gold, fontSize: "clamp(2.2rem, 5vw, 3.2rem)", lineHeight: 1 }}>
                {s.n}
              </div>
              <div
                style={{
                  fontFamily: FONT_GROTESK,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "0.78rem",
                  color: C.white,
                  marginTop: "0.35rem",
                }}
              >
                {s.l}
              </div>
              <div style={{ fontFamily: FONT_DM, fontSize: "0.7rem", color: "rgba(242,242,242,0.6)", marginTop: "0.2rem" }}>
                {s.s}
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div style={{ marginTop: "1rem" }}>
          <div style={{ height: "12px", borderRadius: "8px", background: "rgba(36,17,35,0.12)", overflow: "hidden" }}>
            <div style={{ height: "100%", background: C.green, width: `${pct}%` }} />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: FONT_DM,
              fontWeight: 700,
              fontSize: "0.85rem",
              marginTop: "0.5rem",
              opacity: 0.8,
            }}
          >
            <span>{goalMet ? "Goal met — and then some" : "Progress toward goal"}</span>
            <span>{pct}%</span>
          </div>
        </div>

        {/* Where It Went */}
        {giftImpact.length > 0 && (
          <section style={{ padding: "3rem 0 0" }}>
            <SectionHead kicker="What your gift built" title="Where It Went" />
            <p
              style={{
                fontFamily: FONT_GROTESK,
                fontSize: "1.08rem",
                lineHeight: 1.8,
                maxWidth: "66ch",
                opacity: 0.9,
                marginBottom: 0,
              }}
            >
              Your support didn&apos;t fund an abstraction. It opened the door to specific people, places, and work:
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              {giftImpact.map((g) => (
                <div
                  key={g.amount}
                  style={{
                    background: "#fbf8f0",
                    border: "1px solid rgba(36,17,35,0.14)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      height: "72px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2rem",
                      background: "linear-gradient(135deg, #3a2230, #1a5560)",
                    }}
                  >
                    <span aria-hidden>{g.icon || "✦"}</span>
                  </div>
                  <div style={{ padding: "1rem 1.1rem 1.2rem" }}>
                    <h4
                      style={{
                        fontFamily: FONT_GROTESK,
                        fontWeight: 700,
                        fontSize: "1rem",
                        margin: "0 0 0.3rem",
                        color: C.ink,
                      }}
                    >
                      {formatCurrency(g.amount, currency)} gift
                    </h4>
                    <p style={{ fontFamily: FONT_DM, fontSize: "0.82rem", lineHeight: 1.55, opacity: 0.7, margin: 0 }}>
                      {g.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Campaign Journal */}
        {updates.length > 0 && (
          <section style={{ padding: "3rem 0 0" }}>
            <SectionHead kicker="The story as it happened" title="Campaign Journal" />
            <div style={{ marginTop: "1rem", borderLeft: "2px solid rgba(36,17,35,0.18)", paddingLeft: "1.5rem" }}>
              {updates.map((u, i) => (
                <div
                  key={u.id}
                  style={{ position: "relative", paddingBottom: i < updates.length - 1 ? "1.6rem" : 0 }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: "-1.94rem",
                      top: "0.3rem",
                      width: "13px",
                      height: "13px",
                      borderRadius: "50%",
                      background: C.gold,
                      border: `2px solid ${C.paper}`,
                    }}
                  />
                  <div
                    style={{
                      fontFamily: FONT_DM,
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: C.teal,
                    }}
                  >
                    {new Date(u.date + "T12:00:00Z").toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </div>
                  <h4
                    style={{
                      fontFamily: FONT_GROTESK,
                      fontWeight: 700,
                      fontSize: "1.08rem",
                      margin: "0.2rem 0 0.3rem",
                      color: C.ink,
                    }}
                  >
                    {u.title}
                  </h4>
                  <p style={{ fontFamily: FONT_GROTESK, fontSize: "0.96rem", lineHeight: 1.6, opacity: 0.85, margin: 0 }}>
                    {u.body}
                  </p>
                  {(u.authorName || u.authorRole) && (
                    <div style={{ fontFamily: FONT_DM, fontSize: "0.74rem", opacity: 0.55, marginTop: "0.3rem" }}>
                      {[u.authorName, u.authorRole].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <section style={{ padding: "3rem 0 0" }}>
            <SectionHead kicker="In their words" title="What It Meant" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.2rem",
                marginTop: "1rem",
              }}
            >
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: "rgba(36,147,169,0.08)",
                    borderLeft: `3px solid ${C.teal}`,
                    borderRadius: "0 12px 12px 0",
                    padding: "1.4rem 1.5rem",
                  }}
                >
                  <p style={{ fontFamily: FONT_GROTESK, fontStyle: "italic", fontSize: "1.02rem", lineHeight: 1.7, margin: "0 0 0.8rem", color: C.ink }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <cite style={{ fontFamily: FONT_DM, fontWeight: 700, fontSize: "0.82rem", fontStyle: "normal", color: C.teal }}>
                    {t.name}
                    {t.role && (
                      <span style={{ display: "block", fontWeight: 500, opacity: 0.6, color: C.ink, marginTop: "0.1rem" }}>
                        {t.role}
                      </span>
                    )}
                  </cite>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Donor wall (consent-gated) */}
        {totals.donorCount > 0 && (
          <div style={{ background: C.ink, borderRadius: "18px", padding: "2.4rem 2rem", marginTop: "3rem" }}>
            <p
              style={{
                fontFamily: FONT_DM,
                fontSize: "0.8rem",
                fontWeight: 900,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.gold,
                opacity: 0.9,
                margin: 0,
              }}
            >
              With gratitude
            </p>
            <h3
              style={{
                fontFamily: FONT_ANTON,
                textTransform: "uppercase",
                color: C.white,
                fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
                margin: "0.3rem 0 1.3rem",
              }}
            >
              Made Possible By
            </h3>
            {wall.names.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: "0.55rem 1.2rem",
                }}
              >
                {wall.names.map((name) => (
                  <span key={name} style={{ fontFamily: FONT_GROTESK, fontSize: "0.92rem", color: "rgba(242,242,242,0.82)" }}>
                    {name}
                  </span>
                ))}
              </div>
            )}
            {wall.hiddenCount > 0 && (
              <p style={{ fontFamily: FONT_DM, fontSize: "0.84rem", color: "rgba(242,242,242,0.55)", marginTop: wall.names.length > 0 ? "1.2rem" : 0 }}>
                {wall.names.length > 0
                  ? `…and ${wall.hiddenCount} more ${wall.hiddenCount === 1 ? "friend" : "friends"} who gave to make this journey possible.`
                  : `Made possible by ${wall.hiddenCount} ${wall.hiddenCount === 1 ? "donor" : "donors"} who gave to make this journey possible.`}
              </p>
            )}
            {campaign.matchActive && campaign.matchDescription && (
              <div
                style={{
                  marginTop: "1.4rem",
                  paddingTop: "1.2rem",
                  borderTop: "1px solid rgba(242,242,242,0.14)",
                  fontFamily: FONT_GROTESK,
                  color: C.gold,
                  fontWeight: 500,
                }}
              >
                {campaign.matchDescription}
              </div>
            )}
          </div>
        )}

        {/* Forward invitation */}
        <div style={{ marginTop: "3.2rem", textAlign: "center", padding: "1rem 0 0" }}>
          <h3
            style={{
              fontFamily: FONT_ANTON,
              textTransform: "uppercase",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              color: C.ink,
              margin: "0 0 0.6rem",
            }}
          >
            The next journey is already forming
          </h3>
          <p
            style={{
              fontFamily: FONT_GROTESK,
              fontSize: "1.05rem",
              lineHeight: 1.7,
              maxWidth: "48ch",
              margin: "0 auto 1.5rem",
              opacity: 0.85,
            }}
          >
            Ripples need conditions to grow — programs, relationships, time, and resources. You helped create them here. There&apos;s another community waiting.
          </p>
          <div className="rcp-btnrow">
            {forwardUrl && (
              <a
                className="rcp-btn rcp-btn-gold"
                href={forwardUrl}
                target={forwardUrl.startsWith("http") ? "_blank" : undefined}
                rel={forwardUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              >
                Explore what&apos;s next
              </a>
            )}
            <Link className="rcp-btn rcp-btn-ghost" href={`/projects/${slug}`}>
              Back to the project
            </Link>
          </div>
        </div>

        {/* Back-nav */}
        <div style={{ padding: "2.4rem 0 0.5rem" }}>
          <Link href={`/projects/${slug}`} className="rcp-backnav">
            ← {program.title}
          </Link>
        </div>
      </div>

      <style>{`
        .rcp-btnrow { display: flex; flex-wrap: wrap; gap: 0.7rem; justify-content: center; }
        .rcp-btn {
          display: inline-block; font-family: ${FONT_DM}; font-weight: 800; letter-spacing: 0.08em;
          text-transform: uppercase; font-size: 0.82rem; padding: 0.85em 1.9em; border-radius: 8px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .rcp-btn-gold { background: ${C.gold}; color: ${C.ink}; }
        .rcp-btn-ghost { background: transparent; color: ${C.ink}; border: 1.5px solid rgba(36,17,35,0.4); }
        .rcp-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(36,17,35,0.2); }
        .rcp-backnav {
          font-family: ${FONT_DM}; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase;
          font-size: 0.78rem; color: ${C.ink}; opacity: 0.7; transition: opacity 0.18s ease, color 0.18s ease;
        }
        .rcp-backnav:hover { opacity: 1; color: ${C.grape}; }
        @media (max-width: 700px) {
          .rcp-sheet { padding: 1.6rem 1.3rem 2rem !important; }
        }
      `}</style>
    </div>
  );
}
