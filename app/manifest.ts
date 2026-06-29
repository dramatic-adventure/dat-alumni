// app/manifest.ts
//
// Web App Manifest for the DAT Field Kit PWA. Next emits this at /manifest.webmanifest
// automatically (MetadataRoute.Manifest). Scope is narrowed to "/field-kit" so the
// whole kit (including /field-kit/artist/[slug]) stays in the installed window,
// while same-origin links OUTSIDE the kit (the marketing site, "/", /alumni/...) are
// treated as leaving the app — iOS opens them in the in-app browser with a Done button.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DAT Field Kit",
    short_name: "Field Kit",
    description: "The private in-program companion for DAT artists in the field.",
    start_url: "/field-kit",
    scope: "/field-kit",
    display: "standalone",
    background_color: "#16101c",
    theme_color: "#0e0a13",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
