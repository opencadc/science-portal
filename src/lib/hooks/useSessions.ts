/**
 * TanStack Query hooks for Skaha Sessions
 *
 * Provides hooks for fetching, creating, and managing Skaha sessions.
 */

import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  getSessions,
  getHeadlessSessions,
  getSession,
  launchSession,
  deleteSession,
  renewSession,
  getSessionLogs,
  getSessionEvents,
  type Session,
  type SessionLaunchParams,
  type SessionStatus,
} from '@/lib/api/skaha';
import { useAppStore } from '@/lib/stores';
import { isLaunchPendingPlaceholder } from '@/lib/sessions/sessionQuota';
import {
  HEADLESS_ACTIVE_STATUSES,
  HEADLESS_TERMINAL_STATUSES,
  type HeadlessJobGroup,
  headlessStatusesForGroup,
} from '@/lib/sessions/headlessJobs';

/**
 * Query keys for sessions
 */
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: () => [...sessionKeys.lists()] as const,
  headlessLists: () => [...sessionKeys.all, 'headless', 'list'] as const,
  /** Legacy unfiltered headless list key (full `?type=headless`). */
  headlessList: () => [...sessionKeys.headlessLists()] as const,
  headlessByStatus: (status: SessionStatus | string) =>
    [...sessionKeys.headlessLists(), status] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
  logs: (id: string) => [...sessionKeys.all, 'logs', id] as const,
  events: (id: string) => [...sessionKeys.all, 'events', id] as const,
};

/**
 * Get all active sessions
 *
 * @param isAuthenticated - Whether the user is authenticated (optional, defaults to true for backward compatibility)
 * @example
 * ```tsx
 * const { data: authStatus } = useAuthStatus();
 * const { data: sessions, isLoading, refetch } = useSessions(authStatus?.authenticated);
 * ```
 */
export function useSessions(
  isAuthenticated?: boolean,
  options?: Omit<UseQueryOptions<Session[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: getSessions,
    // Drop any leftover client-only launch placeholders; the list is server-owned.
    select: (sessions) => sessions.filter((s) => !isLaunchPendingPlaceholder(s)),
    // Only fetch if authenticated (default to true for backward compatibility)
    enabled: isAuthenticated !== false,
    // Avoid long “loading” from default retries when the token is rejected (stale/expired Bearer)
    retry(failureCount, error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (/\b401\b/.test(msg)) {
        return false;
      }
      return failureCount < 3;
    },
    // Refetch only while an *interactive* session is in a transitional state
    // (Pending). Headless batch jobs can sit Pending for hours and would
    // otherwise keep the loop alive forever. NOTE: don't use `connectUrl` as
    // part of the transitional check — Skaha sets it as soon as the route is
    // allocated, well before the pod is actually Running, so Pending sessions
    // routinely have a connectUrl already. Status is the only reliable signal.
    //
    // Deletions poll faster: after a DELETE the card stays in its
    // "Terminating" state until the session drops out of this list, so
    // converge quickly. A delete is in flight when the client marked the
    // session as being deleted (Zustand) or the server already reports
    // Terminating.
    refetchInterval: (query) => {
      const data = query.state.data;
      const operating = useAppStore.getState().operatingSessionIds;
      const hasTerminating =
        data?.some((s) => s.status === 'Terminating' || operating.get(s.id) === 'delete') ??
        false;
      if (hasTerminating) {
        return 5000;
      }
      const hasTransitional = data?.some(
        (s) => s.sessionType !== 'headless' && s.sessionType !== 'desktop-app' && s.status === 'Pending',
      );
      return hasTransitional ? 10000 : false;
    },
    refetchIntervalInBackground: false,
    ...options,
  });
}

/**
 * Headless (batch) sessions — single unfiltered query (legacy / tests).
 * Prefer `useHeadlessSessionsSplit` for the dashboard widget.
 */
export function useHeadlessSessions(
  isAuthenticated?: boolean,
  options?: Omit<UseQueryOptions<Session[]>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: sessionKeys.headlessList(),
    queryFn: () => getHeadlessSessions(),
    enabled: isAuthenticated !== false,
    retry(failureCount, error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (/\b401\b/.test(msg)) {
        return false;
      }
      return failureCount < 3;
    },
    refetchIntervalInBackground: false,
    ...options,
  });
}

export interface UseHeadlessSessionsSplitOptions {
  /** When false, no status queries run (opt-in Fetch now / auto-refresh). */
  enabled?: boolean;
  /** Polling interval in ms; false/undefined disables. Applied to enabled status queries. */
  refetchInterval?: number | false;
}

