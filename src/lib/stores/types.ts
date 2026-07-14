import type { SessionFormData } from '@/app/types/SessionLaunchFormProps';
import type { SessionRequestStatus } from '@/app/types/SessionRequestModalProps';

export type ThemeMode = 'light' | 'dark';
export type AuthModalTrigger = 'auto' | 'manual';
export type UploadStatus = 'queued' | 'uploading' | 'success' | 'error' | 'cancelled';
export type StorageViewMode = 'list' | 'grid';
export type SessionDetailKind = 'events' | 'logs' | 'delete' | 'renew';
/** Kind of in-flight mutation a session card is showing an overlay for. */
export type SessionOperation = 'delete' | 'renew';

export interface LaunchRequestState {
  status: SessionRequestStatus;
  error?: string;
  sessionData: SessionFormData;
}

export interface ActiveSessionDetail {
  sessionId: string;
  kind: SessionDetailKind;
}

export interface UploadItem {
  id: string;
  fileName: string;
  fileSize: number;
  targetPath: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

export interface SessionUiSlice {
  /** Sessions with an in-flight mutation, keyed by session id. */
  operatingSessionIds: Map<string, SessionOperation>;
  launchRequest: LaunchRequestState | null;
  markOperating: (sessionId: string, operation: SessionOperation) => void;
  clearOperating: (sessionId: string) => void;
  setLaunchRequest: (request: LaunchRequestState | null) => void;
  resetSessionUi: () => void;
}

export interface AuthModalsSlice {
  authModals: {
    login: { open: boolean; trigger: AuthModalTrigger | null };
    resetPassword: { open: boolean };
    registration: { open: boolean };
    oidcLoginPending: boolean;
  };
  openLogin: (trigger?: AuthModalTrigger) => void;
  closeLogin: () => void;
  openResetPassword: () => void;
  closeResetPassword: () => void;
  openRegistration: () => void;
  closeRegistration: () => void;
  setOidcLoginPending: (pending: boolean) => void;
  closeAllAuthModals: () => void;
}

export interface SessionModalsSlice {
  sessionModals: {
    activeDetail: ActiveSessionDetail | null;
  };
  openSessionDetail: (detail: ActiveSessionDetail) => void;
  closeSessionDetail: () => void;
}

export interface NavigationSlice {
  mobileDrawerOpen: boolean;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleMobileDrawer: () => void;
}

/** Stub slice — implemented in storage feature track (ADR 0001 S2). */
export interface StorageUiSlice {
  storageUi: {
    selectedPaths: Set<string>;
    viewMode: StorageViewMode;
    clipboard: { op: 'copy' | 'move'; paths: string[] } | null;
  };
  resetStorageUi: () => void;
}

/** Stub slice — implemented in storage feature track (ADR 0001 S2). */
export interface UploadsSlice {
  uploads: {
    items: UploadItem[];
    panelOpen: boolean;
  };
  resetUploads: () => void;
}

export type AppStore = SessionUiSlice &
  AuthModalsSlice &
  SessionModalsSlice &
  NavigationSlice &
  StorageUiSlice &
  UploadsSlice;

export const initialAuthModals: AuthModalsSlice['authModals'] = {
  login: { open: false, trigger: null },
  resetPassword: { open: false },
  registration: { open: false },
  oidcLoginPending: false,
};

export const initialSessionModals: SessionModalsSlice['sessionModals'] = {
  activeDetail: null,
};

export const initialStorageUi: StorageUiSlice['storageUi'] = {
  selectedPaths: new Set<string>(),
  viewMode: 'list',
  clipboard: null,
};

export const initialUploads: UploadsSlice['uploads'] = {
  items: [],
  panelOpen: false,
};
