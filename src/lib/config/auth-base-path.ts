import { getProcessEnv } from '@/lib/config/safe-process-env';

/** Trim trailing slash from `NEXT_PUBLIC_BASE_PATH` (e.g. `/science-portal`). */
export function getNormalizedAppBasePath(): string {
  return (getProcessEnv('NEXT_PUBLIC_BASE_PATH') || '').replace(/\/$/, '');
}

/**
 * Public URL path to Auth.js handlers, including Next.js `basePath`.
 * Use for **client** `SessionProvider` / `fetch` only. Server `auth.ts` must keep
 * `basePath: '/api/auth'` because Auth.js parses `pathname` without the Next prefix.
 */
export function authApiBasePathFromAppBasePath(appBasePath: string): string {
  const p = (appBasePath || '').replace(/\/$/, '');
  return p ? `${p}/api/auth` : '/api/auth';
}

/**
 * Auth.js `pages.*` paths must include the Next.js app basePath. Auth.js builds
 * absolute redirect URLs as `origin + pages.error`, so `/api/auth/error` misses
 * deployments mounted at e.g. `/science-portal`.
 */
export function authPagesFromAppBasePath(appBase: string): { signIn: string; error?: string } {
  if (!appBase) {
    return { signIn: '/' };
  }
  return {
    signIn: `${appBase}/`,
    error: `${appBase}/api/auth/error`,
  };
}
