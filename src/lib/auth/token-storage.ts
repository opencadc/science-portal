/**
 * Token Storage Utilities
 *
 * Manages authentication tokens in browser storage.
 * Uses localStorage by default for persistence across page reloads.
 *
 * Note: When using OIDC mode, tokens are managed by NextAuth via cookies.
 * This storage is only used for CANFAR mode.
 */

const TOKEN_KEY = 'canfar_auth_token';

/**
 * Save authentication token
 *
 * @param token - The authentication token to store
 */
export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get authentication token
 *
 * @returns The stored token or null if not found
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get Authorization header value.
 *
 * CANFAR mode: returns Bearer from localStorage (sessionStorage fallback used
 * in local dev where .canfar.net cookies can't reach localhost).
 *
 * OIDC mode: returns `{}` deliberately. The BFF reads the access token from
 * the NextAuth cookie server-side via `await auth()`; attaching a Bearer
 * client-side is redundant and dangerous — localStorage is not synchronously
 * updated when NextAuth rotates the access token, so a client-attached Bearer
 * is racy and can be a stale token while the server-side session has the
 * fresh one. Stay out of the BFF's way.
 */
export function getAuthHeader(): Record<string, string> {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_CANFAR !== 'true') {
    return {};
  }
  const token = getToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
}

/**
 * Clear all auth-related storage
 */
export function clearAuth(): void {
  removeToken();
  removeCredentials();
}

// Credentials storage for certificate generation
const CREDENTIALS_KEY = 'canfar_auth_credentials';

/**
 * Save user credentials (for certificate generation with HTTP Basic Auth)
 * Uses sessionStorage for better security (cleared on browser close)
 *
 * @param username - User's username
 * @param password - User's password
 */
export function saveCredentials(username: string, password: string): void {
  if (typeof window === 'undefined') return;
  // Store in sessionStorage (cleared when browser closes) for better security
  const credentials = { username, password };
  sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

/**
 * Get stored credentials
 *
 * @returns Credentials object with username and password, or null if not found
 */
export function getCredentials(): {
  username: string;
  password: string;
} | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(CREDENTIALS_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Remove stored credentials
 */
export function removeCredentials(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CREDENTIALS_KEY);
}
