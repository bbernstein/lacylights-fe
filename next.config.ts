import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Raspberry Pi deployment
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Trailing slash for better static hosting compatibility
  trailingSlash: true,

  // Environment variables for GraphQL endpoints
  // These will be proxied by nginx in production
  env: {
    NEXT_PUBLIC_GRAPHQL_HTTP: process.env.NEXT_PUBLIC_GRAPHQL_HTTP || '/graphql',
    NEXT_PUBLIC_GRAPHQL_WS: process.env.NEXT_PUBLIC_GRAPHQL_WS || '/ws',
  },
};

export default nextConfig;