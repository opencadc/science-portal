import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import { clockTolerance } from 'oauth4webapi';
import { getOIDCConfig, getOidcIssuerPathUrl, isOIDCAuth } from '@/lib/config/auth-config';
import { authPagesFromAppBasePath, getNormalizedAppBasePath } from '@/lib/config/auth-base-path';
import { getProcessEnv } from '@/lib/config/safe-process-env';

/**
 * NextAuth Configuration for OIDC Authentication
 *
 * This configuration is only used when NEXT_USE_CANFAR=false
 * When NEXT_USE_CANFAR=true, the custom CANFAR auth flow is used instead
 */

// Token type for refresh token handling - extends JWT for compatibility
interface TokenWithRefresh {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  user?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown; // Index signature for JWT compatibility
}

/**
 * Default margin before OIDC access token expiry to run refresh in the JWT callback.
 * Override with server env `NEXT_OIDC_ACCESS_TOKEN_REFRESH_MARGIN_MS` (milliseconds, non-negative).
 * Documented in `.env.example` and `helm/DEPLOYMENT-MODES.md`.
 */
const DEFAULT_ACCESS_TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

/**
 * oauth4webapi default is 30s. SKA IAM (and other IdPs) can issue id_tokens whose
 * `nbf` is slightly ahead of the portal pod clock; raise tolerance when needed.
 * Override with server env `NEXT_OIDC_CLOCK_TOLERANCE_SECONDS` (non-negative integer).
 */
const DEFAULT_OIDC_CLOCK_TOLERANCE_SECONDS = 60;

function getOidcClockToleranceSeconds(): number {
  const raw = getProcessEnv('NEXT_OIDC_CLOCK_TOLERANCE_SECONDS');
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 0) {
      return n;
    }
  }
  return DEFAULT_OIDC_CLOCK_TOLERANCE_SECONDS;
}

function getAccessTokenRefreshMarginMs(): number {
  const raw = getProcessEnv('NEXT_OIDC_ACCESS_TOKEN_REFRESH_MARGIN_MS');
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 0) {
      return n;
    }
  }
  return DEFAULT_ACCESS_TOKEN_REFRESH_MARGIN_MS;
}

function isAccessTokenStillValid(token: TokenWithRefresh): boolean {
  const expiresAt = token.accessTokenExpires as number | undefined;
  if (!expiresAt) {
    return false;
  }
  const marginMs = getAccessTokenRefreshMarginMs();
  return Date.now() < expiresAt - marginMs;
}

// OIDC profile type
interface OIDCProfile {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
}

const trustHostFromEnv =
  getProcessEnv('AUTH_TRUST_HOST') === 'true' ? ({ trustHost: true } as const) : {};

