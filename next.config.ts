/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ✅ Placeholder for testing/demo
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },

      // ✅ Squarespace CDN
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

      // ✅ Amazon S3 (specific & wildcard for any bucket)
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
      },

      // ✅ Imgur
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },

      // ✅ Dropbox
      {
        protocol: 'https',
        hostname: 'www.dropbox.com',
      },
      {
        protocol: 'https',
        hostname: 'dl.dropboxusercontent.com',
      },

      // ✅ Google Drive
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },

      // ✅ Wix
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
      },

      // ✅ Webflow
      {
        protocol: 'https',
        hostname: 'uploads-ssl.webflow.com',
      },

      // ✅ SmugMug
      {
        protocol: 'https',
        hostname: 'photos.smugmug.com',
      },

      // ✅ Unsplash
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },

      // ✅ [Optional Catch-All for Dev ONLY]
      // {
      //   protocol: 'https',
      //   hostname: '**',
      // },
    ],
    // ✅ Enable AVIF & WebP for faster loads
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
