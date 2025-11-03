/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization for compatibility
  images: {
    unoptimized: true,
  },

  // Trailing slash for better static hosting compatibility
  trailingSlash: true,

  // No build-time environment variables needed
  // Runtime configuration is provided via /api/config endpoint
};

module.exports = nextConfig;
