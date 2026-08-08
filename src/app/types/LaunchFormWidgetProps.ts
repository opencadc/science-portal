import { SessionLaunchFormProps } from './SessionLaunchFormProps';
import type { Session, SessionLaunchParams } from '@/lib/api/skaha';

export interface LaunchFormWidgetProps extends SessionLaunchFormProps {
  /** Initial load — renders the form skeleton and animates the status bar. */
  isLoading?: boolean;
  /** Background refetch — keeps the form, only animates the status bar. */
  isFetching?: boolean;
  onRefresh?: () => void;
  title?: string;
  showProgressIndicator?: boolean;
  progressPercentage?: number;
  helpUrl?: string;
  /** When set (e.g. logged-out empty state), shows an info alert above the form. */
  signInAlertMessage?: string;
  // Optional custom launch function to override default API call
  launchSessionFn?: (params: SessionLaunchParams) => Promise<Session>;
  /** Stretch to fill the dashboard grid cell. */
  fillHeight?: boolean;
}
