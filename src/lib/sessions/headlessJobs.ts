import type { Session, SessionStatus } from '@/lib/api/skaha';

/** Status tabs in the Headless Sessions widget (CanfarDesktop BatchJobs parity). */
export type HeadlessJobGroup = 'pending' | 'running' | 'completed' | 'failed';

export interface HeadlessJobCounts {
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

/** Skaha statuses fetched first (Pending / Running tabs). */
export const HEADLESS_ACTIVE_STATUSES: readonly SessionStatus[] = [
  'Pending',
  'Running',
  'Terminating',
];

/** Skaha statuses fetched after active settle (Completed / Failed tabs). */
export const HEADLESS_TERMINAL_STATUSES: readonly SessionStatus[] = [
  'Succeeded',
  'Completed',
  'Failed',
  'Error',
];

export const HEADLESS_SPLIT_STATUSES: readonly SessionStatus[] = [
  ...HEADLESS_ACTIVE_STATUSES,
  ...HEADLESS_TERMINAL_STATUSES,
];

/** Which widget tab a Skaha status belongs to. */
export function headlessGroupForStatus(status: SessionStatus | string): HeadlessJobGroup | null {
  switch (status) {
    case 'Pending':
      return 'pending';
    case 'Running':
    case 'Terminating':
      return 'running';
    case 'Succeeded':
    case 'Completed':
      return 'completed';
    case 'Failed':
    case 'Error':
      return 'failed';
    default:
      return null;
  }
}

/** Skaha status values that make up a widget tab. */
export function headlessStatusesForGroup(group: HeadlessJobGroup): readonly SessionStatus[] {
  switch (group) {
    case 'pending':
      return ['Pending'];
    case 'running':
      return ['Running', 'Terminating'];
    case 'completed':
      return ['Succeeded', 'Completed'];
    case 'failed':
      return ['Failed', 'Error'];
  }
}

export function isHeadlessSession(session: Session): boolean {
  return session.sessionType === 'headless';
}

export function isHeadlessCompletedStatus(status: SessionStatus | string): boolean {
  return status === 'Succeeded' || status === 'Completed';
}

export function isHeadlessFailedStatus(status: SessionStatus | string): boolean {
  return status === 'Failed' || status === 'Error';
}

export function isHeadlessActiveStatus(status: SessionStatus | string): boolean {
  return status === 'Pending' || status === 'Running' || status === 'Terminating';
}

/**
 * Group headless jobs by lifecycle state — mirrors CanfarDesktop BatchJobsHelper.
 */
export function groupHeadlessJobsByState(sessions: Session[]): HeadlessJobCounts {
  let pending = 0;
  let running = 0;
  let completed = 0;
  let failed = 0;

  for (const s of sessions) {
    switch (s.status) {
      case 'Pending':
        pending++;
        break;
      case 'Running':
      case 'Terminating':
        running++;
        break;
      case 'Succeeded':
      case 'Completed':
        completed++;
        break;
      case 'Failed':
      case 'Error':
        failed++;
        break;
      default:
        break;
    }
  }

  return { pending, running, completed, failed };
}

export function filterHeadlessJobsByGroup(
  sessions: Session[],
  group: HeadlessJobGroup,
): Session[] {
  return sessions.filter((s) => {
    switch (group) {
      case 'pending':
        return s.status === 'Pending';
      case 'running':
        return s.status === 'Running' || s.status === 'Terminating';
      case 'completed':
        return isHeadlessCompletedStatus(s.status);
      case 'failed':
        return isHeadlessFailedStatus(s.status);
      default:
        return false;
    }
  });
}