const authConfig: NextAuthConfig = {
  ...trustHostFromEnv,
  /**
   * Must stay `/api/auth`: Next.js strips `basePath` before Auth.js sees `pathname`
   * (e.g. `/api/auth/providers`). A value like `/science-portal/api/auth` breaks action parsing.
   * The browser still calls `/science-portal/api/auth/*` via `SessionProvider` in AuthProvider.
   */
  basePath: '/api/auth',
  /**
   * When the public URL is HTTPS but the incoming Request URL is still `http` (reverse proxy),
   * Auth.js may pick non-secure cookie names on sign-in and secure names on callback (or the
   * reverse), and the state/PKCE cookie JWTs will not decrypt — InvalidCheck "state value could
   * not be parsed". Force secure cookies whenever AUTH_URL / NEXTAUTH_URL is HTTPS.
   */
  useSecureCookies:
    (getProcessEnv('AUTH_URL') ?? getProcessEnv('NEXTAUTH_URL'))?.startsWith('https:') === true
      ? true
      : undefined,
  providers: [],
  pages: authPagesFromAppBasePath(getNormalizedAppBasePath()),
  callbacks: {
    authorized({ request: { nextUrl } }) {
      const isOnDashboard = nextUrl.pathname.startsWith('/');

      // Allow access if using CANFAR auth (handled separately)
      if (!isOIDCAuth()) {
        return true;
      }

      if (isOnDashboard) {
        // Dashboard pages may require authentication based on app logic
        return true;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user,
        };
      }

      // Return previous token if still valid (including proactive margin before expiry)
      if (isAccessTokenStillValid(token)) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          ...(token.user as Record<string, unknown>),
        };
        session.accessToken = token.accessToken as string;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Refresh the access token using the refresh token.
 *
 * Concurrent calls for the same refresh_token are deduped via an in-flight
 * map: SKA-IAM rotates refresh tokens on use, so two parallel POSTs with
 * the same refresh_token cause the second to fail with `invalid_grant` and
 * flip the session into a fake error state. The map serializes them.
 *
 * INFRA NOTE for multi-instance deployments:
 * This map is per-process and sufficient for replicaCount=1 (the current
 * keel-deploy config for staging-src and src.canfar.net portals — see
 * cadc-ccda-infra/keel-deploy:helm/values/src.canfar.net/science-portal/).
 * If scaled to >1 instance, concurrent requests landing on different pods
 * bypass the lock and race on the IdP, evicting users on every rotation.
 * The fix is sticky sessions on the NextAuth cookie at whichever layer
 * load-balances Next (Traefik ingress today, or the edge haproxy):
 *
 *   # Traefik (IngressRoute) — stickiness on the cookie
 *   spec:
 *     services:
 *       - kind: Service
 *         name: science-portal
 *         sticky:
 *           cookie:
 *             name: __Secure-authjs.session-token
 *
 *   # Or haproxy backend
 *   stick-table type string len 64 size 200k expire 2h
 *   stick on req.cook(__Secure-authjs.session-token),sha1
 *
 * On any failure we clear `accessToken` / `accessTokenExpires` so that
 * downstream consumers cannot accidentally forward a stale token to upstream.
 * `session.error === 'RefreshAccessTokenError'` is the recovery signal the
 * client listens for in OIDCRefreshErrorRecovery.
 */
const refreshInFlight = new Map<string, Promise<TokenWithRefresh>>();

/**
 * Terminal refresh failure: refresh token is invalid/expired/revoked.
 * Sets the error flag so OIDCRefreshErrorRecovery signs the user out.
 */
function terminalRefreshFailure(token: TokenWithRefresh): TokenWithRefresh {
  return {
    ...token,
    accessToken: undefined,
    accessTokenExpires: undefined,
    error: 'RefreshAccessTokenError',
  };
}

/**
 * Transient refresh failure: IdP down, network blip, 5xx. Clear the access
 * token (so nothing forwards a stale value) but leave the refresh token in
 * place and DO NOT set the error flag, so the user isn't signed out. The
 * next JWT callback invocation will retry.
 */
function transientRefreshFailure(token: TokenWithRefresh): TokenWithRefresh {
  return {
    ...token,
    accessToken: undefined,
    accessTokenExpires: undefined,
    error: undefined,
  };
}

async function refreshAccessToken(token: TokenWithRefresh): Promise<TokenWithRefresh> {
  const refreshToken = token.refreshToken;
  if (!refreshToken) {
    console.error('Refresh aborted: no refresh token in session');
    return terminalRefreshFailure(token);
  }

  const existing = refreshInFlight.get(refreshToken);
  if (existing) return existing;

  const inflight = doRefreshAccessToken(token, refreshToken).finally(() => {
    refreshInFlight.delete(refreshToken);
  });
  refreshInFlight.set(refreshToken, inflight);
  return inflight;
}

async function doRefreshAccessToken(
  token: TokenWithRefresh,
  refreshToken: string,
): Promise<TokenWithRefresh> {
  try {
    const oidcConfig = getOIDCConfig();
    const url = getOidcIssuerPathUrl(oidcConfig.issuer, 'token');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: oidcConfig.clientId,
        client_secret: oidcConfig.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const refreshedTokens = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        ...token,
        accessToken: refreshedTokens.access_token,
        accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
        refreshToken: refreshedTokens.refresh_token ?? refreshToken,
        error: undefined,
      };
    }

    // 4xx: IdP rejected the refresh token. Terminal — sign the user out.
    // Common case: `invalid_grant` (token expired, revoked, or already
    // rotated by a parallel request before the mutex was added).
    if (response.status >= 400 && response.status < 500) {
      console.error('Refresh terminally rejected:', response.status, refreshedTokens);
      return terminalRefreshFailure(token);
    }

    // 5xx: IdP transient failure. Keep the refresh token, retry next time.
    console.error('Refresh transiently failed:', response.status, refreshedTokens);
    return transientRefreshFailure(token);
  } catch (error) {
    // Network error / fetch threw. Transient — keep the refresh token.
    console.error('Refresh network error (transient):', error);
    return transientRefreshFailure(token);
  }
}

/**
 * Initialize NextAuth with OIDC provider if in OIDC mode
 */
function initializeAuth() {
  if (isOIDCAuth()) {
    try {
      // Allow missing OIDC config during build time (will use dummy values)
      const oidcConfig = getOIDCConfig(true);

      // Configure OIDC provider
      authConfig.providers = [
        {
          id: 'oidc',
          name: 'SKA IAM',
          type: 'oidc',
          issuer: oidcConfig.issuer,
          clientId: oidcConfig.clientId,
          clientSecret: oidcConfig.clientSecret,
          authorization: {
            params: {
              scope: oidcConfig.scope,
              // Full redirect URI including Next.js basePath; must match IdP registration.
              redirect_uri: oidcConfig.redirectUrl,
            },
          },
          checks: ['state', 'pkce'],
          client: {
            [clockTolerance]: getOidcClockToleranceSeconds(),
          },
          profile(profile: OIDCProfile) {
            return {
              id: profile.sub,
              email: profile.email,
              name: profile.name || profile.preferred_username,
              username: profile.preferred_username,
              firstName: profile.given_name,
              lastName: profile.family_name,
            };
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any, // NextAuth provider type requires any cast
      ];
    } catch (error) {
      console.error('Failed to initialize OIDC configuration:', error);
      // Don't throw during build - allow build to continue with dummy config
      if (process.env.NEXT_PHASE !== 'phase-production-build') {
        throw error;
      }
    }
  }

  return NextAuth(authConfig);
}

export const { handlers, auth, signIn, signOut } = initializeAuth();
