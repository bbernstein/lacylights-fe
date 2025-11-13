/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export mode:
  // - RPi deployment: Set STATIC_EXPORT=true for nginx serving static files
  // - Mac app: Leave unset for server mode with API routes (/api/config)
  // - Dev mode: Always use server mode for HMR and dynamic routes
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,

  // Disable image optimization for compatibility
  images: {
    unoptimized: true,
  },

  // Trailing slash for better static hosting compatibility
  trailingSlash: true,

  // Runtime configuration:
  // - Server mode: Uses /api/config endpoint for dynamic port configuration
  // - Static mode: Uses embedded environment variables from build time
};

module.exports = nextConfig;
