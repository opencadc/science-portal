'use client';

import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AppStore, SessionOperation } from './types';
import {
  initialAuthModals,
  initialSessionModals,
  initialStorageUi,
  initialUploads,
} from './types';

enableMapSet();

export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector(
      immer((set) => ({
        operatingSessionIds: new Map<string, SessionOperation>(),
        launchRequest: null,

        markOperating: (sessionId, operation) =>
          set((state) => {
            state.operatingSessionIds.set(sessionId, operation);
          }),

        clearOperating: (sessionId) =>
          set((state) => {
            state.operatingSessionIds.delete(sessionId);
          }),

        setLaunchRequest: (launchRequest) => set({ launchRequest }),

        resetSessionUi: () =>
          set({
            operatingSessionIds: new Map<string, SessionOperation>(),
            launchRequest: null,
          }),

        authModals: initialAuthModals,

        openLogin: (trigger = 'manual') =>
          set((state) => {
            state.authModals.login = { open: true, trigger };
          }),

        closeLogin: () =>
          set((state) => {
            state.authModals.login = { open: false, trigger: null };
          }),

        openResetPassword: () =>
          set((state) => {
            state.authModals.resetPassword.open = true;
          }),

        closeResetPassword: () =>
          set((state) => {
            state.authModals.resetPassword.open = false;
          }),

        openRegistration: () =>
          set((state) => {
            state.authModals.registration.open = true;
          }),

        closeRegistration: () =>
          set((state) => {
            state.authModals.registration.open = false;
          }),

        setOidcLoginPending: (oidcLoginPending) =>
          set((state) => {
            state.authModals.oidcLoginPending = oidcLoginPending;
          }),

        closeAllAuthModals: () => set({ authModals: initialAuthModals }),

        sessionModals: initialSessionModals,

        openSessionDetail: (activeDetail) =>
          set((state) => {
            state.sessionModals.activeDetail = activeDetail;
          }),

        closeSessionDetail: () =>
          set((state) => {
            state.sessionModals.activeDetail = null;
          }),

        mobileDrawerOpen: false,

        openMobileDrawer: () => set({ mobileDrawerOpen: true }),
        closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
        toggleMobileDrawer: () =>
          set((state) => {
            state.mobileDrawerOpen = !state.mobileDrawerOpen;
          }),

        storageUi: initialStorageUi,

        resetStorageUi: () =>
          set({
            storageUi: {
              selectedPaths: new Set<string>(),
              viewMode: 'list',
              clipboard: null,
            },
          }),

        uploads: initialUploads,

        resetUploads: () => set({ uploads: initialUploads }),
      })),
    ),
    { name: 'AppStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

/** Reset all client UI slices (called on logout). */
export function resetAppUiState(): void {
  const state = useAppStore.getState();
  state.resetSessionUi();
  state.closeAllAuthModals();
  state.closeSessionDetail();
  state.closeMobileDrawer();
  state.resetStorageUi();
  state.resetUploads();
}
