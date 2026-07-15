'use client';

import { useCallback, useEffect, useRef } from 'react';
import { DeleteSessionModal } from '@/app/components/DeleteSessionModal/DeleteSessionModal';
import { SessionRenewModal } from '@/app/components/SessionRenewModal/SessionRenewModal';
import { EventsModal } from '@/app/components/EventsModal/EventsModal';
import { useDeleteSession, useRenewSession } from '@/lib/hooks/useSessions';
import { useSessionModalActive, useSessionModalsActions, useSessionUiActions } from '@/lib/stores';
import { hasAssignedSessionId } from '@/lib/sessions/sessionQuota';

const RENEW_HOURS = 12;

/**
 * Single mount point for session modals driven by the `sessionModals` store slice.
 */
export function SessionModalsHost() {
  const active = useSessionModalActive();
  const { closeSessionModal } = useSessionModalsActions();
  const { markOperating, clearOperating } = useSessionUiActions();
  const extendTriggeredForRef = useRef<string | null>(null);

  const { mutate: deleteSession, isPending: isDeleting } = useDeleteSession({
    onError: (_error, sessionId) => {
      clearOperating(sessionId);
    },
  });

  const { mutate: renewSession, isPending: isRenewing } = useRenewSession({
    onSuccess: (_data, { sessionId }) => {
      clearOperating(sessionId);
      closeSessionModal();
    },
    onError: (_error, { sessionId }) => {
      clearOperating(sessionId);
      closeSessionModal();
    },
  });

  const handleDeleteConfirm = useCallback(() => {
    if (!active || active.kind !== 'delete') return;
    if (!hasAssignedSessionId(active.sessionId)) return;
    markOperating(active.sessionId, 'delete');
    deleteSession(active.sessionId);
    closeSessionModal();
  }, [active, markOperating, deleteSession, closeSessionModal]);

  useEffect(() => {
    if (active?.kind !== 'extend') {
      extendTriggeredForRef.current = null;
      return;
    }

    if (!hasAssignedSessionId(active.sessionId)) return;

    if (extendTriggeredForRef.current === active.sessionId) return;
    extendTriggeredForRef.current = active.sessionId;

    markOperating(active.sessionId, 'renew');
    renewSession({ sessionId: active.sessionId, hours: RENEW_HOURS });
  }, [active, markOperating, renewSession]);

  const isDeleteOpen = active?.kind === 'delete';
  const isExtendOpen = active?.kind === 'extend';
  const isEventsOpen = active?.kind === 'events';
  const isLogsOpen = active?.kind === 'logs';

  return (
    <>
      <DeleteSessionModal
        open={isDeleteOpen}
        sessionName={active?.sessionName ?? ''}
        sessionId={active?.sessionId ?? ''}
        onClose={closeSessionModal}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
      <SessionRenewModal
        open={isExtendOpen}
        sessionName={active?.sessionName}
        sessionId={active?.sessionId}
        onClose={closeSessionModal}
        isRenewing={isRenewing}
      />
      <EventsModal
        open={isEventsOpen}
        sessionId={active?.sessionId ?? ''}
        sessionName={active?.sessionName ?? ''}
        onClose={closeSessionModal}
        logView="events"
      />
      <EventsModal
        open={isLogsOpen}
        sessionId={active?.sessionId ?? ''}
        sessionName={active?.sessionName ?? ''}
        onClose={closeSessionModal}
        forceRawView={true}
        defaultView="raw"
        logView="logs"
      />
    </>
  );
}
