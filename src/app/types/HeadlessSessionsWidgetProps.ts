import type { Session } from '@/lib/api/skaha';
import type { HeadlessJobGroup } from '@/lib/sessions/headlessJobs';

/** Allowed auto-refresh intervals (seconds) for the Headless Sessions widget. */
export const HEADLESS_AUTO_REFRESH_INTERVALS_SEC = [
  30, 45, 60, 120, 240, 480, 960,
] as const;

export type HeadlessAutoRefreshIntervalSec =
  (typeof HEADLESS_AUTO_REFRESH_INTERVALS_SEC)[number];

export interface HeadlessAutoRefreshSettings {
  enabled: boolean;
  intervalSec: HeadlessAutoRefreshIntervalSec;
}

export interface HeadlessSessionsWidgetProps {
  sessions?: Session[];
  /** Sessions with an in-flight mutation, keyed by session id. */
  operatingSessionIds?: Map<string, 'delete' | 'renew'>;
  /** Initial load — skeletons + indeterminate status bar (active groups). */
  isLoading?: boolean;
  /** Background refetch — keep content, animate status bar. */
  isFetching?: boolean;
  /**
   * True after at least one successful/settled headless fetch.
   * When false, the widget shows an idle prompt instead of an empty-group message.
   */
  hasLoaded?: boolean;
  /** Per-tab first-load in progress (progressive status-split fetch). */
  groupLoading?: Partial<Record<HeadlessJobGroup, boolean>>;
  /** Per-tab: every status query for that group has settled at least once. */
  groupLoaded?: Partial<Record<HeadlessJobGroup, boolean>>;
  /** Manual "Fetch now" (and DashboardWidget refresh if wired). */
  onRefresh?: () => void;
  /**
   * Notified when the user toggles auto-refresh or changes the interval.
   * Parent should pass `refetchInterval` / `enabled` into `useHeadlessSessionsSplit`.
   */
  onAutoRefreshSettingsChange?: (settings: HeadlessAutoRefreshSettings) => void;
  title?: string;
  showSessionCount?: boolean;
  emptyMessage?: string;
  /** Shown before the first fetch (auto-refresh off, no Fetch now yet). */
  idleMessage?: string;
}
