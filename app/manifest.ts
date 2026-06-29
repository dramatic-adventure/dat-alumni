// app/manifest.ts
//
// Web App Manifest for the DAT Field Kit PWA. Next emits this at /manifest.webmanifest
// automatically (MetadataRoute.Manifest). The app installs into the Field Kit
// (start_url "/field-kit") but keeps scope "/" so in-app links to artist profiles
// (/alumni/...) and other site routes stay inside the installed window.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DAT Field Kit",
    short_name: "Field Kit",
    description: "The private in-program companion for DAT artists in the field.",
    start_url: "/field-kit",
    scope: "/",
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
