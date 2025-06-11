/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ✅ Placeholder
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },

      // ✅ Squarespace
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
      },

      // ✅ Flickr
      {
        protocol: 'https',
        hostname: 'live.staticflickr.com',
      },

      // ✅ Cloudinary
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },

      // ✅ Amazon S3 (common bucket pattern)
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },

      // ✅ imgur
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },

      // ✅ Dropbox (shared content links)
      {
        protocol: 'https',
        hostname: 'www.dropbox.com',
      },
      {
        protocol: 'https',
        hostname: 'dl.dropboxusercontent.com',
      },

      // ✅ Google Drive preview links
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },

      // ✅ Common artist portfolio sites
      {
        protocol: 'https',
        hostname: '**.wixstatic.com', // Wix CDN
      },
      {
        protocol: 'https',
        hostname: '**.webflow.io', // Webflow CDN
      },
      {
        protocol: 'https',
        hostname: '**.smugmug.com', // SmugMug
      },

      // ✅ Wildcard fallback (if needed, but limit this in production)
      // {
      //   protocol: 'https',
      //   hostname: '**',
      // },
    ],
  },
};

export default nextConfig;
