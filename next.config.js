// next.config.js  (converted from .ts to break SWC→vendor-chunk circular dep on cold start)
/** @type {import('next').NextConfig} */

const isCanaryPPR = process.env.NEXT_CANARY_PPR === "1";

const nextConfig = {
  // Keep these external so webpack doesn't bundle them; they load from
  // node_modules at runtime. sharp = EXIF orientation + JPEG/PNG/WebP/AVIF
  // re-encode/resize; heic-convert = HEIC/HEVC decode (sharp's prebuilt binary
  // can't decode HEIC). Both are used by /api/media/thumb and /api/upload.
  serverExternalPackages: ["sharp", "heic-convert"],

  experimental: {
    // Next.js 16 added isolatedDevBuild (default: true) which redirects dev
    // output to .next/dev/ instead of .next/.  On this machine it causes cold
    // starts to fail: the webpack watch callback silently swallows errors
    // (_err is ignored in hot-reloader-webpack.js), so if the first
    // compilation can't write output files the server starts with an empty
    // .next/dev/server/ and every request dies with:
    //   Cannot find module './vendor-chunks/next.js'
    // Reverting to the pre-16 layout (.next/) fixes cold-start reliability.
    isolatedDevBuild: false,
    ...(isCanaryPPR ? { ppr: true } : {}),
  },

  // 308 permanent redirect: the old /programs/[slug] roster pages were
  // replaced by the richer /projects/[slug] archive pages. Preserves SEO and
  // any existing inbound links.
  async redirects() {
    return [
      {
        source: "/programs/:slug",
        destination: "/projects/:slug",
        permanent: true,
      },
    ];
  },

  // Use in-memory webpack cache in dev — filesystem pack writes fail with
  // an atomic rename error on this machine and corrupt .next mid-session.
  webpack: (config, { dev }) => {
    if (dev) config.cache = { type: "memory" };
    return config;
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,

    localPatterns: [
      { pathname: "/api/img" },
      { pathname: "/api/media/thumb" },
      { pathname: "/api/img/**" },
      { pathname: "/api/media/thumb/**" },
      { pathname: "/images/**" },
      { pathname: "/icons/**" },
      { pathname: "/seasons/**" },
      { pathname: "/posters/**" },
      { pathname: "/partners/**" },
    ],

    remotePatterns: [
      { protocol: "https", hostname: "via.placeholder.com", pathname: "**" },
      { protocol: "https", hostname: "images.squarespace-cdn.com", pathname: "**" },
      { protocol: "http",  hostname: "images.squarespace-cdn.com", pathname: "**" },
      { protocol: "https", hostname: "live.staticflickr.com", pathname: "**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "**" },
      { protocol: "https", hostname: "**.s3.amazonaws.com", pathname: "**" },
      { protocol: "https", hostname: "i.imgur.com", pathname: "**" },
      { protocol: "https", hostname: "www.dropbox.com", pathname: "**" },
      { protocol: "https", hostname: "dl.dropboxusercontent.com", pathname: "**" },
      { protocol: "https", hostname: "drive.google.com", pathname: "**" },
      { protocol: "https", hostname: "**.googleusercontent.com", pathname: "**" },
      { protocol: "https", hostname: "static.wixstatic.com", pathname: "**" },
      { protocol: "https", hostname: "uploads-ssl.webflow.com", pathname: "**" },
      { protocol: "https", hostname: "photos.smugmug.com", pathname: "**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "**" },
      { protocol: "https", hostname: "media.licdn.com", pathname: "**" },
      { protocol: "https", hostname: "**.cdninstagram.com", pathname: "**" },
    ],
  },
};

module.exports = nextConfig;
