import { describe, it, expect } from 'vitest';
import type { Session } from '@/lib/api/skaha';
import {
  filterHeadlessJobsByGroup,
  groupHeadlessJobsByState,
  headlessGroupForStatus,
  headlessStatusesForGroup,
  HEADLESS_ACTIVE_STATUSES,
  HEADLESS_TERMINAL_STATUSES,
  HEADLESS_SPLIT_STATUSES,
  isHeadlessSession,
} from './headlessJobs';

const headless = (id: string, status: Session['status']): Session => ({
  id,
  sessionType: 'headless',
  sessionName: `batch-${id}`,
  status,
  containerImage: 'images.canfar.net/test/headless:latest',
  startedTime: '',
  expiresTime: '',
  memoryAllocated: '',
  cpuAllocated: '',
});

describe('isHeadlessSession', () => {
  it('matches headless type only', () => {
    expect(isHeadlessSession(headless('1', 'Running'))).toBe(true);
    expect(
      isHeadlessSession({
        ...headless('2', 'Running'),
        sessionType: 'notebook',
      }),
    ).toBe(false);
  });
});

describe('groupHeadlessJobsByState', () => {
  it('counts Pending correctly', () => {
    const sessions = [
      headless('1', 'Pending'),
      headless('2', 'Pending'),
      headless('3', 'Running'),
    ];
    expect(groupHeadlessJobsByState(sessions).pending).toBe(2);
  });

  it('counts Running correctly', () => {
    const sessions = [
      headless('1', 'Running'),
      headless('2', 'Running'),
      headless('3', 'Running'),
      headless('4', 'Pending'),
    ];
    expect(groupHeadlessJobsByState(sessions).running).toBe(3);
  });

  it('maps Succeeded and Completed to completed', () => {
    const sessions = [headless('1', 'Succeeded'), headless('2', 'Completed')];
    expect(groupHeadlessJobsByState(sessions).completed).toBe(2);
  });

  it('maps Failed and Error to failed', () => {
    const sessions = [headless('1', 'Failed'), headless('2', 'Error')];
    expect(groupHeadlessJobsByState(sessions).failed).toBe(2);
  });

  it('treats Terminating as running', () => {
    const sessions = [headless('1', 'Terminating'), headless('2', 'Running')];
    expect(groupHeadlessJobsByState(sessions).running).toBe(2);
  });

  it('ignores unknown statuses', () => {
    const sessions = [headless('1', 'Unknown'), headless('2', 'Pending')];
    const result = groupHeadlessJobsByState(sessions);
    expect(result.pending).toBe(1);
    expect(result.running + result.completed + result.failed).toBe(0);
  });
});

describe('filterHeadlessJobsByGroup', () => {
  const sessions = [
    headless('1', 'Pending'),
    headless('2', 'Running'),
    headless('3', 'Succeeded'),
    headless('4', 'Failed'),
    headless('5', 'Terminating'),
  ];

  it('filters each group', () => {
    expect(filterHeadlessJobsByGroup(sessions, 'pending').map((s) => s.id)).toEqual(['1']);
    expect(filterHeadlessJobsByGroup(sessions, 'running').map((s) => s.id)).toEqual([
      '2',
      '5',
    ]);
    expect(filterHeadlessJobsByGroup(sessions, 'completed').map((s) => s.id)).toEqual(['3']);
    expect(filterHeadlessJobsByGroup(sessions, 'failed').map((s) => s.id)).toEqual(['4']);
  });
});

describe('status-split mapping', () => {
  it('maps each Skaha status to a widget group', () => {
    expect(headlessGroupForStatus('Pending')).toBe('pending');
    expect(headlessGroupForStatus('Running')).toBe('running');
    expect(headlessGroupForStatus('Terminating')).toBe('running');
    expect(headlessGroupForStatus('Succeeded')).toBe('completed');
    expect(headlessGroupForStatus('Completed')).toBe('completed');
    expect(headlessGroupForStatus('Failed')).toBe('failed');
    expect(headlessGroupForStatus('Error')).toBe('failed');
    expect(headlessGroupForStatus('Unknown')).toBeNull();
  });

  it('lists statuses per group for split fetches', () => {
    expect(headlessStatusesForGroup('pending')).toEqual(['Pending']);
    expect(headlessStatusesForGroup('running')).toEqual(['Running', 'Terminating']);
    expect(headlessStatusesForGroup('completed')).toEqual(['Succeeded', 'Completed']);
    expect(headlessStatusesForGroup('failed')).toEqual(['Failed', 'Error']);
  });

  it('orders active before terminal for progressive fetch', () => {
    expect([...HEADLESS_ACTIVE_STATUSES]).toEqual(['Pending', 'Running', 'Terminating']);
    expect([...HEADLESS_TERMINAL_STATUSES]).toEqual([
      'Succeeded',
      'Completed',
      'Failed',
      'Error',
    ]);
    expect([...HEADLESS_SPLIT_STATUSES]).toEqual([
      ...HEADLESS_ACTIVE_STATUSES,
      ...HEADLESS_TERMINAL_STATUSES,
    ]);
  });
});
