import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * Middleware for authentication.
 *
 * CANFAR mode: pass-through. Auth is enforced inside individual route
 * handlers and by upstream services that own the CADC_SSO cookie.
 *
 * OIDC mode: gate non-public routes on a valid NextAuth session.
 * - Pages: redirect to `/` (which renders the sign-in entry).
 * - API: return 401 JSON so client-side React Query / SWR can react.
 * Also catches the post-failed-refresh state (`session.error ===
 * 'RefreshAccessTokenError'`) so SSR pages don't render against a dead
 * session before the client-side OIDCRefreshErrorRecovery can sign out.
 */

const OIDC_PUBLIC_PREFIXES = [
  '/oidc-callback',
  '/api/public-config',
  '/api/health',
  '/api/metrics',
];

function isOidcPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return OIDC_PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default auth((req) => {
  const isOIDC = process.env.NEXT_USE_CANFAR !== 'true';
  if (!isOIDC) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  if (isOidcPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = req.auth;
  const sessionDead = !session || session.error === 'RefreshAccessTokenError';
  if (!sessionDead) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Session required',
        status: 401,
      },
      { status: 401 },
    );
  }

  return NextResponse.redirect(new URL('/', req.nextUrl));
});

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     * - api/auth (NextAuth / Auth.js — must not run auth() middleware here or OAuth
     *   state/PKCE cookies can break on the callback)
     *
     * With next.config basePath, pathname in middleware excludes the basePath prefix,
     * so exclude "api/auth" not "/science-portal/api/auth".
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
