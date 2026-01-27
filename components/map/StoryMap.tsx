"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import Supercluster from "supercluster";
import { clientDebug, clientWarn } from "@/lib/clientDebug";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

/* ===========================
   Constants / Cluster tuning
   =========================== */
const CLUSTER_MAX_ZOOM = 18;
const CLUSTER_MIN_POINTS = 2;
// Target geographic radius for clustering: ~50 miles
const CLUSTER_DISTANCE_MILES = 50;

// Page background behind globe (transparent per your current design)
const DAT_BLUE = "transparent";
const DEBUG = String(process.env.SHOW_DAT_DEBUG || "").toLowerCase() === "true";

/* ===========================
   Types
   =========================== */
type FeatureProps = {
  Title: string;
  Program: string;
  "Location Name": string;
  Country: string;
  "Year(s)": string;
  Partners: string;
  "Image URL": string;
  Quote: string;
  "Quote Author": string;
  "Short Story": string;
  Author: string;
  authorSlug: string;
  "More Info Link": string;
  "Story URL": string;
  Slug: string;
  category: string;
};
type Feature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: FeatureProps;
};

const colorMap: Record<string, string> = {
  highlight: "#FFCC00",
  alumni: "#6C00AF",
  hub: "#F23359",
};

/* ===========================
   Helpers
   =========================== */
const isSmallScreen = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 640px)").matches;

function normalize(s: string) {
  return s
    ? s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    : "";
}

const toNum = (v: unknown) => {
  if (v == null) return NaN;
  let s = String(v).trim();
  s = s.replace(/[–—]/g, "-").replace(/\s+/g, "").replace(/,/g, "");
  return parseFloat(s);
};

// meters-per-pixel at given lat/zoom (Web Mercator)
const metersPerPixel = (lat: number, zoom: number) =>
  (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);

// Convert miles to supercluster pixel radius for the current map center & zoom
const milesToPixelRadius = (miles: number, zoom: number, lat: number) => {
  const meters = miles * 1609.344;
  const mpp = metersPerPixel(lat, zoom);
  return Math.max(6, Math.min(120, Math.round(meters / mpp)));
};

// Popup offset that feels right on each form factor
const popupOffsetY = () => (isSmallScreen() ? 140 : 220);

function createPopupHTML(d: FeatureProps) {
  let media = "";
  const url = d["Image URL"] || "";
  const vid = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
  if (vid) {
    media = `<div class="popup-video"><iframe src="https://www.youtube.com/embed/${vid[1]}" allowfullscreen></iframe></div>`;
  } else if (url) {
    media = `<img class="popup-image" src="${url}" alt="${d.Title}" onerror="this.remove()" />`;
  }

  const maxLength = 225;
  const shortStory = d["Short Story"] || "";
  let displayStory =
    shortStory.length > maxLength
      ? shortStory.slice(0, maxLength).trim() + "…"
      : shortStory;

  const slug = (d["Slug"] || "").trim();

  // ✅ IMPORTANT: stay same-origin (localhost in dev / current host in prod)
  const fullStoryURL = slug ? `/story/${encodeURIComponent(slug)}` : "";

  if (slug) {
    const author = d.Author
      ? d["authorSlug"]
        ? `<a href="${d["authorSlug"]}" rel="noopener noreferrer" style="color:#6C00AF; text-decoration:underline;">${d.Author}</a>`
        : d.Author
      : "";

    const metaLine = `
      <div style='display:flex; justify-content:space-between; align-items:flex-start; font-size:0.75rem; gap:.75rem;'>
        <div style='font-family:var(--font-space-grotesk), system-ui, sans-serif; font-weight:bold; color:#6C00AF;'>${
          author ? `By ${author}` : ""
        }</div>
        <a
          href="#"
          data-explore-story="1"
          data-href='${fullStoryURL}'
          target="_self"
          rel="noopener"
          style='font-family:var(--font-rock-salt), cursive; color:#F23359; font-weight:600; text-decoration:none; font-size:1rem; margin-top:0.35rem; margin-bottom:0.9rem;'
        >
          Explore the Story →
        </a>

      </div>
    `;
    displayStory += metaLine;
  }

  return `
    ${
      d["Location Name"]
        ? `<div class="popup-location">${d["Location Name"]}</div>`
        : ""
    }
    ${d.Title ? `<div class="popup-title">${d.Title}</div>` : ""}
    ${
      d.Program || d.Country || d["Year(s)"]
        ? `<div class="popup-program">
             ${d.Program || ""}${
            d.Country ? `: ${d.Country}` : ""
          }${d["Year(s)"] ? ` ${d["Year(s)"]}` : ""}
           </div>`
        : ""
    }
    ${media}
    ${
      d.Partners
        ? `<div class="popup-partners">Created in collaboration with ${d.Partners}, rooted in a shared vision.</div>`
        : ""
    }
    ${d.Quote ? `<div class="popup-quote">&ldquo;${d.Quote}&rdquo;</div>` : ""}
    ${
      d["Quote Author"]
        ? `<div class="popup-quote-author">– ${d["Quote Author"]}</div>`
        : ""
    }
    ${displayStory ? `<div class="popup-story">${displayStory}</div>` : ""}
    ${
      d["More Info Link"]
        ? `<a class="popup-button" href="${d["More Info Link"]}" target="_blank" rel="noopener noreferrer" style="font-family:var(--font-space-grotesk), system-ui, sans-serif; font-weight:700;">
             STEP INTO THE STORY
           </a>`
        : ""
    }
  `;
}

