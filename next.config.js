/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for RPi deployment via nginx
  // Disable in dev mode to allow dynamic routes to work properly
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

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
