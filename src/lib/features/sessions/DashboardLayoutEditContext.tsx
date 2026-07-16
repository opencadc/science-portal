'use client';

import { createContext, useContext, useMemo } from 'react';
import type { DashboardWidgetId } from './dashboardLayout';

interface DashboardLayoutEditContextValue {
  isEditing: boolean;
  canHideWidget: boolean;
  hideWidget: (id: DashboardWidgetId) => void;
}

const DashboardLayoutEditContext = createContext<DashboardLayoutEditContextValue>({
  isEditing: false,
  canHideWidget: false,
  hideWidget: () => undefined,
});

const DashboardWidgetIdContext = createContext<DashboardWidgetId | null>(null);

export function DashboardLayoutEditProvider({
  isEditing,
  canHideWidget,
  hideWidget,
  children,
}: {
  isEditing: boolean;
  canHideWidget: boolean;
  hideWidget: (id: DashboardWidgetId) => void;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ isEditing, canHideWidget, hideWidget }),
    [isEditing, canHideWidget, hideWidget],
  );

  return (
    <DashboardLayoutEditContext.Provider value={value}>
      {children}
    </DashboardLayoutEditContext.Provider>
  );
}

export function DashboardWidgetIdProvider({
  id,
  children,
}: {
  id: DashboardWidgetId;
  children: React.ReactNode;
}) {
  return (
    <DashboardWidgetIdContext.Provider value={id}>{children}</DashboardWidgetIdContext.Provider>
  );
}

export function useDashboardLayoutEdit(): DashboardLayoutEditContextValue {
  return useContext(DashboardLayoutEditContext);
}

export function useDashboardWidgetId(): DashboardWidgetId | null {
  return useContext(DashboardWidgetIdContext);
}
