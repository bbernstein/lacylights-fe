import { NextResponse } from 'next/server';

/**
 * Runtime configuration API endpoint
 *
 * Returns environment-specific configuration that can be read at runtime.
 * This allows the Mac app to pass dynamic port numbers via environment variables.
 */
export async function GET() {
  return NextResponse.json({
    graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
    graphqlWsUrl: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql',
  });
}
