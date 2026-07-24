// src/components/SessionCard/SessionCard.tsx
import { SessionCardProps } from '@/app/types/SessionCardProps';
import { SessionCardImpl } from '@/app/implementation/sessionCard';
import React from 'react';

/**
 * Memoized: the Active Sessions widget re-renders on every background refetch
 * (isFetching toggles), but TanStack Query's structural sharing keeps session
 * props referentially stable when the data hasn't changed, so unchanged cards
 * skip re-rendering.
 */
export const SessionCard = React.memo(
  React.forwardRef<HTMLDivElement, SessionCardProps>((props, ref) => {
    return <SessionCardImpl ref={ref} {...props} />;
  }),
);

SessionCard.displayName = 'SessionCard';
