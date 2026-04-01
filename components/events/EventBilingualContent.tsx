"use client";

/**
 * EventBilingualContent
 *
 * A client component that listens for language toggle events from EventHeroText
 * and renders the appropriate translated version of body content sections.
 *
 * It reads the same localStorage key ("evd-lang-pref") that EventHeroText writes,
 * and listens to the "evd-lang-change" custom event dispatched on toggle.
 */

import { useEffect, useState } from "react";

export interface BilingualTranslation {
  longDescription?: string;
  artistNote?: string;
  artistNoteBy?: string;
  impactBlurb?: string;
  videoTitle?: string;
  pressQuotes?: { text: string; attribution: string }[];
}

interface EventBilingualContentProps {
  defaultLang: string;
  availableLangs: string[];
  /** Base-language (default) content */
  base: BilingualTranslation;
  /** All alternate translations keyed by language code */
  translations: Record<string, BilingualTranslation>;
  /** Render prop: receives the resolved content for the current language */
  children: (resolved: BilingualTranslation) => React.ReactNode;
}

const STORAGE_KEY = "evd-lang-pref";

export default function EventBilingualContent({
  defaultLang,
  availableLangs,
  base,
  translations,
  children,
}: EventBilingualContentProps) {
  const [activeLang, setActiveLang] = useState(defaultLang);

  useEffect(() => {
    // Read saved preference on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && availableLangs.includes(saved)) {
        setActiveLang(saved);
        return;
      }
      const browserLang = navigator.language?.split("-")[0]?.toLowerCase();
      if (browserLang && availableLangs.includes(browserLang) && browserLang !== defaultLang) {
        setActiveLang(browserLang);
      }
    } catch {
      // localStorage unavailable
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onLangChange(e: Event) {
      const lang = (e as CustomEvent<{ lang: string }>).detail?.lang;
      if (lang && availableLangs.includes(lang)) {
        setActiveLang(lang);
      }
    }
    window.addEventListener("evd-lang-change", onLangChange);
    return () => window.removeEventListener("evd-lang-change", onLangChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge translation overrides on top of base content
  const overrides = activeLang !== defaultLang ? (translations[activeLang] ?? {}) : {};
  const resolved: BilingualTranslation = {
    longDescription: overrides.longDescription ?? base.longDescription,
    artistNote: overrides.artistNote ?? base.artistNote,
    artistNoteBy: overrides.artistNoteBy ?? base.artistNoteBy,
    impactBlurb: overrides.impactBlurb ?? base.impactBlurb,
    videoTitle: overrides.videoTitle ?? base.videoTitle,
    pressQuotes: overrides.pressQuotes ?? base.pressQuotes,
  };

  return <>{children(resolved)}</>;
}
