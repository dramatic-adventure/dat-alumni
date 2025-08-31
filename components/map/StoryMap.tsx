"use client";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import Papa from "papaparse";
import Supercluster from "supercluster";

// Mapbox token from env (no hardcoding)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

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

function normalize(s: string) {
  return s ? s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase() : "";
}

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
  let displayStory = shortStory.length > maxLength ? shortStory.slice(0, maxLength).trim() + "…" : shortStory;

  const slug = (d["Slug"] || "").trim();
  const fullStoryURL = slug ? `https://stories.dramaticadventure.com/story/${slug}` : "";

  if (slug) {
    const author = d.Author
      ? d["authorSlug"]
        ? `<a href="${d["authorSlug"]}" target="_blank" rel="noopener noreferrer" style="color:#6C00AF; text-decoration:underline;">${d.Author}</a>`
        : d.Author
      : "";

    const metaLine = `
      <div style='display:flex; justify-content:space-between; align-items:flex-start; font-size:0.75rem;'>
        <div style='font-family:var(--font-space-grotesk), system-ui, sans-serif; font-weight:bold; color:#6C00AF;'>${author ? `By ${author}` : ""}</div>
        <a href='${fullStoryURL}' target='_blank' style='font-family:var(--font-rock-salt), cursive; color:#F23359; font-weight:600; text-decoration:none; font-size:1rem; margin-top:0.35rem; margin-bottom:0.9rem;'>Explore the Story →</a>
      </div>
    `;
    displayStory += metaLine;
  }

  return `
    ${d["Location Name"] ? `<div class="popup-location">${d["Location Name"]}</div>` : ""}
    ${d.Title ? `<div class="popup-title">${d.Title}</div>` : ""}
    ${
      d.Program || d.Country || d["Year(s)"]
        ? `<div class="popup-program">
             ${d.Program || ""}${d.Country ? `: ${d.Country}` : ""}${d["Year(s)"] ? ` ${d["Year(s)"]}` : ""}
           </div>`
        : ""
    }
    ${media}
    ${d.Partners ? `<div class="popup-partners">Created in collaboration with ${d.Partners}, rooted in a shared vision.</div>` : ""}
    ${d.Quote ? `<div class="popup-quote">&ldquo;${d.Quote}&rdquo;</div>` : ""}
    ${d["Quote Author"] ? `<div class="popup-quote-author">– ${d["Quote Author"]}</div>` : ""}
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

export default function StoryMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dataFeaturesRef = useRef<Feature[]>([]);
  const indexRef = useRef<Supercluster | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const currentPopupRef = useRef<mapboxgl.Popup | null>(null);
  const currentPopupCoords = useRef<[number, number] | null>(null);

  // Styles copied from your standalone (kept identical)
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display:none!important; }
      #storymap-search-toggle, #storymap-search-box { position:absolute; top:10px; z-index:9999; }
      #storymap-search-toggle { right:60px; width:38px; height:38px; background:#fff; border:1px solid #ccc; border-radius:6px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1.25rem; }
      #storymap-search-box { right:105px; height:38px; width:0; opacity:0; overflow:hidden; transition:width .3s ease, opacity .3s ease; backdrop-filter:blur(6px); background:rgba(255,255,255,0.7); border:1px solid #ccc; border-radius:8px; }
      #storymap-search-box.expanded { width:280px; opacity:1; }
      @media(max-width:600px){ #storymap-search-box.expanded{ width:80vw!important; } }
      #storymap-search-input { width:100%; height:100%; padding:0 48px; border:none; background:transparent; font-size:16px; text-indent: 8px; outline:none; }
      .mapboxgl-marker, .mapboxgl-marker * { pointer-events:auto!important; cursor:pointer!important; }
      .cluster-marker { width:40px; height:40px; background:#FFCC00; color:#000; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; pointer-events:auto!important; cursor:pointer!important; }
      .mapboxgl-popup-content { width:400px!important; max-width:90vw!important; padding:1.5rem; background:#fff; border-radius:24px!important; box-shadow:0 4px 10px rgba(0,0,0,0.15); color:#111; text-align:left; }
      .mapboxgl-popup-tip { display:block; margin:0 auto; }
      .mapboxgl-popup-close-button { display:none!important; }
      .popup-location { font-family:var(--font-space-grotesk),system-ui,sans-serif; font-size:.75rem; text-align:right; margin-bottom:.4rem; }
      .popup-title { font-family:'Anton',sans-serif; font-size:2.1rem; font-weight:580; text-transform:uppercase; line-height:1; margin-bottom:.4rem; background:#FFCC00; padding:.2rem .4rem; display:inline-block; }
      .popup-program { font-family:var(--font-space-grotesk),system-ui,sans-serif; font-size:1rem; margin-bottom:.75rem; }
      .popup-video { width:100%; height:200px; margin-bottom:.75rem; }
      .popup-video iframe { width:100%; height:100%; border:none; border-radius:16px; }
      .popup-image { width:100%; border-radius:16px; margin-bottom:0rem; }
      .popup-partners { font-family:var(--font-dm-sans),system-ui,sans-serif; font-size:.7rem; font-style:italic; text-align:right; margin:0 0 .75rem; line-height:1; }
      .popup-quote { font-family:var(--font-space-grotesk),system-ui,sans-serif; font-size:1.4rem; font-style:italic; margin:.75rem 2rem .25rem; }
      .popup-quote-author { font-family:var(--font-dm-sans),system-ui,sans-serif; font-size:.8rem; margin:.25rem 3rem 1rem; }
      .popup-story { font-family:var(--font-dm-sans),system-ui,sans-serif; font-size:1rem; margin:0.5rem 0; }
      .popup-button { display:block; width:100%; box-sizing:border-box; padding:.75rem 1rem; text-align:center; background:#194d56; color:#fff; text-decoration:none; font-family:var(--font-space-grotesk),system-ui,sans-serif; font-size:1rem; letter-spacing:.25em; border-radius:8px; text-transform:uppercase; transition:background .3s ease; }
      .popup-button:hover { background:#123a40; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Init map (identical options)
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/dramaticadventure/cm977ygqf001901qm4a76aaa3",
      center: [0, 20],
      zoom: 2,
      projection: "globe",
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false, showCompass: false }), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    map.scrollZoom.enable();
    map.dragPan.enable();
    map.touchZoomRotate.enable();
    map.touchZoomRotate.disableRotation();

    // click outside popup closes it
    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
  const tgt = (e.originalEvent as MouseEvent).target as HTMLElement;
      if (
        currentPopupRef.current &&
        !tgt.closest(".mapboxgl-popup-content") &&
        !tgt.closest(".cluster-marker") &&
        !tgt.closest(".mapboxgl-marker")
      ) {
        currentPopupRef.current.remove();
        currentPopupRef.current = null;
        currentPopupCoords.current = null;
      }
    };

    map.on("click", clickHandler);
    mapRef.current = map;

    return () => {
      map.off("click", clickHandler);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Load CSV (header:false) and build features like your original
  useEffect(() => {
    if (!mapRef.current) return;

    Papa.parse(
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzkIPStlL2TU7AHySD3Kw9CqBFTi1q6QW7N99ivE3FpofNhHlwWejU0LXeMOmnTawtmLCT71KWMU-F/pub?gid=582055134&single=true&output=csv",
      {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: ({ data }: Papa.ParseResult<string[]>) => {
          let rows = data as string[][];
          while (rows.length && rows[0].every((c) => !(String(c || "").trim()))) rows.shift();
          const headers = rows.shift()!.map((h) => (h || "").trim().toLowerCase());

          const requiredFields = ["title", "latitude", "longitude"];
          const idx = (name: string) => {
            const i = headers.indexOf(name.toLowerCase());
            if (i < 0 && requiredFields.includes(name.toLowerCase())) {
              console.error(`🚨 Required column "${name}" not found in Google Sheet headers.`);
            }
            return i;
          };

          const [tI, pI, lI, latI, lngI, sI, cI, coI, yI, paI, imI, qI, qaI, stI, liI, aI, auI, suI, slI] = [
            "title",
            "program",
            "location name",
            "latitude",
            "longitude",
            "show on map?",
            "category",
            "country",
            "year(s)",
            "partners",
            "image url",
            "quote",
            "quote author",
            "short story",
            "more info link",
            "author",
            "authorslug",
            "story url",
            "slug",
          ].map(idx);

          if ([tI, latI, lngI].includes(-1)) {
            console.error("❌ Required columns are missing — map markers will not render.");
            return;
          }

          const feats: Feature[] = rows.reduce((acc: Feature[], r) => {
            const la = parseFloat(r[latI]);
            const lo = parseFloat(r[lngI]);
            if (isNaN(la) || isNaN(lo)) return acc;
            if (sI >= 0 && `${r[sI]}`.trim().toLowerCase() === "no") return acc;

            acc.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: [lo, la] },
              properties: {
                Title: r[tI] || "",
                Program: r[pI] || "",
                "Location Name": r[lI] || "",
                Country: r[coI] || "",
                "Year(s)": r[yI] || "",
                Partners: r[paI] || "",
                "Image URL": r[imI] || "",
                Quote: r[qI] || "",
                "Quote Author": r[qaI] || "",
                "Short Story": r[stI] || "",
                Author: r[aI] || "",
                authorSlug: r[auI] || "",
                "More Info Link": r[liI] || "",
                "Story URL": r[suI] || "",
                Slug: r[slI] || "",
                category: (r[cI] || "").toLowerCase(),
              },
            });
            return acc;
          }, []);

          dataFeaturesRef.current = feats;
          indexRef.current = new Supercluster({ radius: 6, maxZoom: 30 });
          indexRef.current.load(feats as any);

          renderClusters();
const m = mapRef.current;
if (m) {
  m.on("moveend", renderClusters);
  m.on("zoomend", renderClusters);
}

        },
      }
    );
  }, []);

  const renderClusters = () => {
  const map = mapRef.current;
const index = indexRef.current;
if (!map || !index) return;

// clear markers
markersRef.current.forEach(m => m.remove());
markersRef.current = [];

const z = Math.floor(map.getZoom());

// ✅ Make bounds non-null & explicit
const b = map.getBounds() as mapboxgl.LngLatBounds;
const arr = b.toArray() as [[number, number], [number, number]];
const bounds: [number, number, number, number] = [arr[0][0], arr[0][1], arr[1][0], arr[1][1]];

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
          const nextZoom = Math.min(map.getZoom() + 4, 30);
          map.easeTo({ center: [lon, lat], zoom: nextZoom, offset: [0, 300], duration: 500 });
        };
        el.addEventListener("mousedown", () => map.dragPan.disable());
        el.addEventListener("mouseup", () => map.dragPan.enable());

        const mk = new mapboxgl.Marker({ element: el }).setLngLat([lon, lat]).addTo(map);
        markersRef.current.push(mk);
      } else {
        const props = c.properties as FeatureProps;
        const popup = new mapboxgl.Popup({ offset: 25, closeOnClick: true, closeOnMove: false }).setHTML(
          createPopupHTML(props)
        );
        const mk = new mapboxgl.Marker({ color: colorMap[props.category] || "#3FB1CE" })
          .setLngLat([lon, lat])
          .setPopup(popup)
          .addTo(map);

        mk.getElement().addEventListener("click", (e) => {
          e.stopPropagation();
          if (currentPopupRef.current) currentPopupRef.current.remove();
          popup.addTo(map);
          currentPopupRef.current = popup;
          currentPopupCoords.current = [lon, lat];
        });

        mk.getElement().addEventListener("mousedown", () => map.dragPan.disable());
        mk.getElement().addEventListener("mouseup", () => map.dragPan.enable());

        markersRef.current.push(mk);
      }
    });

    // Re-open last popup if still present
    if (currentPopupCoords.current) {
      markersRef.current.forEach((m: any) => {
        if (m.getPopup) {
          const ll = m.getLngLat();
          const [x, y] = currentPopupCoords.current!;
          if (Math.abs(ll.lng - x) < 1e-6 && Math.abs(ll.lat - y) < 1e-6) {
            m.getPopup().addTo(map);
            currentPopupRef.current = m.getPopup();
          }
        }
      });
    }
  };

  const filterMarkers = (q: string) => {
    const exact = [...q.matchAll(/"([^"]+)"/g)].map((m) => normalize(m[1]));
    const rest = q.replace(/"[^"]+"/g, "");
    const terms = normalize(rest).split(/\s+|,/).filter(Boolean);

    const features = dataFeaturesRef.current;
    const filtered = exact.length || terms.length
      ? features.filter((f) => {
          const txt = normalize(Object.values(f.properties).join(" "));
          if (!exact.every((e) => txt.includes(e))) return false;
          return terms.length ? terms.some((t) => txt.includes(t)) : true;
        })
      : features;

    indexRef.current = new Supercluster({ radius: 6, maxZoom: 30 });
    indexRef.current.load(filtered as any);
    renderClusters();

    const map = mapRef.current;
if (!map) return;

    if (filtered.length === 1) {
      map.flyTo({ center: filtered[0].geometry.coordinates, zoom: 30, duration: 500 });
    } else if (filtered.length > 1) {
      const cs = filtered.map((f) => f.geometry.coordinates);
      const lons = cs.map((c) => c[0]);
      const lats = cs.map((c) => c[1]);
      map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], {
        padding: 60,
        duration: 500,
      });
    }
  };

  return (
  <div
    ref={containerRef}
    id="storymap-map"
    style={{ position: "relative", width: "100%", height: "100vh" }}
  >
    <div
      id="storymap-search-toggle"
      onClick={() => setSearchOpen((v) => !v)}
      role="button"
      aria-label="Toggle search"
    >
      🔍
    </div>

    <div id="storymap-search-box" className={searchOpen ? "expanded" : ""}>
      <input
        id="storymap-search-input"
        placeholder="Search stories, countries, programs…"
        value={query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const val = e.target.value;
          setQuery(val);
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(() => filterMarkers(val), 500);
        }}
      />
    </div>

      <div ref={containerRef} id="storymap-map" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
