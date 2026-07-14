import { SessionCardProps } from './SessionCardProps';

export interface ActiveSessionsWidgetProps {
  sessions: SessionCardProps[];
  operatingSessionIds?: Set<string>; // IDs of sessions currently being operated on (delete/renew)
  /** Initial load — renders skeleton cards and animates the status bar. */
  isLoading?: boolean;
  /** Background refetch — keeps content, only animates the status bar. */
  isFetching?: boolean;
  onRefresh?: () => void;
  title?: string;
  showSessionCount?: boolean;
  maxSessionsToShow?: number;
  emptyMessage?: string;
  /** When true, stretch to match the User Home Storage panel height on desktop. */
  fillHeight?: boolean;
}
