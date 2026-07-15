'use client';

import { useMemo } from 'react';
import type { Session } from '@/lib/api/skaha';
import type { SessionRequestStatus } from '@/app/types/SessionRequestModalProps';
import { getSessionLaunchQuota, type SessionLaunchQuota } from '@/lib/sessions/sessionQuota';

export function useSessionLaunchQuota(
  sessions: Session[],
  launchRequestStatus?: SessionRequestStatus | null,
): SessionLaunchQuota {
  return useMemo(
    () => getSessionLaunchQuota(sessions, launchRequestStatus === 'requesting'),
    [sessions, launchRequestStatus],
  );
}
