import { NextResponse } from 'next/server';

/**
 * Runtime configuration API endpoint
 *
 * Returns environment-specific configuration that can be read at runtime.
 * This allows the Mac app to pass dynamic port numbers via environment variables.
 *
 * Note: This route only works in server mode. For static export (RPi deployment),
 * the frontend uses relative paths via nginx proxy configuration.
 */
export async function GET() {
  // Priority order for configuration:
  // 1. GRAPHQL_URL - Server-side runtime variable (Mac app)
  // 2. NEXT_PUBLIC_GRAPHQL_URL - Build-time variable (fallback)
  // 3. Default localhost:4000
  const graphqlUrl = process.env.GRAPHQL_URL ||
                     process.env.NEXT_PUBLIC_GRAPHQL_URL ||
                     'http://localhost:4000/graphql';

  const graphqlWsUrl = process.env.GRAPHQL_WS_URL ||
                       process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ||
                       'ws://localhost:4000/graphql';

  return NextResponse.json({
    graphqlUrl,
    graphqlWsUrl,
  });
}

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
