'use client';

import { useAppStore } from './app-store';

export const useOperatingSessionIds = () => useAppStore((s) => s.operatingSessionIds);

export const useIsSessionOperating = (sessionId: string) =>
  useAppStore((s) => s.operatingSessionIds.has(sessionId));

export const useLoginModal = () => useAppStore((s) => s.authModals.login);

export const useResetPasswordModal = () => useAppStore((s) => s.authModals.resetPassword);

export const useOidcLoginPending = () => useAppStore((s) => s.authModals.oidcLoginPending);

export const useLaunchRequest = () => useAppStore((s) => s.launchRequest);

export const useSessionHealthCheck = () =>
  useAppStore((s) => s.sessionModals.healthCheck);

export const useMobileDrawerOpen = () => useAppStore((s) => s.mobileDrawerOpen);

export const useSessionUiActions = () =>
  useAppStore((s) => ({
    markOperating: s.markOperating,
    clearOperating: s.clearOperating,
    setLaunchRequest: s.setLaunchRequest,
  }));

export const useAuthModalActions = () =>
  useAppStore((s) => ({
    openLogin: s.openLogin,
    closeLogin: s.closeLogin,
    openResetPassword: s.openResetPassword,
    closeResetPassword: s.closeResetPassword,
    setOidcLoginPending: s.setOidcLoginPending,
  }));

export const useSessionModalsActions = () =>
  useAppStore((s) => ({
    openHealthCheck: s.openHealthCheck,
    closeHealthCheck: s.closeHealthCheck,
    setHealthCheckChecking: s.setHealthCheckChecking,
  }));

export const useNavigationActions = () =>
  useAppStore((s) => ({
    openMobileDrawer: s.openMobileDrawer,
    closeMobileDrawer: s.closeMobileDrawer,
    toggleMobileDrawer: s.toggleMobileDrawer,
  }));
