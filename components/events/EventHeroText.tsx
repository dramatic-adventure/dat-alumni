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
  base,
  translations,
}: EventHeroTextProps) {
  const langCodes = [defaultLang, ...Object.keys(translations)];
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && langCodes.includes(saved)) {
        setActiveLang(saved);
        return;
      }
      // Auto-detect from browser language on first visit
      const browserLang = navigator.language?.split("-")[0]?.toLowerCase();
      if (browserLang && langCodes.includes(browserLang) && browserLang !== defaultLang) {
        setActiveLang(browserLang);
        localStorage.setItem(STORAGE_KEY, browserLang);
      }
    } catch {
      // localStorage not available
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleToggle(code: string) {
    setActiveLang(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
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

      {/* Eyebrow — below toggle, above title */}
      <p className="evd-eyebrow">{eyebrow}</p>

      <h1 className="evd-title">{title}</h1>

      {subtitle ? (
        <p className="evd-subtitle">{subtitle}</p>
      ) : null}

      <p className="evd-standfirst">{description}</p>

      <style jsx>{`
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
