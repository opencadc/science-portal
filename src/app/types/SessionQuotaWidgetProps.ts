export interface SessionQuotaWidgetProps {
  /** Active interactive sessions counting toward the Skaha quota. */
  count: number;
  /** Max interactive sessions. Defaults to MAX_INTERACTIVE_SESSIONS. */
  max?: number;
  isLoading?: boolean;
  isFetching?: boolean;
  errorMessage?: string;
  onRefresh?: () => void;
}
