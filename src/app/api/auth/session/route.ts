/**
 * Session API Route
 *
 * Mode-aware session endpoint:
 * - OIDC mode: delegates to NextAuth's built-in handler so `session.error`
 *   and the real `expires` propagate to the client unchanged. Required for
 *   OIDCRefreshErrorRecovery to fire when refresh tokens die. Both GET (the
 *   regular session read used by SessionProvider) and POST (used by
 *   `useSession().update()` — see OIDCFetch401Listener) must delegate.
 * - CANFAR mode: custom whoami-backed session shaped like NextAuth's. Only
 *   GET; POST is meaningless here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '@/auth';
import {
  successResponse,
  fetchExternalApi,
  forwardCookies,
  errorResponse,
  methodNotAllowed,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

function isOIDCMode(): boolean {
  return process.env.NEXT_USE_CANFAR !== 'true';
}

export async function GET(request: NextRequest) {
  if (isOIDCMode()) {
    return handlers.GET(request);
  }

  try {
    const cookies = forwardCookies(request);

    const response = await fetchExternalApi(
      `${serverApiConfig.login.baseUrl}/whoami`,
      {
        method: 'GET',
        headers: { ...cookies, Accept: 'application/json' },
      },
      serverApiConfig.login.timeout,
    );

    if (!response.ok) {
      return successResponse(null);
    }

    const user = await response.json();

    return successResponse({
      user: {
        name: user.displayName || user.username,
        email: user.email,
        image: null,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      return errorResponse('Request timeout', HTTP_STATUS.GATEWAY_TIMEOUT, error.message);
    }
    return successResponse(null) as NextResponse;
  }
}

export async function POST(request: NextRequest) {
  if (isOIDCMode()) {
    return handlers.POST(request);
  }
  return methodNotAllowed(['GET']);
}
