"use client";

import { useEffect, useState } from "react";

interface LangData {
  title?: string;
  subtitle?: string;
  description?: string;
}

interface EventHeroTextProps {
  /** The base (default) language code — e.g. "es" */
  defaultLang: string;
  /** The eyebrow label (e.g. "Live Theatre") — rendered between toggle and title */
  eyebrow: string;
  /** City name for the Rock Salt location stamp */
  city?: string;
  /** Country name for the Rock Salt location stamp */
  country?: string;
  /** Category accent colour for the location stamp */
  accentColor?: string;
  /** Base text in the default language */
  base: {
    title: string;
    subtitle?: string;
    description: string;
  };
  /** Alternate translations keyed by ISO 639-1 code */
  translations: Record<string, LangData>;
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
  city,
  country,
  accentColor,
  base,
  translations,
}: EventHeroTextProps) {
  const langCodes = [defaultLang, ...Object.keys(translations)];
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let resolvedLang = defaultLang;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && langCodes.includes(saved)) {
        resolvedLang = saved;
      } else {
        // Auto-detect from browser language on first visit
        const browserLang = navigator.language?.split("-")[0]?.toLowerCase();
        if (browserLang && langCodes.includes(browserLang) && browserLang !== defaultLang) {
          resolvedLang = browserLang;
          localStorage.setItem(STORAGE_KEY, browserLang);
        }
      }
    } catch {
      // localStorage not available
    }
    setActiveLang(resolvedLang);
    // Drive CSS-based bilingual content switching
    document.documentElement.dataset.evdLang = resolvedLang;
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
      // Drive CSS-based bilingual content switching across the full page
      document.documentElement.dataset.evdLang = code;
      // Also notify any client components listening via custom event
      window.dispatchEvent(new CustomEvent("evd-lang-change", { detail: { lang: code } }));
    } catch {
      // ignore
    }
  }

  // Resolve displayed text
  const overrides = activeLang !== defaultLang ? (translations[activeLang] ?? {}) : {};
  const title = overrides.title ?? base.title;
  const subtitle = overrides.subtitle ?? base.subtitle;
  const description = overrides.description ?? base.description;

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

      {/* Eyebrow + Rock Salt location stamp */}
      <div className="evd-eyebrow-row">
        <p className="evd-eyebrow">{eyebrow}</p>
        {city && (
          <p className="evd-hero-location-stamp" style={{ color: accentColor }}>
            {city}{country ? `, ${country}` : ""}
          </p>
        )}
      </div>

      <h1 className="evd-title">{title}</h1>

      {subtitle ? (
        <p className="evd-subtitle">{subtitle}</p>
      ) : null}

      <p className="evd-standfirst">{description}</p>

      <style jsx>{`
        .evd-eyebrow-row {
          display: flex;
          align-items: baseline;
          gap: 1.1rem;
          margin-bottom: 0.8rem;
          flex-wrap: wrap;
        }
        .evd-eyebrow-row .evd-eyebrow {
          margin: 0;
        }
        .evd-hero-location-stamp {
          font-family: "Rock Salt", cursive;
          font-size: 0.7rem;
          line-height: 1;
          transform: rotate(-2.5deg);
          display: inline-block;
          opacity: 0.88;
          margin: 0;
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
