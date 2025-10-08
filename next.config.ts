import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export only for production builds (Raspberry Pi deployment)
  // In dev mode, we need dynamic routing for the main app routes
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Trailing slash for better static hosting compatibility
  trailingSlash: true,

  // Environment variables for GraphQL endpoints
  // These will be proxied by nginx in production
  env: {
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL || '/graphql',
    NEXT_PUBLIC_GRAPHQL_WS_URL: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || '/ws',
  },
};

export default nextConfig;