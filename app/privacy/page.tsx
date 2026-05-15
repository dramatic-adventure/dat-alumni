// app/privacy/page.tsx
// Privacy policy — required for Facebook/Instagram Graph API app review.
// Publicly accessible at /privacy on the production site.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Dramatic Adventure Theatre",
  description:
    "Privacy policy for the Dramatic Adventure Theatre alumni platform and connected services.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const contact = "jesse@dramaticadventure.com";
  const effectiveDate = "May 15, 2025";

  return (
    <main className="privacy-wrap">
      <article className="privacy-card">

        {/* Header */}
        <header className="privacy-header">
          <p className="privacy-eyebrow">Dramatic Adventure Theatre</p>
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-date">Effective {effectiveDate}</p>
        </header>

        {/* Body */}
        <div className="privacy-body">

          <section>
            <h2>Overview</h2>
            <p>
              Dramatic Adventure Theatre ("DAT", "we", "us") operates web properties including{" "}
              <a href="https://stories.dramaticadventure.com">stories.dramaticadventure.com</a> and{" "}
              <a href="https://www.dramaticadventure.com">www.dramaticadventure.com</a>. This policy
              explains what information we collect, how we use it, and your rights regarding that
              information.
            </p>
            <p>
              These platforms also use the Instagram Graph API solely to display recent photos from
              DAT&rsquo;s own Instagram account (<strong>@dramaticadventure</strong>). No visitor
              data is collected or stored through this Instagram integration.
            </p>
          </section>

          <section>
            <h2>What We Collect</h2>

            <h3>Information you provide</h3>
            <p>
              If you log in with Google (alumni only), we receive your name and email address via
              Google OAuth to authenticate your account. We do not share or sell this information.
            </p>

            <h3>Donations</h3>
            <p>
              Donation payments are processed by Stripe. We store a record of your donation amount
              and any message you submit, but we never store raw payment card numbers on our servers.
            </p>

            <h3>Instagram content</h3>
            <p>
              We access the Instagram Graph API using a token associated with DAT&rsquo;s own
              Instagram account to fetch and display recent photos on our websites. We do not
              collect, store, or process any data from Instagram users who have not explicitly
              authorized our application.
            </p>

            <h3>Logs &amp; analytics</h3>
            <p>
              Our hosting provider (Netlify) collects standard server logs (IP address, browser
              type, pages visited) for security and performance purposes. We do not run third-party
              ad trackers or behavioral analytics.
            </p>
          </section>

          <section>
            <h2>How We Use Information</h2>
            <ul>
              <li>To authenticate alumni accounts and display your profile.</li>
              <li>To process and record donations made through the platform.</li>
              <li>To display DAT&rsquo;s own Instagram photos on DAT websites.</li>
              <li>To maintain the security and performance of the platform.</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2>Data Retention</h2>
            <p>
              Donation records are retained for accounting and legal compliance purposes. Alumni
              account data is retained as long as your account is active. You may request deletion
              at any time (see below).
            </p>
          </section>

          <section id="deletion">
            <h2>Your Rights — Data Deletion</h2>
            <p>
              You have the right to request that we delete any personal data we hold about you. To
              submit a deletion request:
            </p>
            <ol>
              <li>
                Email us at <a href={`mailto:${contact}`}>{contact}</a> with the subject line
                &ldquo;Data Deletion Request.&rdquo;
              </li>
              <li>Include the name and email address associated with your account.</li>
              <li>We will confirm deletion within 30 days.</li>
            </ol>
            <p>
              If you authorized this application through Facebook/Instagram, you may also revoke
              access at any time via your Facebook settings at{" "}
              <a
                href="https://www.facebook.com/settings?tab=applications"
                target="_blank"
                rel="noopener noreferrer"
              >
                facebook.com/settings → Apps and Websites
              </a>
              .
            </p>
          </section>

          <section>
            <h2>Third-Party Services</h2>
            <p>
              This platform uses the following third-party services, each governed by their own
              privacy policies:
            </p>
            <ul>
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google OAuth
                </a>{" "}
                — authentication
              </li>
              <li>
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe
                </a>{" "}
                — payment processing
              </li>
              <li>
                <a
                  href="https://www.facebook.com/policy.php"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Meta / Instagram Graph API
                </a>{" "}
                — photo display
              </li>
              <li>
                <a
                  href="https://www.netlify.com/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Netlify
                </a>{" "}
                — hosting &amp; infrastructure
              </li>
            </ul>
          </section>

          <section>
            <h2>Children&rsquo;s Privacy</h2>
            <p>
              This platform is not directed at children under 13. We do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2>Changes to This Policy</h2>
            <p>
              We may update this policy periodically. Material changes will be noted by updating the
              effective date above. Continued use of the platform after changes constitutes
              acceptance.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions about this privacy policy? Contact us at{" "}
              <a href={`mailto:${contact}`}>{contact}</a>.
            </p>
          </section>

        </div>

        <footer className="privacy-footer">
          Dramatic Adventure Theatre &nbsp;·&nbsp; stories.dramaticadventure.com
          &nbsp;·&nbsp; www.dramaticadventure.com
        </footer>
      </article>

      <style jsx>{`
        /* ── Page wrapper — sits on top of the kraft bg ── */
        .privacy-wrap {
          min-height: 100vh;
          padding: 3rem 1.25rem 6rem;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        /* ── Card ── */
        .privacy-card {
          width: 100%;
          max-width: 760px;
          background: rgba(36, 17, 35, 0.94);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        /* ── Card header ── */
        .privacy-header {
          background: #241123;
          border-bottom: 3px solid #F23359;
          padding: 2.25rem 2.5rem 1.75rem;
        }
        .privacy-eyebrow {
          font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #ffcc00;
          margin: 0 0 0.5rem;
        }
        .privacy-title {
          font-family: var(--font-gloucester, Georgia, serif);
          font-size: clamp(1.8rem, 5vw, 2.75rem);
          font-weight: 400;
          color: #f6e4c1;
          margin: 0 0 0.4rem;
          line-height: 1.1;
        }
        .privacy-date {
          font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
          font-size: 0.85rem;
          color: rgba(246, 228, 193, 0.5);
          margin: 0;
        }

        /* ── Card body ── */
        .privacy-body {
          padding: 2rem 2.5rem;
          color: rgba(246, 228, 193, 0.88);
          font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
          font-size: 0.97rem;
          line-height: 1.75;
        }

        .privacy-body section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }
        .privacy-body section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .privacy-body h2 {
          font-family: var(--font-gloucester, Georgia, serif);
          font-size: 1.25rem;
          font-weight: 400;
          color: #f6e4c1;
          margin: 0 0 0.75rem;
        }
        .privacy-body h3 {
          font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
          font-size: 0.93rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #2493A9;
          margin: 1.25rem 0 0.35rem;
        }
        .privacy-body p {
          margin: 0 0 0.85rem;
        }
        .privacy-body ul,
        .privacy-body ol {
          padding-left: 1.4rem;
          margin: 0 0 0.85rem;
        }
        .privacy-body li {
          margin-bottom: 0.4rem;
        }
        .privacy-body a {
          color: #2493A9;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.15s;
        }
        .privacy-body a:hover {
          color: #ffcc00;
        }
        .privacy-body strong {
          color: #f6e4c1;
          font-weight: 600;
        }

        /* ── Card footer ── */
        .privacy-footer {
          background: #1a0f1e;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          padding: 1rem 2.5rem;
          font-family: var(--font-dm-sans, "DM Sans", system-ui, sans-serif);
          font-size: 0.78rem;
          color: rgba(246, 228, 193, 0.35);
          letter-spacing: 0.03em;
        }

        /* ── Mobile ── */
        @media (max-width: 600px) {
          .privacy-wrap {
            padding: 1.5rem 0.75rem 4rem;
          }
          .privacy-header {
            padding: 1.5rem 1.25rem 1.25rem;
          }
          .privacy-body {
            padding: 1.5rem 1.25rem;
          }
          .privacy-footer {
            padding: 0.9rem 1.25rem;
          }
        }
      `}</style>
    </main>
  );
}
