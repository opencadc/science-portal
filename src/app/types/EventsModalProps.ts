/**
 * Event type for container startup logs
 */
export type EventType = 'Normal' | 'Warning' | 'Error';

/**
 * Event reason categories
 */
export type EventReason =
  | 'Scheduled'
  | 'Pulling'
  | 'Pulled'
  | 'Created'
  | 'Started'
  | 'Failed'
  | 'BackOff'
  | 'Unhealthy'
  | 'Killing'
  | 'Preempting';

/**
 * Individual event from Kubernetes
 */
export interface SessionEvent {
  id: string;
  type: EventType;
  reason: EventReason;
  message: string;
  firstTime: string | null;
  lastTime: string | null;
  count?: number;
}

/**
 * Props for the EventsModal component
 */
export interface EventsModalProps {
  /**
   * Controls whether the modal is open
   */
  open: boolean;

  /**
   * Session ID to fetch events for
   */
  sessionId: string;

  /**
   * Display name of the session
   */
  sessionName?: string;

  /**
   * Callback when the modal is closed
   */
  onClose: () => void;

  /**
   * Which Skaha plain-text log to fetch. Also drives the modal title/icon
   * ("Container Events" vs "Container Logs").
   */
  logView?: 'events' | 'logs';

  /**
   * Maximum number of events to display
   */
  maxEvents?: number;

  /**
   * Show refresh button
   */
  showRefreshButton?: boolean;

  /**
   * Force raw view mode (hides the parsing toggle)
   */
  forceRawView?: boolean;

  /**
   * Default view mode (table or raw)
   */
  defaultView?: 'table' | 'raw';
}
