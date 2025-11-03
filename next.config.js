/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable image optimization for compatibility
  images: {
    unoptimized: true,
  },

  // Trailing slash for better static hosting compatibility
  trailingSlash: true,

  // Environment variables for GraphQL endpoints
  // These will be proxied by nginx in production or used directly in development
  env: {
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL || '/graphql',
    NEXT_PUBLIC_GRAPHQL_WS_URL: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || '/ws',
  },
};

module.exports = nextConfig;
