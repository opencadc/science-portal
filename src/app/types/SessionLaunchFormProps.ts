export type SessionType = 'notebook' | 'desktop' | 'carta' | 'contributed' | 'firefly';

/** Which launch-form tab produced a submit payload. */
export type LaunchFormTab = 'standard' | 'advanced';

export interface SessionFormData {
  type: SessionType;
  project: string;
  containerImage: string;
  sessionName: string;
  memory: number;
  cores: number;
  gpus?: number; // GPU cores (optional)
  resourceType?: 'flexible' | 'fixed'; // Track if resources are flexible or fixed
  // Advanced tab fields
  repositoryHost?: string;
  image?: string;
  repositoryAuthUsername?: string;
  repositoryAuthSecret?: string;
  /**
   * Set on submit so launch uses Standard vs Advanced values explicitly.
   * Form state is keyed per tab; leftover Advanced fields must not win on Standard.
   * Mirrors shareable `?tab=standard|advanced` (auth username/secret are never URL state).
   */
  sourceTab?: LaunchFormTab;
}

export interface SessionSettings {
  cores: number;
  memory: number;
}

import type { ImagesByTypeAndProject, Session } from '@/lib/api/skaha';

export interface SessionLaunchFormProps {
  onLaunch?: (data: SessionFormData) => void | Promise<void>;
  onReset?: () => void;
  onSessionTypeChange?: (sessionType: string) => void;
  imagesByType?: ImagesByTypeAndProject;
  repositoryHosts?: string[];
  memoryOptions?: number[];
  coreOptions?: number[];
  gpuOptions?: number[];
  defaultValues?: Partial<SessionFormData>;
  isLoading?: boolean;
  errorMessage?: string | null;
  activeSessions?: Session[];
  /** When false, Launch is disabled (session quota reached). */
  canLaunch?: boolean;
  /** Shown when Launch is disabled due to quota. */
  launchDisabledReason?: string;
}
