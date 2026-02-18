// next.config.ts
import type { NextConfig } from "next";

const isCanaryPPR = process.env.NEXT_CANARY_PPR === "1";

const nextConfig: NextConfig = {
  ...(isCanaryPPR ? { experimental: { ppr: true } } : {}),

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,

    // ✅ allow next/image to use our local proxy routes with query strings
    // (matcher checks pathname only; query is ignored)
    localPatterns: [
      // ✅ our image proxy route(s)
      { pathname: "/api/img" },
      { pathname: "/api/img/**" },

      // ✅ NEW: thumb proxy used by profile headers / cards
      { pathname: "/api/media/thumb" },
      { pathname: "/api/media/thumb/**" },

      // ✅ local static assets used by next/image
      { pathname: "/images/**" },
      { pathname: "/icons/**" },
      { pathname: "/seasons/**" },
      { pathname: "/posters/**" },
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
