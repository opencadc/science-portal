/**
 * Strip credentials before anything is written to logs.
 * Values are replaced outright — a prefix of a bearer token or session cookie
 * is still a secret.
 */

export const REDACTED = '[redacted]';

const SENSITIVE_HEADER =
  /^(authorization|proxy-authorization|cookie|set-cookie|x-skaha-registry-auth|x-api-key)$/i;

const SENSITIVE_FIELD =
  /^(password|token|access_token|refresh_token|id_token|accessToken|refreshToken|idToken|secret|registrySecret|authorization|cookie|set-cookie|env)$/i;

const SENSITIVE_BODY = /password|authorization|cookie|token|registrySecret/i;

export function isProductionLog(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function redactHeaderRecord(headers: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    const secretValue = typeof value === 'string' && SENSITIVE_BODY.test(value);
    redacted[key] = SENSITIVE_HEADER.test(key) || secretValue ? REDACTED : value;
  }
  return redacted;
}

export function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
  const record: Record<string, string> = {};
  if (!headers) return record;

  const asHeaders = headers as { forEach?: (callback: (value: string, key: string) => void) => void };
  if (!Array.isArray(headers) && typeof asHeaders.forEach === 'function') {
    asHeaders.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }

  const entries = Array.isArray(headers)
    ? headers
    : Object.entries(headers as Record<string, string>);
  for (const [key, value] of entries) {
    record[key] = value;
  }
  return record;
}

export function cookieNames(cookieHeader: string): string[] {
  return cookieHeader
    .split(';')
    .map((part) => part.trim().split('=')[0])
    .filter(Boolean);
}

export function redactSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }
  if (typeof value === 'string') {
    return (SENSITIVE_BODY.test(value) ? REDACTED : value) as T;
  }
  if (value && typeof value === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      redacted[key] =
        SENSITIVE_HEADER.test(key) || SENSITIVE_FIELD.test(key) ? REDACTED : redactSecrets(nested);
    }
    return redacted as T;
  }
  return value;
}

/** Form bodies and raw text. Anything that looks like a credential is dropped whole. */
export function redactBodyText(body: string): string {
  if (SENSITIVE_BODY.test(body)) return REDACTED;
  return body.length > 500 ? `${body.slice(0, 500)}…` : body;
}
