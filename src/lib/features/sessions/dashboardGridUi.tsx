'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@mui/material';
import {
  DASHBOARD_GRID_ITEM_CLASS,
  DASHBOARD_GRID_SKELETON_HEIGHT,
  type DashboardWidgetId,
} from './dashboardLayout';
import { DashboardWidgetIdProvider } from './DashboardLayoutEditContext';

/** Shared placeholder while layout storage / container width settle. */
export function DashboardGridSkeleton() {
  return (
    <Skeleton
      variant="rounded"
      height={DASHBOARD_GRID_SKELETON_HEIGHT}
      sx={{ width: '100%' }}
    />
  );
}

/**
 * RGL grid child — `key` must equal `layout[].i` and be on this element
 * (not a Fragment parent). Provides widget id to DashboardWidget chrome.
 */
export function createDashboardGridItem(id: DashboardWidgetId, child: ReactNode) {
  return (
    <div key={id} className={DASHBOARD_GRID_ITEM_CLASS}>
      <DashboardWidgetIdProvider id={id}>{child}</DashboardWidgetIdProvider>
    </div>
  );
}
