import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, resetAppUiState } from './app-store';
import { initialAuthModals, initialSessionModals, initialUploads } from './types';

describe('useAppStore', () => {
  beforeEach(() => {
    resetAppUiState();
  });

  it('tracks operating sessions with their operation kind', () => {
    useAppStore.getState().markOperating('session-a', 'delete');
    expect(useAppStore.getState().operatingSessionIds.get('session-a')).toBe('delete');

    useAppStore.getState().markOperating('session-a', 'renew');
    expect(useAppStore.getState().operatingSessionIds.get('session-a')).toBe('renew');

    useAppStore.getState().clearOperating('session-a');
    expect(useAppStore.getState().operatingSessionIds.has('session-a')).toBe(false);
  });

  it('opens and closes auth modals', () => {
    useAppStore.getState().openLogin('auto');
    expect(useAppStore.getState().authModals.login).toEqual({ open: true, trigger: 'auto' });

    useAppStore.getState().closeAllAuthModals();
    expect(useAppStore.getState().authModals).toEqual(initialAuthModals);
  });

  it('resetAppUiState clears client UI slices', () => {
    useAppStore.getState().markOperating('session-b', 'delete');
    useAppStore.getState().openLogin('manual');
    useAppStore.getState().openSessionDetail({ sessionId: 's-1', kind: 'events' });
    useAppStore.getState().openMobileDrawer();
    useAppStore.getState().setLaunchRequest({
      status: 'requesting',
      sessionData: {
        type: 'notebook',
        sessionName: 'test',
        containerImage: 'image',
        resourceType: 'flexible',
        cores: 1,
        memory: 4,
        repositoryHost: '',
      },
    });

    resetAppUiState();

    expect(useAppStore.getState().operatingSessionIds.size).toBe(0);
    expect(useAppStore.getState().authModals).toEqual(initialAuthModals);
    expect(useAppStore.getState().sessionModals).toEqual(initialSessionModals);
    expect(useAppStore.getState().mobileDrawerOpen).toBe(false);
    expect(useAppStore.getState().launchRequest).toBeNull();
    expect(useAppStore.getState().uploads).toEqual(initialUploads);
  });

  it('manages launch request overlay state', () => {
    const sessionData = {
      type: 'notebook' as const,
      sessionName: 'nb-1',
      containerImage: 'img',
      resourceType: 'flexible' as const,
      cores: 2,
      memory: 8,
      repositoryHost: 'repo',
    };

    useAppStore.getState().setLaunchRequest({ status: 'requesting', sessionData });
    expect(useAppStore.getState().launchRequest?.status).toBe('requesting');

    useAppStore.getState().setLaunchRequest(null);
    expect(useAppStore.getState().launchRequest).toBeNull();
  });

  it('toggles mobile drawer', () => {
    expect(useAppStore.getState().mobileDrawerOpen).toBe(false);
    useAppStore.getState().toggleMobileDrawer();
    expect(useAppStore.getState().mobileDrawerOpen).toBe(true);
    useAppStore.getState().closeMobileDrawer();
    expect(useAppStore.getState().mobileDrawerOpen).toBe(false);
  });
});
