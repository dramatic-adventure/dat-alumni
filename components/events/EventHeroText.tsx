"use client";

import { useEffect, useState, type ReactNode } from "react";

interface LangData {
  title?: string;
  subtitle?: string;
  description?: string;
}

interface EventHeroTextProps {
  /** The base (default) language code — e.g. "es" */
  defaultLang: string;
  /** The eyebrow label in the default language (e.g. "Teatro En Vivo") */
  eyebrow: string;
  /** Alternate-language (EN) eyebrow — shown when user switches away from defaultLang */
  eyebrowEn?: string;
  /** Base text in the default language */
  base: {
    title: string;
    subtitle?: string;
    description: string;
  };
  /** Alternate translations keyed by ISO 639-1 code */
  translations: Record<string, LangData>;
  /**
   * Optional rich eyebrow node (overrides the plain eyebrow string when set).
   * Use for archive view to inject a linked season into the eyebrow line.
   */
  eyebrowNode?: ReactNode;
}

const LANG_LABELS: Record<string, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
  pt: "PT",
  kw: "KW",
};

function getLabel(code: string) {
  return LANG_LABELS[code] ?? code.toUpperCase();
}

const STORAGE_KEY = "evd-lang-pref";

export default function EventHeroText({
  defaultLang,
  eyebrow,
  eyebrowEn,
  base,
  translations,
  eyebrowNode,
}: EventHeroTextProps) {
  const langCodes = [defaultLang, ...Object.keys(translations)];
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let resolvedLang = defaultLang;
    try {
      // 1. URL ?lang= param wins — enables direct deep-links like /theatre/agwow?lang=es
      const urlParam = new URLSearchParams(window.location.search).get("lang")?.toLowerCase();
      if (urlParam && langCodes.includes(urlParam)) {
        resolvedLang = urlParam;
        localStorage.setItem(STORAGE_KEY, urlParam);
      } else {
        // 2. Persisted preference
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && langCodes.includes(saved)) {
          resolvedLang = saved;
        } else {
          // 3. Browser language auto-detect on first visit
          const browserLang = navigator.language?.split("-")[0]?.toLowerCase();
          if (browserLang && langCodes.includes(browserLang) && browserLang !== defaultLang) {
            resolvedLang = browserLang;
            localStorage.setItem(STORAGE_KEY, browserLang);
          }
        }
      }
    } catch {
      // localStorage / URLSearchParams not available — stay on defaultLang
    }
    setActiveLang(resolvedLang);
    // English-first CSS model: set data-evd-lang only when a non-EN language is active.
    // No attribute = English (default); data-evd-lang="es" = Spanish visible.
    if (resolvedLang !== "en") {
      document.documentElement.dataset.evdLang = resolvedLang;
    } else {
      delete document.documentElement.dataset.evdLang;
    }
    return () => {
      // Clean up when navigating away from a bilingual page
      delete document.documentElement.dataset.evdLang;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleToggle(code: string) {
    setActiveLang(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
      // English-first CSS model: attribute present only for non-EN langs
      if (code !== "en") {
        document.documentElement.dataset.evdLang = code;
      } else {
        delete document.documentElement.dataset.evdLang;
      }
      // Notify any client components listening via custom event
      window.dispatchEvent(new CustomEvent("evd-lang-change", { detail: { lang: code } }));
    } catch {
      // ignore
    }
  }

  // Resolve displayed text
  const overrides = activeLang !== defaultLang ? (translations[activeLang] ?? {}) : {};
  const title = overrides.title ?? base.title;
  const subtitle = overrides.subtitle ?? base.subtitle;

  // The inactive language's title, shown as a subdued line under the H1
  // (mirrors the drama-club local-name treatment — no explanatory label,
  // the pairing is self-explanatory). Hidden when the titles match.
  const inactiveLang =
    activeLang === defaultLang
      ? langCodes.find((c) => c !== defaultLang)
      : defaultLang;
  const inactiveTitle = inactiveLang
    ? inactiveLang === defaultLang
      ? base.title
      : translations[inactiveLang]?.title
    : undefined;
  const altTitle =
    inactiveTitle && inactiveTitle !== title ? inactiveTitle : undefined;

  return (
    <>
      {/* Language toggle — above the eyebrow */}
      {mounted && langCodes.length > 1 && (
        <div className="evd-lang-toggle" aria-label="Select language">
          {langCodes.map((code) => (
            <button
              key={code}
              onClick={() => handleToggle(code)}
              className={`evd-lang-btn${activeLang === code ? " evd-lang-btn--active" : ""}`}
              aria-pressed={activeLang === code}
            >
              {getLabel(code)}
            </button>
          ))}
        </div>
      )}

      {/* Eyebrow — category label above title */}
      <p className="evd-eyebrow">
        {eyebrowNode ?? (eyebrowEn && activeLang !== defaultLang ? eyebrowEn : eyebrow)}
      </p>

      {altTitle ? (
        /* Shrink-wrapped block so the other-language title right-aligns to the
           title's own width — same tuck as the drama club hero's local name.
           Pure CSS staggered lockup (see .evd-title-block styles below):
           single-line titles are unaffected; wrapped titles right-justify
           their LAST row so the tuck always lands under its edge. */
        <div className="evd-title-block">
          <h1 className="evd-title">{title}</h1>
          <p className="evd-alt-title" lang={inactiveLang}>{altTitle}</p>
        </div>
      ) : (
        <h1 className="evd-title">{title}</h1>
      )}

      {subtitle ? (
        <p className="evd-subtitle">{subtitle}</p>
      ) : null}

      <style jsx>{`
        /* Other-language title — same treatment as the drama club hero's
           local-language name (.dc-local-name / .dc-local-text). The wrapper
           shrink-wraps to the title's width so the line tucks under the
           title's right edge, like the drama club's 640px column does. */
        .evd-title-block {
          display: table;
          position: relative;
        }
        /* Staggered lockup, all viewports, no JS: the table wrapper hugs the
           widest title row, rows stay left-justified, and only the LAST row
           right-justifies. A single-line title spans the full block, so the
           rule has no visible effect there — wrapped titles get the stagger. */
        .evd-title-block .evd-title {
          text-align: left;
          text-align-last: right;
        }
        .evd-alt-title {
          font-family: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: #ffcc00;
          opacity: 0.9;
          width: fit-content;
          white-space: nowrap;
          padding-right: 4rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          line-height: 1.3;
          /* .evd-title carries 0.9rem bottom margin; pull up so the visual
             gap matches the drama club's 0.18rem title ↔ local-name tuck.
             margin-left auto keeps the fit-content line right-aligned. */
          margin: -0.72rem 0 0.65rem auto;
          text-shadow: 0 3px 8px rgba(0, 0, 0, 0.95);
        }
        .evd-lang-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 1.75rem;
        }
        .evd-lang-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.45);
          font-family: "DM Sans", sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          padding: 0.25rem 0.65rem;
          cursor: pointer;
          transition: color 0.2s ease, background 0.2s ease;
          line-height: 1;
        }
        .evd-lang-btn + .evd-lang-btn {
          border-left: 1px solid rgba(255, 255, 255, 0.22);
        }
        .evd-lang-btn:hover {
          color: rgba(255, 255, 255, 0.85);
        }
        .evd-lang-btn--active {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }
      `}</style>
    </>
  );
}
