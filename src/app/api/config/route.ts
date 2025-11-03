import { NextResponse } from 'next/server';

/**
 * Runtime configuration API endpoint
 *
 * Returns environment-specific configuration that can be read at runtime.
 * This allows the Mac app to pass dynamic port numbers via environment variables.
 *
 * Uses GRAPHQL_URL and GRAPHQL_WS_URL (without NEXT_PUBLIC_ prefix) because
 * these are server-side only and don't need to be exposed to the client bundle.
 */
export async function GET() {
  // Read server-side environment variables (no NEXT_PUBLIC_ prefix needed)
  const graphqlUrl = process.env.GRAPHQL_URL || process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql';
  const graphqlWsUrl = process.env.GRAPHQL_WS_URL || process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql';

  // Debug logging
  console.log('[Config API] Environment variables:');
  console.log('  GRAPHQL_URL:', process.env.GRAPHQL_URL);
  console.log('  GRAPHQL_WS_URL:', process.env.GRAPHQL_WS_URL);
  console.log('  NEXT_PUBLIC_GRAPHQL_URL:', process.env.NEXT_PUBLIC_GRAPHQL_URL);
  console.log('  NEXT_PUBLIC_GRAPHQL_WS_URL:', process.env.NEXT_PUBLIC_GRAPHQL_WS_URL);
  console.log('  PORT:', process.env.PORT);

  const config = {
    graphqlUrl,
    graphqlWsUrl,
  };

  console.log('[Config API] Returning config:', config);

  return NextResponse.json(config);
}
