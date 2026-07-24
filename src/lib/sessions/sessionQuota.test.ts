import { describe, it, expect } from 'vitest';
import type { Session } from '@/lib/api/skaha';
import {
  countQuotaSessions,
  getSessionLaunchQuota,
  hasAssignedSessionId,
  isInteractiveSession,
  LAUNCH_PENDING_PLACEHOLDER_ID,
  MAX_INTERACTIVE_SESSIONS,
} from './sessionQuota';

const interactive = (id: string, overrides: Partial<Session> = {}): Session => ({
  id,
  sessionType: 'notebook',
  sessionName: `nb-${id}`,
  status: 'Running',
  containerImage: 'img',
  startedTime: '',
  expiresTime: '',
  memoryAllocated: '',
  cpuAllocated: '',
  ...overrides,
});

describe('isInteractiveSession', () => {
  it('excludes headless and desktop-app', () => {
    expect(isInteractiveSession(interactive('1'))).toBe(true);
    expect(isInteractiveSession(interactive('2', { sessionType: 'headless' }))).toBe(false);
    expect(isInteractiveSession(interactive('3', { sessionType: 'desktop-app' }))).toBe(false);
  });
});

describe('countQuotaSessions', () => {
  it('counts interactive sessions regardless of status', () => {
    const sessions = [
      interactive('1'),
      interactive('2', { status: 'Pending' }),
      interactive('3', { status: 'Terminating' }),
      interactive('4', { sessionType: 'headless' }),
    ];
    expect(countQuotaSessions(sessions)).toBe(3);
  });
});

describe('getSessionLaunchQuota', () => {
  it('allows launch when under the cap', () => {
    const quota = getSessionLaunchQuota([interactive('1'), interactive('2')], false);
    expect(quota.canLaunch).toBe(true);
    expect(quota.remaining).toBe(1);
    expect(quota.inFlight).toBe(0);
  });

  it('blocks at exactly max sessions', () => {
    const sessions = [interactive('1'), interactive('2'), interactive('3')];
    const quota = getSessionLaunchQuota(sessions, false);
    expect(quota.canLaunch).toBe(false);
    expect(quota.atLimit).toBe(true);
    expect(quota.remaining).toBe(0);
  });

  it('reserves one slot for an in-flight launch request', () => {
    const quota = getSessionLaunchQuota([interactive('1'), interactive('2')], true);
    expect(quota.canLaunch).toBe(false);
    expect(quota.inFlight).toBe(1);
    expect(quota.used).toBe(2);
  });

  it('ignores leftover launch placeholders when counting used sessions', () => {
    const sessions = [
      interactive('1'),
      interactive('2'),
      interactive(LAUNCH_PENDING_PLACEHOLDER_ID, { status: 'Pending' }),
    ];
    const quota = getSessionLaunchQuota(sessions, true);
    expect(quota.used).toBe(2);
    expect(quota.inFlight).toBe(1);
    expect(quota.canLaunch).toBe(false);
  });

  it('uses configured max', () => {
    const quota = getSessionLaunchQuota([interactive('1')], false, MAX_INTERACTIVE_SESSIONS);
    expect(quota.max).toBe(3);
  });
});

describe('hasAssignedSessionId', () => {
  it('rejects missing and launch placeholder ids', () => {
    expect(hasAssignedSessionId(undefined)).toBe(false);
    expect(hasAssignedSessionId('')).toBe(false);
    expect(hasAssignedSessionId(LAUNCH_PENDING_PLACEHOLDER_ID)).toBe(false);
  });

  it('accepts real Skaha session ids', () => {
    expect(hasAssignedSessionId('abc-123')).toBe(true);
  });
});
