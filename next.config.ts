/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // ✅ Placeholder (testing)
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

      // ✅ Amazon S3 (specific and generic)
      {
        protocol: 'https',
        hostname: 'your-bucket-name.s3.amazonaws.com', // ⛳️ Replace if needed
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
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

      // ✅ Google Drive preview
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },

      // ✅ Wix (cleaned up)
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
      },

      // ✅ Webflow (common asset domain)
      {
        protocol: 'https',
        hostname: 'uploads-ssl.webflow.com',
      },

      // ✅ SmugMug
      {
        protocol: 'https',
        hostname: 'photos.smugmug.com',
      },

      // ✅ Catch-all: only uncomment for dev/test
      // {
      //   protocol: 'https',
      //   hostname: '**',
      // },
    ],
  },
};

export default nextConfig;
