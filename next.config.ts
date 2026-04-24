// next.config.ts
import type { NextConfig } from "next";

const isCanaryPPR = process.env.NEXT_CANARY_PPR === "1";

const nextConfig: NextConfig = {
  ...(isCanaryPPR ? { experimental: { ppr: true } } : {}),

  // The Prisma 7 client ships WASM query compilers for every supported database
  // (~75 MB total in node_modules/@prisma/client/runtime). This app only uses
  // PostgreSQL via the Neon adapter, so excluding the other engines and the
  // Prisma CLI/dev tooling keeps the Netlify server function under the 50 MB
  // upload limit.
  outputFileTracingExcludes: {
    "/*": [
      "node_modules/@prisma/client/runtime/query_compiler_*.cockroachdb.*",
      "node_modules/@prisma/client/runtime/query_compiler_*.mysql.*",
      "node_modules/@prisma/client/runtime/query_compiler_*.sqlite.*",
      "node_modules/@prisma/client/runtime/query_compiler_*.sqlserver.*",
      "node_modules/@prisma/client/runtime/query_compiler_small_bg.postgresql.*",
      "node_modules/@prisma/engines/**",
      "node_modules/prisma/**",
      "node_modules/@prisma/studio-core/**",
      "node_modules/@prisma/dev/**",
      "node_modules/@prisma/fetch-engine/**",
      "node_modules/@prisma/get-platform/**",
      "node_modules/@prisma/adapter-better-sqlite3/**",
      "node_modules/better-sqlite3/**",
    ],
  },

  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"],

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,

    // ✅ allow next/image to use our local proxy routes with query strings
    // (matcher checks pathname only; query is ignored)
    localPatterns: [
      // ✅ exact endpoints (querystring ignored)
      { pathname: "/api/img" },
      { pathname: "/api/media/thumb" },

      // ✅ future-proof subpaths
      { pathname: "/api/img/**" },
      { pathname: "/api/media/thumb/**" },

      // ✅ local static assets used by next/image
      { pathname: "/images/**" },
      { pathname: "/icons/**" },
      { pathname: "/seasons/**" },
      { pathname: "/posters/**" },
      { pathname: "/partners/**" },
    ],

    remotePatterns: [
      // Placeholder
      { protocol: "https", hostname: "via.placeholder.com", pathname: "**" },

      // Squarespace
      { protocol: "https", hostname: "images.squarespace-cdn.com", pathname: "**" },
      { protocol: "http", hostname: "images.squarespace-cdn.com", pathname: "**" },

      // Flickr
      { protocol: "https", hostname: "live.staticflickr.com", pathname: "**" },

      // Cloudinary
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "**" },

      // S3 (any bucket)
      { protocol: "https", hostname: "**.s3.amazonaws.com", pathname: "**" },

      // Imgur
      { protocol: "https", hostname: "i.imgur.com", pathname: "**" },

      // Dropbox
      { protocol: "https", hostname: "www.dropbox.com", pathname: "**" },
      { protocol: "https", hostname: "dl.dropboxusercontent.com", pathname: "**" },

      // Google Drive / googleusercontent (lh3, lh5, etc.)
      { protocol: "https", hostname: "drive.google.com", pathname: "**" },
      { protocol: "https", hostname: "**.googleusercontent.com", pathname: "**" },

      // Wix
      { protocol: "https", hostname: "static.wixstatic.com", pathname: "**" },

      // Webflow
      { protocol: "https", hostname: "uploads-ssl.webflow.com", pathname: "**" },

      // SmugMug
      { protocol: "https", hostname: "photos.smugmug.com", pathname: "**" },

      // Unsplash
      { protocol: "https", hostname: "images.unsplash.com", pathname: "**" },

      // YouTube thumbnails
      { protocol: "https", hostname: "i.ytimg.com", pathname: "**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "**" },

      // LinkedIn (bios)
      { protocol: "https", hostname: "media.licdn.com", pathname: "**" },
    ],
  },
};

export default nextConfig;

