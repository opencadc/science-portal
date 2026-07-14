import type { ReactNode, Ref } from 'react';

export interface PortalModalProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called when the user dismisses the dialog (close button or allowed backdrop/escape). */
  onClose: () => void;
  /** Modal heading — rendered as `h6` in the title row. */
  title: ReactNode;
  /** Optional leading icon in the title row. */
  icon?: ReactNode;
  /**
   * Initial load (React Query `isLoading`): no meaningful content yet.
   * Shows a centered spinner in the body and animates the progress bar.
   */
  isLoading?: boolean;
  /**
   * Background operation (React Query `isFetching`): stale content stays visible;
   * only the progress bar animates.
   */
  isFetching?: boolean;
  /** Error message; rendered above content when not in initial load. */
  error?: ReactNode;
  /** Optional alert/banner above content (info, warning, etc.). */
  alert?: ReactNode;
  /**
   * When true, block backdrop click, escape, and the title close button.
   * @default false — the user can dismiss the modal even while loading/fetching;
   * the in-flight request continues in the background.
   */
  disableClose?: boolean;
  /** When set, renders a refresh icon button in the title row (disabled while busy). */
  onRefresh?: () => void;
  /** Accessible name for the refresh button. @default 'refresh' */
  refreshAriaLabel?: string;
  /** Tooltip for the refresh button. @default 'Refresh' */
  refreshTooltip?: string;
  /** Extra controls in the title row (in addition to refresh). */
  headerActions?: ReactNode;
  /** Footer action buttons. When omitted, a single Close button is rendered. */
  actions?: ReactNode;
  /** Label for the default footer Close button. @default 'Close' */
  closeLabel?: string;
  /** Show the linear status bar under the title. @default true */
  showProgressBar?: boolean;
  /**
   * Determinate bar value when not busy (mirrors dashboard `statusValue`).
   * @default 100
   */
  progressValue?: number;
  /** @default 'sm' */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  /** Full-screen on small breakpoints. @default true */
  fullScreenMobile?: boolean;
  /** Show centered spinner during `isLoading`. @default true */
  showInitialSpinner?: boolean;
  /** Show the title-row close button. @default true */
  showCloseButton?: boolean;
  /** `id` for the title element (a11y). */
  titleId?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}
