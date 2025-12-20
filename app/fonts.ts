import localFont from "next/font/local";

/* ===============================
   Core Fonts
=============================== */
export const anton = localFont({
  src: [
    {
      path: "../public/fonts/anton-v27-latin_latin-ext_vietnamese-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/anton-v26-latin-regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-anton",
  display: "swap",
});


export const dmSans = localFont({
  src: [
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-100.woff2", weight: "100", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-100italic.woff2", weight: "100", style: "italic" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-200.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-200italic.woff2", weight: "200", style: "italic" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-300.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-300italic.woff2", weight: "300", style: "italic" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-500italic.woff2", weight: "500", style: "italic" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-600italic.woff2", weight: "600", style: "italic" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-700italic.woff2", weight: "700", style: "italic" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-800.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-800italic.woff2", weight: "800", style: "italic" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-900.woff2", weight: "900", style: "normal" },
    { path: "../public/fonts/dm-sans-v16-latin/dm-sans-v16-latin-900italic.woff2", weight: "900", style: "italic" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

export const spaceGrotesk = localFont({
  src: [
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-300.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/space-grotesk-v21-latin/space-grotesk-v21-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const rockSalt = localFont({
  src: "../public/fonts/rock-salt-v23-latin-regular.woff2",
  variable: "--font-rock-salt",
  weight: "400",
  display: "swap",
});

export const gloucester = localFont({
  src: "../public/fonts/GloucesterMT-ExtraCondensed.woff2",
  variable: "--font-gloucester",
  weight: "400",
  display: "swap",
});

/* ===============================
   Program Stamp Fonts
=============================== */
export const vt323 = localFont({
  src: "../public/fonts/vt323-v17-latin-regular.woff2",
  variable: "--font-vt323",
  weight: "400",
  display: "swap",
});

export const specialElite = localFont({
  src: "../public/fonts/special-elite-v19-latin-regular.woff2",
  variable: "--font-special-elite",
  weight: "400",
  display: "swap",
});

export const shareTechMono = localFont({
  src: "../public/fonts/share-tech-mono-v15-latin-regular.woff2",
  variable: "--font-share-tech",
  weight: "400",
  display: "swap",
});

export const cutiveMono = localFont({
  src: "../public/fonts/cutive-mono-v22-latin-regular.woff2",
  variable: "--font-cutive-mono",
  weight: "400",
  display: "swap",
});

export const anonymousPro = localFont({
  src: [
    { path: "../public/fonts/anonymous-pro-v21-latin/anonymous-pro-v21-latin-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/anonymous-pro-v21-latin/anonymous-pro-v21-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-anonymous-pro",
  display: "swap",
});

export const syneMono = localFont({
  src: "../public/fonts/syne-mono-v15-latin-regular.woff2",
  variable: "--font-syne-mono",
  weight: "400",
  display: "swap",
});

export const zillaSlab = localFont({
  src: [
    { path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-300.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/zilla-slab-v11-latin/zilla-slab-v11-latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-zilla-slab",
  display: "swap",
});


// Collect for convenience if you ever need all
export const allFonts = [
  anton, dmSans, spaceGrotesk, rockSalt, gloucester,
  vt323, specialElite, shareTechMono, cutiveMono,
  anonymousPro, syneMono, zillaSlab,
];