export interface HeadlessSessionsSplitResult {
  sessions: Session[];
  isLoading: boolean;
  isFetching: boolean;
  /** True after at least one active-status query has settled. */
  isFetched: boolean;
  refetch: () => Promise<unknown>;
  /** Per-tab: true while that group's status queries are still on first load. */
  groupLoading: Record<HeadlessJobGroup, boolean>;
  /** Per-tab: true once every status query for that group has settled at least once. */
  groupLoaded: Record<HeadlessJobGroup, boolean>;
}

function headlessRetry(failureCount: number, error: Error) {
  const msg = error.message;
  if (/\b401\b/.test(msg)) {
    return false;
  }
  return failureCount < 3;
}

/**
 * Headless sessions split by Skaha `status` — active statuses first, then terminal.
 * Progressive: Pending/Running tabs fill before Completed/Failed requests start.
 */
export function useHeadlessSessionsSplit(
  options: UseHeadlessSessionsSplitOptions = {},
): HeadlessSessionsSplitResult {
  const { enabled = false, refetchInterval = false } = options;

  const activeQueries = useQueries({
    queries: HEADLESS_ACTIVE_STATUSES.map((status) => ({
      queryKey: sessionKeys.headlessByStatus(status),
      queryFn: () => getHeadlessSessions({ status }),
      enabled,
      retry: headlessRetry,
      refetchInterval: enabled ? refetchInterval : false,
      refetchIntervalInBackground: false,
    })),
  });

  const activeSettled =
    enabled && activeQueries.length > 0 && activeQueries.every((q) => q.isFetched);

  const terminalQueries = useQueries({
    queries: HEADLESS_TERMINAL_STATUSES.map((status) => ({
      queryKey: sessionKeys.headlessByStatus(status),
      queryFn: () => getHeadlessSessions({ status }),
      enabled: enabled && activeSettled,
      retry: headlessRetry,
      refetchInterval: enabled && activeSettled ? refetchInterval : false,
      refetchIntervalInBackground: false,
    })),
  });

  const allQueries = useMemo(
    () => [...activeQueries, ...terminalQueries],
    [activeQueries, terminalQueries],
  );

  const sessions = useMemo(() => {
    const byId = new Map<string, Session>();
    for (const q of allQueries) {
      for (const s of q.data ?? []) {
        byId.set(s.id, s);
      }
    }
    return Array.from(byId.values());
  }, [allQueries]);

  const lookupStatusQuery = useCallback(
    (status: SessionStatus) => {
      const activeIdx = HEADLESS_ACTIVE_STATUSES.indexOf(status);
      if (activeIdx >= 0) return activeQueries[activeIdx];
      const terminalIdx = HEADLESS_TERMINAL_STATUSES.indexOf(status);
      if (terminalIdx >= 0) return terminalQueries[terminalIdx];
      return undefined;
    },
    [activeQueries, terminalQueries],
  );

  const groupLoaded = useMemo(() => {
    const loaded = (group: HeadlessJobGroup) =>
      Boolean(enabled) &&
      headlessStatusesForGroup(group).every((status) => lookupStatusQuery(status)?.isFetched === true);

    return {
      pending: loaded('pending'),
      running: loaded('running'),
      completed: loaded('completed'),
      failed: loaded('failed'),
    } satisfies Record<HeadlessJobGroup, boolean>;
  }, [enabled, lookupStatusQuery]);

  const groupLoading = useMemo(() => {
    const loading = (group: HeadlessJobGroup) => {
      if (!enabled) return false;
      const statuses = headlessStatusesForGroup(group);
      const isTerminal = group === 'completed' || group === 'failed';
      if (isTerminal && !activeSettled) return true;
      return statuses.some((status) => {
        const q = lookupStatusQuery(status);
        return Boolean(q && !q.isFetched && (q.isLoading || q.isPending || q.isFetching));
      });
    };
    return {
      pending: loading('pending'),
      running: loading('running'),
      completed: loading('completed'),
      failed: loading('failed'),
    } satisfies Record<HeadlessJobGroup, boolean>;
  }, [enabled, activeSettled, lookupStatusQuery]);

  const isFetched = Boolean(enabled && activeQueries.some((q) => q.isFetched));
  const isLoading =
    Boolean(enabled) && !isFetched && activeQueries.some((q) => q.isLoading || q.isPending);
  const isFetching = allQueries.some((q) => q.isFetching);

  const refetch = useCallback(async () => {
    await Promise.all(activeQueries.map((q) => q.refetch()));
    if (activeSettled) {
      await Promise.all(terminalQueries.map((q) => q.refetch()));
    }
  }, [activeQueries, terminalQueries, activeSettled]);

  return {
    sessions,
    isLoading,
    isFetching,
    isFetched,
    refetch,
    groupLoading,
    groupLoaded,
  };
}