/* ===========================
   API -> Feature mapping
   =========================== */
type ApiStory = Record<string, any>;

function asStr(v: any): string {
  return v == null ? "" : String(v);
}

function pickFirst(row: any, keys: string[]): string {
  for (const k of keys) {
    const v = row?.[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function toFeaturePropsFromRow(row: any): FeatureProps {
  const title = pickFirst(row, ["Title", "title"]);
  const program = pickFirst(row, ["Program", "program"]);

  const locationName = pickFirst(row, [
    "Location Name",
    "LocationName",
    "locationName",
    "location_name",
    "location",
    "Location",
  ]);

  const country = pickFirst(row, ["Country", "country"]);

  const years = pickFirst(row, [
    "Year(s)",
    "Years",
    "year(s)",
    "years",
    "yearRange",
    "year_range",
    "year",
    "Year",
  ]);

  const partners = pickFirst(row, ["Partners", "partners"]);

  const shortStory = pickFirst(row, [
    "Short Story",
    "ShortStory",
    "shortStory",
    "short_story",
    "story",
    "Story",
  ]);

  const quote = pickFirst(row, ["Quote", "quote"]);
  const quoteAuthor = pickFirst(row, [
    "Quote Author",
    "QuoteAuthor",
    "quoteAuthor",
    "quote_author",
  ]);

  const imageUrl = pickFirst(row, [
    "Image URL",
    "ImageURL",
    "imageUrl",
    "image_url",
    "image",
    "Image",
  ]);

  const author = pickFirst(row, ["Author", "author"]);
  const authorSlug = pickFirst(row, ["authorSlug", "AuthorSlug", "author_slug"]);

  const moreInfo = pickFirst(row, [
    "More Info Link",
    "MoreInfoLink",
    "moreInfoLink",
    "more_info_link",
    "Link",
    "link",
  ]);

  const storyUrl = pickFirst(row, [
    "Story URL",
    "StoryURL",
    "storyUrl",
    "story_url",
  ]);
  const slug = pickFirst(row, ["slug", "Slug"]);
  const category = pickFirst(row, ["Category", "category"]);

  return {
    Title: title,
    Program: program,
    "Location Name": locationName,
    Country: country,
    "Year(s)": years,
    Partners: partners,
    "Image URL": imageUrl,
    Quote: quote,
    "Quote Author": quoteAuthor,
    "Short Story": shortStory,
    Author: author,
    authorSlug: authorSlug,
    "More Info Link": moreInfo,
    "Story URL": storyUrl,
    Slug: slug,
    category: category ? category.toLowerCase().trim() : "",
  };
}

function toNumberStrict(v: any): number {
  if (typeof v === "number") return v;
  return toNum(v);
}

async function fetchStoriesAsFeatures(): Promise<Feature[]> {
  const res = await fetch("/api/stories", { cache: "no-store" });
  if (!res.ok) throw new Error(`API /api/stories failed: ${res.status}`);

  const data = await res.json();
  if (DEBUG) clientDebug("[StoryMap] /api/stories raw keys:", Object.keys(data || {}));
  if (DEBUG) clientDebug("[StoryMap] /api/stories sample:", (data?.stories || [])[0]);
  if (DEBUG)
    clientDebug(
      "[StoryMap] /api/stories count:",
      Array.isArray(data?.stories) ? data.stories.length : "not-array"
    );

  if (!data?.ok || !Array.isArray(data?.stories)) {
    throw new Error("API /api/stories returned unexpected shape");
  }

  const feats: Feature[] = [];
  for (const row of data.stories as ApiStory[]) {
    const lat = toNumberStrict(
      row.lat ?? row.Lat ?? row.latitude ?? row.Latitude ?? row.Latitude ?? row["Latitude"]
    );

    const lng = toNumberStrict(
      row.lng ??
        row.Lng ??
        row.longitude ??
        row.Longitude ??
        row["Longitude"] ??
        row.lon ??
        row.Lon ??
        row.long ??
        row.Long
    );

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const props = toFeaturePropsFromRow(row);
    if (!props.Title) props.Title = asStr(row.title ?? "");
    if (!props.Slug) props.Slug = asStr(row.slug ?? "");

    feats.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: props,
    });
  }

  return feats;
}

async function fetchFallbackStoriesCsv(): Promise<Feature[]> {
  const res = await fetch("/fallback/Clean Map Data.csv", { cache: "no-store" });
  if (DEBUG) clientDebug("[StoryMap] fallback CSV status:", res.status, res.statusText);
  if (!res.ok) return [];

  const csvText = await res.text();

  // Minimal CSV parser (same logic as API route, client-safe)
  function parseCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = "";
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
        continue;
      }

      if (ch === "," && !inQ) {
        out.push(cur);
        cur = "";
        continue;
      }

      cur += ch;
    }

    out.push(cur);
    return out;
  }

  function csvToObjects(csv: string): any[] {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .filter((l) => l.length > 0);

    if (!lines.length) return [];

    const headers = parseCsvLine(lines[0]).map((h) =>
      String(h ?? "").replace(/^\uFEFF/, "").trim()
    );

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = (cols[idx] ?? "").trim();
      });
      rows.push(obj);
    }
    return rows;
  }

  const rows = csvToObjects(csvText);

  const feats: Feature[] = [];
  for (const row of rows) {
    // Respect "Show on Map?" (optional but in your headers)
    const showRaw =
      row["Show on Map?"] ?? row["ShowOnMap?"] ?? row["showOnMap"] ?? "";
    const show = String(showRaw).trim().toLowerCase();
    if (show && !["y", "yes", "true", "1"].includes(show)) continue;

    const lat = toNumberStrict(row.Latitude ?? row.lat ?? row.Lat ?? row["Latitude"]);
    const lng = toNumberStrict(row.Longitude ?? row.lng ?? row.Lng ?? row["Longitude"]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const props = toFeaturePropsFromRow(row);
    if (!props.Title) props.Title = asStr(row.Title ?? row.title ?? "");
    if (!props.Slug) props.Slug = asStr(row.slug ?? row.Slug ?? "");

    feats.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: props,
    });
  }

  if (DEBUG) clientDebug("[StoryMap] fallback feats:", feats.length);

  return feats;
}

