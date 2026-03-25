import localFont from "next/font/local";

/* ===============================
   Core Fonts
=============================== */

export const anton = localFont({
  src: [
    // ✅ best coverage (latin + latin-ext + vietnamese)
    {
      path: "../public/fonts/anton-v27-latin_latin-ext_vietnamese-regular.woff2",
      weight: "400",
      style: "normal",
    },
    // (optional) keep as fallback; safe to remove if you want
    {
      path: "../public/fonts/anton-v26-latin-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-anton",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Helvetica",
    "Arial",
    "sans-serif",
  ],
});

export const dmSans = localFont({
  src: [
    // ✅ variable TTFs usually include broad glyph coverage
    {
      path: "../public/fonts/DM_Sans/DMSans-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../public/fonts/DM_Sans/DMSans-Italic-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "italic",
    },

    // ✅ add latin-ext WOFF2 fallbacks “just in case”
    // expects your new folder: public/fonts/dm-sans-latin-ext/
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-100-normal.woff2", weight: "100", style: "normal" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-200-normal.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-900-normal.woff2", weight: "900", style: "normal" },

    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-100-italic.woff2", weight: "100", style: "italic" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-200-italic.woff2", weight: "200", style: "italic" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-300-italic.woff2", weight: "300", style: "italic" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-600-italic.woff2", weight: "600", style: "italic" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-700-italic.woff2", weight: "700", style: "italic" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-800-italic.woff2", weight: "800", style: "italic" },
    { path: "../public/fonts/dm-sans-latin-ext/dm-sans-latin-ext-900-italic.woff2", weight: "900", style: "italic" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Helvetica",
    "Arial",
    "sans-serif",
  ],
});

export const spaceGrotesk = localFont({
  src: [
    // ✅ latin-ext coverage (expects: public/fonts/space-grotesk-latin-ext/)
    { path: "../public/fonts/space-grotesk-latin-ext/space-grotesk-latin-ext-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/space-grotesk-latin-ext/space-grotesk-latin-ext-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/space-grotesk-latin-ext/space-grotesk-latin-ext-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/space-grotesk-latin-ext/space-grotesk-latin-ext-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/space-grotesk-latin-ext/space-grotesk-latin-ext-700-normal.woff2", weight: "700", style: "normal" },

    // latin files you already have (public/fonts/space-grotesk-v21-latin/)
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-300.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-700.woff2", weight: "700", style: "normal" },

    // (optional) keep variable TTF if you like; but it’s not necessary once WOFF2 are in place
    // {
    //   path: "../public/fonts/Space_Grotesk/SpaceGrotesk-VariableFont_wght.ttf",
    //   weight: "300 700",
    //   style: "normal",
    // },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Helvetica",
    "Arial",
    "sans-serif",
  ],
});

export const rockSalt = localFont({
  src: "../public/fonts/rock-salt-v23-latin-regular.woff2",
  variable: "--font-rock-salt",
  weight: "400",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Helvetica",
    "Arial",
    "sans-serif",
  ],
});

export const gloucester = localFont({
  src: "../public/fonts/GloucesterMT-ExtraCondensed.woff2",
  variable: "--font-gloucester",
  weight: "400",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "Times", "serif"],
});

/* ===============================
   Program Stamp Fonts
=============================== */

export const vt323 = localFont({
  src: "../public/fonts/vt323-v17-latin-regular.woff2",
  variable: "--font-vt323",
  weight: "400",
  display: "swap",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
});

export const specialElite = localFont({
  src: "../public/fonts/special-elite-v19-latin-regular.woff2",
  variable: "--font-special-elite",
  weight: "400",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Helvetica",
    "Arial",
    "sans-serif",
  ],
});

export const shareTechMono = localFont({
  src: "../public/fonts/share-tech-mono-v15-latin-regular.woff2",
  variable: "--font-share-tech",
  weight: "400",
  display: "swap",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
});

export const cutiveMono = localFont({
  src: "../public/fonts/cutive-mono-v22-latin-regular.woff2",
  variable: "--font-cutive-mono",
  weight: "400",
  display: "swap",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
});

export const anonymousPro = localFont({
  src: [
    {
      path: "../public/fonts/anonymous-pro-v21-latin/anonymous-pro-v21-latin-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/anonymous-pro-v21-latin/anonymous-pro-v21-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-anonymous-pro",
  display: "swap",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
});

export const syneMono = localFont({
  src: "../public/fonts/syne-mono-v15-latin-regular.woff2",
  variable: "--font-syne-mono",
  weight: "400",
  display: "swap",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
});

export const zillaSlab = localFont({
  src: [
    {
      path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-300.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-zilla-slab",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "Times", "serif"],
});

// Collect for convenience if you ever need all
export const allFonts = [
  anton,
  dmSans,
  spaceGrotesk,
  rockSalt,
  gloucester,
  vt323,
  specialElite,
  shareTechMono,
  cutiveMono,
  anonymousPro,
  syneMono,
  zillaSlab,
];
