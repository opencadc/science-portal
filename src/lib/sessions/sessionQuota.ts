import type { Session } from '@/lib/api/skaha';

/** Skaha interactive session cap (until exposed via context API). */
export const MAX_INTERACTIVE_SESSIONS = 3;

/** Optimistic list placeholder while POST /sessions is in flight. */
export const LAUNCH_PENDING_PLACEHOLDER_ID = '__launch_pending__';

export interface SessionLaunchQuota {
  max: number;
  used: number;
  inFlight: number;
  remaining: number;
  atLimit: boolean;
  canLaunch: boolean;
}

export function formatMaxSessionsMessage(max: number = MAX_INTERACTIVE_SESSIONS): string {
  return `You have reached the maximum limit of ${max} active sessions. Please delete an existing session before creating a new one.`;
}

export const SESSION_QUOTA_REACHED_MESSAGE = formatMaxSessionsMessage();

/** Interactive sessions shown in the dashboard and counted toward Skaha quota. */
export function isInteractiveSession(session: Session): boolean {
  return session.sessionType !== 'headless' && session.sessionType !== 'desktop-app';
}

export function isLaunchPendingPlaceholder(session: Session): boolean {
  return session.id === LAUNCH_PENDING_PLACEHOLDER_ID;
}

/** True when Skaha has assigned a real session id (not the launch placeholder). */
export function hasAssignedSessionId(sessionId: string | undefined): boolean {
  return !!sessionId && sessionId !== LAUNCH_PENDING_PLACEHOLDER_ID;
}

export function countQuotaSessions(sessions: Session[]): number {
  return sessions.filter(isInteractiveSession).length;
}

/**
 * Effective quota while launching: interactive sessions from the query cache
 * plus one reserved slot when a launch request is in flight (`launchRequest`).
 */
export function getSessionLaunchQuota(
  sessions: Session[],
  hasInFlightLaunch: boolean,
  max: number = MAX_INTERACTIVE_SESSIONS,
): SessionLaunchQuota {
  const used = countQuotaSessions(sessions.filter((s) => !isLaunchPendingPlaceholder(s)));
  const inFlight = hasInFlightLaunch ? 1 : 0;
  const effectiveUsed = used + inFlight;
  const remaining = Math.max(0, max - effectiveUsed);
  const atLimit = effectiveUsed >= max;

  return {
    max,
    used,
    inFlight,
    remaining,
    atLimit,
    canLaunch: !atLimit,
  };
}
