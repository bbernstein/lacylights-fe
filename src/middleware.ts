import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication.
 * These routes are always accessible.
 */
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

/**
 * Routes that should never be protected (static assets, API routes, etc.)
 */
const EXCLUDED_PATTERNS = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/logo.png',
  '/manifest.json',
];

/**
 * Cookie name for the auth token.
 * This must match the cookie name set by the backend.
 */
const AUTH_TOKEN_COOKIE = 'lacylights_token';

/**
 * Cookie name for tracking if auth is enabled.
 * Set by the frontend after checking with the backend.
 */
const AUTH_ENABLED_COOKIE = 'lacylights_auth_enabled';

/**
 * Check if a path matches any of the excluded patterns.
 */
function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATTERNS.some((pattern) => pathname.startsWith(pattern));
}

/**
 * Check if a path is a public route.
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'));
}

/**
 * Next.js middleware for route protection.
 *
 * This middleware checks if authentication is required and redirects
 * unauthenticated users to the login page.
 *
 * The auth check uses a two-cookie approach:
 * 1. `lacylights_auth_enabled` - Set by the client after checking with the server
 *    if auth is globally enabled. If not set or 'false', all routes are accessible.
 * 2. `lacylights_token` - The actual JWT token set by the backend on login.
 *    If auth is enabled and this cookie is missing, redirect to login.
 *
 * This middleware is intentionally lightweight and defers detailed auth checks
 * to the client-side AuthContext for better UX and error handling.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip excluded paths (static assets, API routes)
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if auth is enabled (from cookie set by client after initial check).
  //
  // Design note: When the cookie is absent (fresh session/first visit), we allow
  // access because the client-side AuthContext will query the backend to determine
  // if auth is enabled and set this cookie. If we defaulted to "auth enabled" when
  // absent, it would redirect users to login before the client can check, breaking
  // instances where auth is disabled entirely. The client-side AuthContext provides
  // the actual auth enforcement after the cookie is established.
  const authEnabledCookie = request.cookies.get(AUTH_ENABLED_COOKIE);
  const isAuthEnabled = authEnabledCookie?.value === 'true';

  // If auth is not enabled (cookie absent or not 'true'), allow all routes
  if (!isAuthEnabled) {
    return NextResponse.next();
  }

  // Auth is enabled - check for token
  const tokenCookie = request.cookies.get(AUTH_TOKEN_COOKIE);
  const hasToken = !!tokenCookie?.value;

  // If no token, redirect to login with return URL
  if (!hasToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists, allow the request
  // Note: Token validation happens on the backend/client side
  return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on.
 * We exclude static files and API routes at the config level for efficiency.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo.png, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json).*)',
  ],
};