/**
 * Get a specific session by ID
 *
 * @example
 * ```tsx
 * const { data: session } = useSession('session-123');
 * ```
 */
export function useSession(
  sessionId: string,
  options?: Omit<UseQueryOptions<Session>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Get session logs
 *
 * @example
 * ```tsx
 * const { data: logs } = useSessionLogs('session-123');
 * ```
 */
export function useSessionLogs(
  sessionId: string,
  options?: Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: sessionKeys.logs(sessionId),
    queryFn: () => getSessionLogs(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Get session container events log (plain text).
 *
 * @example
 * ```tsx
 * const { data: eventLog } = useSessionEvents('session-123', { enabled: modalOpen });
 * ```
 */
export function useSessionEvents(
  sessionId: string,
  options?: Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: sessionKeys.events(sessionId),
    queryFn: () => getSessionEvents(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Fetch session events or logs plain-text by view type.
 */
export function useSessionEventLog(
  sessionId: string,
  view: 'events' | 'logs',
  enabled: boolean,
  options?: Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  const isEvents = view === 'events';
  return useQuery({
    queryKey: isEvents ? sessionKeys.events(sessionId) : sessionKeys.logs(sessionId),
    queryFn: () => (isEvents ? getSessionEvents(sessionId) : getSessionLogs(sessionId)),
    enabled: enabled && !!sessionId,
    // Events/logs grow while the session runs, so always refetch when the
    // modal (re)opens instead of serving the 30s-fresh global cache. This also
    // guarantees the modal shows fetch feedback on every open.
    staleTime: 0,
    ...options,
  });
}

/**
 * Launch a new session
 *
 * @example
 * ```tsx
 * const { mutate: launch, isPending } = useLaunchSession();
 *
 * launch({
 *   sessionType: 'notebook',
 *   sessionName: 'my-analysis',
 *   containerImage: 'images.canfar.net/ml:latest',
 *   cores: 2,
 *   ram: 8,
 * });
 * ```
 */
export function useLaunchSession(
  options?: UseMutationOptions<Session, Error, SessionLaunchParams>,
) {
  const queryClient = useQueryClient();
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onSettled: userOnSettled,
    ...restOptions
  } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: launchSession,
    // Keep the list server-owned: do not append optimistic rows. In-flight
    // launch is tracked via `launchRequest` (Zustand) for modal + quota only.
    onSuccess: (newSession, variables, context, mutation) => {
      userOnSuccess?.(newSession, variables, context, mutation);
    },
    onError: (error, variables, context, mutation) => {
      userOnError?.(error, variables, context, mutation);
    },
    onSettled: (data, error, variables, context, mutation) => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      userOnSettled?.(data, error, variables, context, mutation);
    },
  });
}

/**
 * Delete/terminate a session
 *
 * @example
 * ```tsx
 * const { mutate: remove } = useDeleteSession();
 *
 * remove('session-123');
 * ```
 */
export function useDeleteSession(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: deleteSession,
    onSuccess: (data, sessionId, ...rest) => {
      userOnSuccess?.(data, sessionId, ...rest);

      // The sessions list is the source of truth for when the pod is actually
      // gone: refetch it now, then let the list's refetchInterval poll until
      // the session disappears (the caller keeps the card in a "Terminating"
      // state via the sessionUi slice in the meantime).
      queryClient.removeQueries({ queryKey: sessionKeys.detail(sessionId) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.headlessLists() });
    },
  });
}

/**
 * Renew/extend a session
 *
 * @example
 * ```tsx
 * const { mutate: renew } = useRenewSession();
 *
 * renew('session-123');
 * ```
 */
export function useRenewSession(options?: UseMutationOptions<Session, Error, string>) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: (sessionId) => renewSession(sessionId),
    onSuccess: (updatedSession, sessionId, ...rest) => {
      // Immediately update the session in the list with the new expiry time
      const currentSessions = queryClient.getQueryData<Session[]>(sessionKeys.list()) || [];
      const updatedSessions = currentSessions.map((session) =>
        session.id === updatedSession.id
          ? { ...session, expiresTime: updatedSession.expiresTime }
          : session,
      );
      queryClient.setQueryData(sessionKeys.list(), updatedSessions);

      // Update the specific session in cache
      queryClient.setQueryData(sessionKeys.detail(updatedSession.id), updatedSession);

      // Call user's onSuccess callback if provided
      userOnSuccess?.(updatedSession, sessionId, ...rest);
    },
  });
}

