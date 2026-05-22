'use client';

import { useEffect } from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { usePublicRuntimeConfig } from '@/lib/providers/PublicRuntimeConfigProvider';
import { authApiBasePathFromAppBasePath } from '@/lib/config/auth-base-path';
import { clearAuth } from '@/lib/auth/token-storage';

/** Poll session below access-token lifetime so useSession picks up refreshed tokens (seconds per next-auth). */
const SESSION_REFETCH_INTERVAL_SECONDS = 5 * 60;

/**
 * When OIDC refresh fails, NextAuth sets session.error; sign out so the user can re-authenticate.
 */
function OIDCRefreshErrorRecovery() {
  const { data: session, status } = useSession();
  const { useCanfar: isCanfar, basePath } = usePublicRuntimeConfig();

  useEffect(() => {
    if (isCanfar || status !== 'authenticated') {
      return;
    }
    if (session?.error !== 'RefreshAccessTokenError') {
      return;
    }
    clearAuth();
    const callbackUrl = basePath && basePath !== '' ? basePath : '/';
    void signOut({ callbackUrl });
  }, [isCanfar, status, session?.error, basePath]);

  return null;
}

/**
 * Collapses the 5-minute session-poll latency on terminal refresh failure.
 *
 * Without this, after the IdP rejects a refresh, the cookie has
 * `error: 'RefreshAccessTokenError'` but the client doesn't see it until
 * the next `refetchInterval` tick — up to ~5 min of API calls returning 401
 * while the UI still thinks it's authenticated.
 *
 * Wraps window.fetch in OIDC mode: any 401 from a portal `/api/*` path
 * (excluding `/api/auth/*` to avoid loops on the session endpoint itself)
 * triggers an immediate `update()`. That refetches the session, surfaces
 * `session.error`, and OIDCRefreshErrorRecovery signs the user out within
 * a tick instead of minutes.
 */
function OIDCFetch401Listener() {
  const { update } = useSession();
  const { useCanfar: isCanfar } = usePublicRuntimeConfig();

  useEffect(() => {
    if (isCanfar || typeof window === 'undefined') return;

    const original = window.fetch;
    window.fetch = async function patchedFetch(input, init) {
      const response = await original.call(this, input as RequestInfo, init);
      try {
        if (response.status === 401) {
          const url =
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.href
                : (input as Request).url;
          if (url.includes('/api/') && !url.includes('/api/auth/')) {
            void update();
          }
        }
      } catch {
        // best-effort; never let the listener affect the response
      }
      return response;
    };

    return () => {
      window.fetch = original;
    };
  }, [isCanfar, update]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { basePath } = usePublicRuntimeConfig();
  const authBasePath = authApiBasePathFromAppBasePath(basePath);

  return (
    <SessionProvider
      basePath={authBasePath}
      refetchInterval={SESSION_REFETCH_INTERVAL_SECONDS}
    >
      <OIDCRefreshErrorRecovery />
      <OIDCFetch401Listener />
      {children}
    </SessionProvider>
  );
}