/* ===========================
   Component
   =========================== */
export type StoryMapProps = {
  hideSearch?: boolean;
  initialZoom?: number;
};

export default function StoryMap({
  hideSearch = false,
  initialZoom = 1.2,
}: StoryMapProps) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Zoom hint (dismiss forever after first modifier-zoom)
  const [showZoomHint, setShowZoomHint] = useState<boolean>(() => {
    try {
      return localStorage.getItem("dat:zoom-hint-dismissed") !== "1";
    } catch {
      return true;
    }
  });

  const showZoomHintRef = useRef(showZoomHint);

  useEffect(() => {
    showZoomHintRef.current = showZoomHint;
  }, [showZoomHint]);

  const [menuOpenDetected, setMenuOpenDetected] = useState(false);

  // Coachmark state
  const [showCoach, setShowCoach] = useState<boolean>(() => {
    try {
      return localStorage.getItem("dat:storymap-coach-dismissed") !== "1";
    } catch {
      return true;
    }
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);
  const featuresRef = useRef<Feature[]>([]);
  const indexRef = useRef<Supercluster<any, any> | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const currentPopupRef = useRef<mapboxgl.Popup | null>(null);
  const currentPopupCoords = useRef<[number, number] | null>(null);
  const sharedPopupRef = useRef<mapboxgl.Popup | null>(null);
  const currentRadiusRef = useRef<number>(28);
  const onZoomOrMoveRef = useRef<(() => void) | null>(null);
  const renderClustersRef = useRef<() => void>(() => {});

  /* ===========================
     Styles
     =========================== */
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-storymap-styles", "true");
    style.innerHTML = `
      .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display:none!important; }

      .mapboxgl-popup { z-index: 10; }

      .storymap-map { position: relative; }
      .storymap-overlay { position:absolute; inset:0; pointer-events:none; z-index: 5; }
      .storymap-overlay > * { pointer-events:auto; }

      .mapboxgl-ctrl-top-right, .mapboxgl-ctrl-bottom-right,
      .mapboxgl-ctrl-top-left, .mapboxgl-ctrl-bottom-left { z-index:4 !important; }

      #storymap-search-toggle, #storymap-search-box { position:absolute; top:10px; }
      #storymap-search-toggle {
        right:50px; width:38px; height:38px; background:#f2f2f2; border:1px solid #ccc;
        border-radius:6px; display:flex; align-items:center; justify-content:center;
        cursor:pointer; font-size:1.25rem; box-shadow:0 2px 6px rgba(0,0,0,.08);
      }
      #storymap-search-box {
        right:100px; height:38px; width:0; opacity:0; overflow:hidden;
        transition:width .3s ease, opacity .3s ease; backdrop-filter:blur(6px);
        background:rgba(255,255,255,0.7); border:1px solid #ccc; border-radius:8px;
      }
      #storymap-search-box.expanded { width:280px; opacity:1; }
      @media (max-width:450px) { #storymap-search-box.expanded { width:80vw!important; } }
      #storymap-search-input {
        width:100%; height:100%;
        padding:0 10px;
        border:none; background:transparent; font-size:16px; outline:none;
      }

      html[data-menu-open="true"] #storymap-search-toggle,
      html[data-menu-open="true"] #storymap-search-box,
      body.menu-open #storymap-search-toggle,
      body.menu-open #storymap-search-box,
      body.nav-open #storymap-search-toggle,
      body.nav-open #storymap-search-box,
      body.header-open #storymap-search-toggle,
      body.header-open #storymap-search-box,
      [data-header-open="true"] #storymap-search-toggle,
      [data-header-open="true"] #storymap-search-box { display:none !important; }

      .mapboxgl-marker, .mapboxgl-marker * { pointer-events:auto!important; cursor:pointer!important; }
      .cluster-marker {
        width:40px; height:40px; background:#FFCC00; color:#000; border-radius:50%;
        display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold;
        pointer-events:auto!important; cursor:pointer!important; box-shadow:0 2px 8px rgba(0,0,0,.12);
      }

      .mapboxgl-canvas {
        filter: drop-shadow(0 18px 44px rgba(0,0,0,0.35))
                drop-shadow(0 3px 12px rgba(0,0,0,0.18));
        background: transparent !important;
        will-change: filter;
      }

      .mapboxgl-popup { max-width: none !important; }
      .mapboxgl-popup-content {
        position: relative;
        background: #fff; color: #111; text-align: left;
        border-radius: 24px !important; box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        padding: 0.75rem 1.5rem 1.5rem;
        max-width: 92vw !important;
      }
      .mapboxgl-popup-tip { display: none !important; }
      .mapboxgl-popup-content::after {
        content: "";
        position: absolute;
        left: 50%; transform: translateX(-50%);
        bottom: -11px;
        width: 0; height: 0;
        border-left: 12px solid transparent;
        border-right: 12px solid transparent;
        border-top: 12px solid #fff;
        filter: drop-shadow(0 2px 0px rgba(0,0,0,0.15));
      }
      .mapboxgl-popup-close-button { display: none !important; }
      .mapboxgl-popup-content > *:first-child { margin-top: 0 !important; }

      @media (min-width:1024px){ .mapboxgl-popup-content { width:640px!important; } }
      @media (max-width: 640px){
        .mapboxgl-popup-content { width: 90vw!important; max-width: 90vw!important; }
        .popup-video { height: 160px; }
      }

      .popup-location { font-family:var(--font-space-grotesk),system-ui,sans-serif; font-size:.75rem; text-align:right; margin-bottom:.4rem; }
      .popup-title { font-family: var(--font-anton), system-ui, sans-serif; font-size:2.1rem; font-weight:580; text-transform:uppercase; line-height:1; margin-bottom:.4rem; background:#FFCC00; padding:.2rem .4rem; display:inline-block; }
      .popup-program { font-family:var(--font-space-grotesk),system-ui,sans-serif; font-size:1rem; margin-bottom:.75rem; }
      .popup-video { width:100%; height:200px; margin-bottom:.75rem; }
      .popup-video iframe { width:100%; height:100%; border:none; border-radius:16px; }
      .popup-image { width:100%; border-radius:16px; margin-bottom:0rem; }
      .popup-partners { font-family:var(--font-dm-sans),system-ui,sans-serif; font-size:.7rem; font-style:italic; text-align:right; margin:0 0 .75rem; line-height:1; }
      .popup-quote { font-family:var(--font-space-grotesk),system-ui,sans-serif; font-size:1.4rem; font-style:italic; margin:.75rem 2rem .25rem; }
      .popup-quote-author { font-family:var(--font-dm-sans),system-ui,sans-serif; font-size:.8rem; margin:.25rem 3rem 1rem; }
      .popup-story { font-family:var(--font-dm-sans),system-ui,sans-serif; font-size:1rem; margin:0.5rem 0; }

      .popup-button {
        display:block; width:100%; box-sizing:border-box; padding:.9rem 1rem; text-align:center;
        background:#194d56; color:#fff; text-decoration:none;
        font-family:var(--font-space-grotesk),system-ui,sans-serif; font-size:1rem; letter-spacing:.25em;
        border-radius:8px; text-transform:uppercase; transition:background .2s ease, transform .05s ease;
      }
      .popup-button:hover { background:#123a40; text-decoration:none; }
      .popup-button:active { transform: scale(.99); }

      .storymap-coachmark {
        position: absolute;
        top: 12px;
        right: 120px;
        z-index: 6;
        max-width: 320px;
        background: #241123;
        color: #f2f2f2;
        opacity: 0.9;
        padding: 10px 12px;
        border-radius: 14px;
        box-shadow: 0 6px 22px rgba(0,0,0,0.25);
        backdrop-filter: blur(4px);
        font-family: var(--font-space-grotesk), system-ui, sans-serif;
        font-size: 15px;
        line-height: 1.3;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        animation: coach-fade 220ms ease-out;
        pointer-events: auto;
      }
      .storymap-coachmark::after {
        content: "";
        position: absolute;
        top: 16px;
        right: -10px;
        border-width: 10px 0 10px 10px;
        border-style: solid;
        border-color: transparent transparent transparent rgba(36,17,35,0.95);
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.25));
      }
      .storymap-coachmark .coach-title { font-weight: 700; letter-spacing: .02em; opacity: .98; }
      @keyframes coach-fade { from { opacity: 0; transform: translateY(-2px); }
                              to   { opacity: 1; transform: translateY(0); } }

      @media (max-width: 640px) {
        .storymap-coachmark {
          top: calc(64px + env(safe-area-inset-top, 0px));
          right: auto;
          left: 50%;
          transform: translateX(-50%);
          width: auto;
          max-width: min(98vw, 640px);
          padding: 12px 16px;
          font-size: 15px;
          text-align: left;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        .storymap-coachmark::after { display: none; }
      }

      .zoom-hint {
        position: absolute; left: 12px; top: 12px;
        background: #241123; opacity: 0.6; color: #f2f2f2;  padding: 6px 10px; border-radius: 10px;
        font-size: 12px; font-family: var(--font-space-grotesk), DM sans, sans-serif;
        user-select: none;
        z-index: 6;
      }
      @media (max-width: 640px), (pointer: coarse) {
        .zoom-hint { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, []);

  /* ===========================
     Coachmark: show once, auto-dismiss
     =========================== */
  useEffect(() => {
    if (!showCoach) return;

    const t = setTimeout(() => {
      setShowCoach(false);
      try {
        localStorage.setItem("dat:storymap-coach-dismissed", "1");
      } catch {}
    }, 6500);

    return () => clearTimeout(t);
  }, [showCoach]);

  /* ===========================
     Detect header menu open/close
     =========================== */
  useEffect(() => {
    (window as any).DAT_SET_MENU_OPEN = (open: boolean) => {
      document.documentElement.setAttribute("data-menu-open", open ? "true" : "false");
    };

    const compute = () => {
      const docEl = document.documentElement;
      const body = document.body;
      const attrOpen =
        docEl.getAttribute("data-menu-open") === "true" ||
        body.getAttribute("data-header-open") === "true";
      const classOpen =
        body.classList.contains("menu-open") ||
        body.classList.contains("nav-open") ||
        body.classList.contains("header-open");
      const ariaOpen = !!document.querySelector(
        '#menu[aria-expanded="true"], [aria-controls="nav"][aria-expanded="true"]'
      );
      const dataOpen = !!document.querySelector('[data-header-open="true"], [data-menu="open"]');
      return attrOpen || classOpen || ariaOpen || dataOpen;
    };

    const update = () => setMenuOpenDetected(compute());
    update();

    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-menu-open"],
    });
    mo.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-header-open"],
      childList: true,
      subtree: true,
    });

    const onOpen = () => setMenuOpenDetected(true);
    const onClose = () => setMenuOpenDetected(false);
    window.addEventListener("dat:menu-open", onOpen);
    window.addEventListener("dat:menu-close", onClose);

    return () => {
      mo.disconnect();
      window.removeEventListener("dat:menu-open", onOpen);
      window.removeEventListener("dat:menu-close", onClose);
    };
  }, []);

  /* ===========================
   Popup link navigation (global, reliable)
   =========================== */
useEffect(() => {
  const onDocClickCapture = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const link = target.closest('a[data-explore-story="1"]') as HTMLAnchorElement | null;
    if (!link) return;

    // Don’t let Mapbox / map click handlers eat this
    e.preventDefault();
    e.stopPropagation();

    link.setAttribute("target", "_self");
    link.removeAttribute("rel");

    const href =
      link.getAttribute("data-href") ||
      link.getAttribute("href") ||
      "";

    if (!href) return;
    // Force same-tab navigation
    window.location.href = href;
  };

  // Capture phase is key: we run before Mapbox handlers
  document.addEventListener("click", onDocClickCapture, true);

  return () => {
    document.removeEventListener("click", onDocClickCapture, true);
  };
}, []);


  /* ===========================
     Map init
     =========================== */
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return;

    const map = new mapboxgl.Map({
      container: mapEl.current,
      style: "mapbox://styles/dramaticadventure/cm977ygqf001901qm4a76aaa3",
      center: [0, 20],
      zoom: initialZoom,
      minZoom: 1,
      projection: "globe",
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false, showCompass: false }),
      "top-right"
    );
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");

    map.dragPan.enable();
    map.touchZoomRotate.enable();
    map.touchZoomRotate.disableRotation();

    if (isSmallScreen()) {
      const targetZoom = Math.max(initialZoom - 0.2, 0.5);
      map.setZoom(targetZoom);
    }

    map.scrollZoom.disable();
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (!(map.scrollZoom as any)._enabled) map.scrollZoom.enable();
        if (showZoomHintRef.current) {
          showZoomHintRef.current = false;
          setShowZoomHint(false);
          try {
            localStorage.setItem("dat:zoom-hint-dismissed", "1");
          } catch {}
        }
      } else {
        if ((map.scrollZoom as any)._enabled) map.scrollZoom.disable();
      }
    };
    map.getCanvas().addEventListener("wheel", wheelHandler, { passive: true });

    const resizeHandler = () => {
      try {
        map.resize();
      } catch {}
    };
    window.addEventListener("resize", resizeHandler);
    window.addEventListener("orientationchange", resizeHandler);

    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      if (!currentPopupRef.current) return;

      const target = (e.originalEvent as MouseEvent).target as HTMLElement | null;
      if (!target) return;

      // If the click is inside the popup or on a marker/cluster, do nothing
      if (
        target.closest(".mapboxgl-popup") ||
        target.closest(".mapboxgl-marker") ||
        target.closest(".cluster-marker")
      ) {
        return;
      }

      // Otherwise close
      currentPopupRef.current.remove();
      currentPopupRef.current = null;
      currentPopupCoords.current = null;
    };
    map.on("click", clickHandler);

    mapRef.current = map;

    const globalMouseUp = () => {
      try {
        map.dragPan.enable();
      } catch {}
    };
    window.addEventListener("mouseup", globalMouseUp);

    return () => {
      map.getCanvas().removeEventListener("wheel", wheelHandler);
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("orientationchange", resizeHandler);
      map.off("click", clickHandler);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      window.removeEventListener("mouseup", globalMouseUp);
      map.remove();
      mapRef.current = null;
    };
  }, [initialZoom]);

  /* ===========================
     Data load from API + JSON fallback
     =========================== */

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;

    let canceled = false;

    const loadData = async () => {
      const attachZoomMoveHandler = () => {
        const onZoomOrMove = () => {
          const desired = milesToPixelRadius(
            CLUSTER_DISTANCE_MILES,
            m.getZoom(),
            m.getCenter().lat
          );

          if (desired !== currentRadiusRef.current) {
            currentRadiusRef.current = desired;
            indexRef.current = new Supercluster({
              radius: desired,
              maxZoom: CLUSTER_MAX_ZOOM,
              minPoints: CLUSTER_MIN_POINTS,
              map: (props: any) => props,
              reduce: () => {},
            });
            indexRef.current.load(featuresRef.current as any);
          }

          renderClustersRef.current();
        };

        // Detach previous handler if any
        if (onZoomOrMoveRef.current) {
          m.off("moveend", onZoomOrMoveRef.current);
          m.off("zoomend", onZoomOrMoveRef.current);
        }

        // Store + attach new handler
        onZoomOrMoveRef.current = onZoomOrMove;
        m.on("moveend", onZoomOrMove);
        m.on("zoomend", onZoomOrMove);
      };

      try {
        let feats = await fetchStoriesAsFeatures();
        if (!feats || feats.length === 0) {
          feats = await fetchFallbackStoriesCsv();
        }
        if (canceled) return;

        featuresRef.current = feats || [];

        const z = m.getZoom();
        const lat = m.getCenter().lat;
        const r = milesToPixelRadius(CLUSTER_DISTANCE_MILES, z, lat);
        currentRadiusRef.current = r;

        indexRef.current = new Supercluster({
          radius: r,
          maxZoom: CLUSTER_MAX_ZOOM,
          minPoints: CLUSTER_MIN_POINTS,

          // Keep full props for non-cluster points
          map: (props: any) => props,
          reduce: () => {},
        });
        indexRef.current.load((feats || []) as any);
        renderClusters();

        attachZoomMoveHandler();

        clientDebug("[StoryMap] Loaded features:", feats.length);
      } catch (err) {
        clientWarn("[StoryMap] API load failed:", err);

        try {
          const feats = await fetchFallbackStoriesCsv();
          if (canceled) return;

          if (feats?.length) {
            featuresRef.current = feats;

            const z = m.getZoom();
            const lat = m.getCenter().lat;
            const r = milesToPixelRadius(CLUSTER_DISTANCE_MILES, z, lat);
            currentRadiusRef.current = r;

            indexRef.current = new Supercluster({
              radius: r,
              maxZoom: CLUSTER_MAX_ZOOM,
              minPoints: CLUSTER_MIN_POINTS,
              map: (props: any) => props,
              reduce: () => {},
            });
            indexRef.current.load((feats || []) as any);
            renderClusters();

            attachZoomMoveHandler();
          }
        } catch {}
      }
    };

    const onMapLoad = () => loadData();
    if (m.loaded()) loadData();
    else m.on("load", onMapLoad);

    return () => {
      canceled = true;
      m.off("load", onMapLoad);

      const handler = onZoomOrMoveRef.current;
      if (handler) {
        m.off("moveend", handler);
        m.off("zoomend", handler);
      }
    };
  }, []);

  /* ===========================
     Render clusters / markers
     =========================== */
  const renderClusters = () => {
    const m = mapRef.current as mapboxgl.Map | null;
    const index = indexRef.current;
    if (!m || !index) return;

    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = [];

    const z = Math.floor(m.getZoom());

    const b = (m.getBounds?.() as mapboxgl.LngLatBounds | null) || null;
    if (
      !b ||
      typeof b.getSouthWest !== "function" ||
      typeof b.getNorthEast !== "function"
    ) {
      return;
    }
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    const bounds: [number, number, number, number] = [sw.lng, sw.lat, ne.lng, ne.lat];

    const clusters = index.getClusters(bounds, z);

    clusters.forEach((c: any) => {
      const [lon, lat] = c.geometry.coordinates as [number, number];

      if (c.properties.cluster) {
        const el = document.createElement("div");
        el.className = "cluster-marker";
        el.textContent = String(c.properties.point_count);
        el.onclick = () => {
          if (currentPopupRef.current) {
            currentPopupRef.current.remove();
            currentPopupRef.current = null;
          }
          currentPopupCoords.current = null;
          const nextZoom = Math.min(m.getZoom() + 3, 18);
          m.easeTo({
            center: [lon, lat],
            zoom: nextZoom,
            offset: [0, popupOffsetY()],
            duration: 500,
          });
        };
        el.addEventListener("mousedown", () => m.dragPan.disable());
        el.addEventListener("mouseup", () => m.dragPan.enable());
        el.addEventListener("mouseleave", () => m.dragPan.enable());

        const mk = new mapboxgl.Marker({ element: el }).setLngLat([lon, lat]).addTo(m);
        markersRef.current.push(mk);
      } else {
        const props = c.properties as FeatureProps;

        const mk = new mapboxgl.Marker({ color: colorMap[props.category] || "#3FB1CE" })
          .setLngLat([lon, lat])
          .addTo(m);

        mk.getElement().addEventListener("click", (e) => {
          e.stopPropagation();
          (e as any).preventDefault?.();

          // Close any existing popup (shared)
          if (sharedPopupRef.current) {
            sharedPopupRef.current.remove();
          }

          // Create (once) + reuse a single popup not tied to markers
          if (!sharedPopupRef.current) {
            sharedPopupRef.current = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              closeOnMove: false,
              anchor: "bottom",
              offset: 11,
            });

            sharedPopupRef.current.on("close", () => {
              if (currentPopupRef.current === sharedPopupRef.current) {
                currentPopupRef.current = null;
                currentPopupCoords.current = null;
              }
            });
          }

          sharedPopupRef.current
            .setLngLat([lon, lat])
            .setHTML(createPopupHTML(props))
            .addTo(m);

          currentPopupRef.current = sharedPopupRef.current;
          currentPopupCoords.current = [lon, lat];

          m.easeTo({ center: [lon, lat], offset: [0, popupOffsetY()], duration: 300 });
        });

        mk.getElement().addEventListener("mousedown", () => m.dragPan.disable());
        mk.getElement().addEventListener("mouseup", () => m.dragPan.enable());
        mk.getElement().addEventListener("mouseleave", () => m.dragPan.enable());

        markersRef.current.push(mk);
      }
    });
  };

  // Keep ref pointing at the latest renderClusters implementation
  renderClustersRef.current = renderClusters;

  /* ===========================
     Search
     =========================== */
  const filterMarkers = (q: string) => {
    const exact = [...q.matchAll(/"([^"]+)"/g)].map((m) => normalize(m[1]));
    const rest = q.replace(/"[^"]+"/g, "");
    const terms = normalize(rest)
      .split(/\s+|,/)
      .filter(Boolean);

    const features = featuresRef.current;
    const filtered =
      exact.length || terms.length
        ? features.filter((f) => {
            const txt = normalize(
              Object.values(f.properties)
                .map((v) => (v == null ? "" : String(v)))
                .join(" ")
            );
            if (!exact.every((e) => txt.includes(e))) return false;
            return terms.length ? terms.some((t) => txt.includes(t)) : true;
          })
        : features;

    const m = mapRef.current;
    if (!m) return;

    const r = milesToPixelRadius(
      CLUSTER_DISTANCE_MILES,
      m.getZoom(),
      m.getCenter().lat
    );
    currentRadiusRef.current = r;

    indexRef.current = new Supercluster({
      radius: r,
      maxZoom: CLUSTER_MAX_ZOOM,
      minPoints: CLUSTER_MIN_POINTS,
      map: (props: any) => props,
      reduce: () => {},
    });
    indexRef.current.load(filtered as any);
    if (currentPopupRef.current) {
      currentPopupRef.current.remove();
      currentPopupRef.current = null;
      currentPopupCoords.current = null;
    }
    renderClusters();

    if (filtered.length === 1) {
      m.flyTo({
        center: filtered[0].geometry.coordinates,
        zoom: 8,
        duration: 500,
      });
    } else if (filtered.length > 1) {
      const cs = filtered.map((f) => f.geometry.coordinates);
      const lons = cs.map((c) => c[0]);
      const lats = cs.map((c) => c[1]);
      m.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        {
          padding: { top: 80, right: 60, bottom: 120, left: 60 },
          duration: 500,
        }
      );
    }
  };

  const shouldHideSearch = hideSearch || menuOpenDetected;

  return (
    <div style={{ background: DAT_BLUE }}>
      <div
        ref={mapEl}
        className="storymap-map"
        style={{
          width: "100%",
          height: "min(100dvh, 100svh, 100vh)",
          overflow: "visible",
          borderRadius: 12,
        }}
      >
        <div className="storymap-overlay">
          {/* Coachmark */}
          {showCoach && !shouldHideSearch && (
            <div
              className="storymap-coachmark"
              role="region"
              aria-label="Map navigation tips"
            >
              <div className="coach-title">Navigate our Story Map</div>

              <div style={{ gridColumn: "1 / -1", opacity: 0.85 }}>
                Search locations, zoom in, or go full screen.
              </div>
            </div>
          )}

          {/* Zoom hint */}
          {showZoomHint && (
            <div className="zoom-hint">
              Hold{" "}
              {typeof navigator !== "undefined" &&
              /Mac/i.test(navigator.platform)
                ? "⌘"
                : "Ctrl"}{" "}
              to zoom the map
            </div>
          )}

          {/* Search (hidden while menu is open) */}
          {!shouldHideSearch && (
            <>
              <div
                id="storymap-search-toggle"
                onClick={() => setSearchOpen((v) => !v)}
                role="button"
                aria-label="Toggle search"
                title="Search"
              >
                🔍
              </div>

              <div
                id="storymap-search-box"
                className={searchOpen ? "expanded" : ""}
              >
                <input
                  id="storymap-search-input"
                  placeholder='Search stories, countries, programs… (use quotes for exact: "Ecuador")'
                  value={query}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuery(val);
                    if (debounceTimer.current)
                      clearTimeout(debounceTimer.current);
                    debounceTimer.current = setTimeout(
                      () => filterMarkers(val),
                      300
                    );
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {process.env.NODE_ENV !== "production" && DEBUG && (
        <div
          style={{
            position: "fixed",
            bottom: 12,
            right: 12,
            zIndex: 10001,
            background: "rgba(0,0,0,.7)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "monospace",
          }}
        >
          feats: {featuresRef.current.length.toString()}
        </div>
      )}
    </div>
  );
}
