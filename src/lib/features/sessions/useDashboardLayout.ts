'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Layout, ResponsiveLayouts } from 'react-grid-layout';
import {
  DASHBOARD_WIDGET_IDS,
  DEFAULT_DASHBOARD_LAYOUTS,
  cloneLayouts,
  filterLayoutsByVisibility,
  mergeLayoutsWithDefaults,
  type DashboardBreakpoint,
  type DashboardLayouts,
  type DashboardWidgetId,
} from './dashboardLayout';
import {
  clearDashboardLayouts,
  loadDashboardLayoutState,
  saveDashboardLayoutState,
} from './dashboardLayoutStorage';

const PERSIST_DEBOUNCE_MS = 250;

export function useDashboardLayout() {
  const [layouts, setLayouts] = useState<DashboardLayouts>(() =>
    cloneLayouts(DEFAULT_DASHBOARD_LAYOUTS),
  );
  const [hiddenIds, setHiddenIds] = useState<DashboardWidgetId[]>([]);
  const [hydrated, setHydrated] = useState(false);
  /** Bumped on reset so ResponsiveGridLayout remounts with defaults. */
  const [layoutEpoch, setLayoutEpoch] = useState(0);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Skip the next onLayoutChange persist after a programmatic reset. */
  const skipNextPersistRef = useRef(false);
  /** Latest layouts without forcing a React render on every drag pixel. */
  const layoutsRef = useRef(layouts);
  const hiddenIdsRef = useRef(hiddenIds);
  const interactingRef = useRef(false);

  useEffect(() => {
    const loaded = loadDashboardLayoutState();
    layoutsRef.current = loaded.layouts;
    hiddenIdsRef.current = loaded.hidden;
    setLayouts(loaded.layouts);
    setHiddenIds(loaded.hidden);
    setHydrated(true);
  }, []);

  useEffect(() => {
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
      }
    };
  }, []);

  const persist = useCallback((nextLayouts: DashboardLayouts, nextHidden: DashboardWidgetId[]) => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(() => {
      saveDashboardLayoutState({ layouts: nextLayouts, hidden: nextHidden });
    }, PERSIST_DEBOUNCE_MS);
  }, []);

  const handleLayoutChange = useCallback(
    (_current: Layout, allLayouts: ResponsiveLayouts<DashboardBreakpoint>) => {
      // RGL only sees visible widgets; merge then restore hidden positions.
      const merged = mergeLayoutsWithDefaults(allLayouts);
      for (const bp of Object.keys(merged) as DashboardBreakpoint[]) {
        const byId = new Map((merged[bp] ?? []).map((entry) => [entry.i, { ...entry }]));
        for (const id of hiddenIdsRef.current) {
          const previous = layoutsRef.current[bp]?.find((entry) => entry.i === id);
          if (previous) {
            byId.set(id, { ...previous });
          }
        }
        merged[bp] = DASHBOARD_WIDGET_IDS.map((id) => byId.get(id)!);
      }

      layoutsRef.current = merged;

      if (!interactingRef.current) {
        setLayouts(merged);
      }

      if (skipNextPersistRef.current) {
        skipNextPersistRef.current = false;
        return;
      }
      if (hydrated) {
        persist(merged, hiddenIdsRef.current);
      }
    },
    [hydrated, persist],
  );

  const handleInteractionStart = useCallback(() => {
    interactingRef.current = true;
  }, []);

  const handleInteractionStop = useCallback(() => {
    interactingRef.current = false;
    setLayouts(cloneLayouts(layoutsRef.current));
  }, []);

  const hideWidget = useCallback(
    (id: DashboardWidgetId) => {
      const visibleCount = DASHBOARD_WIDGET_IDS.filter(
        (widgetId) => !hiddenIdsRef.current.includes(widgetId),
      ).length;
      if (visibleCount <= 1 || hiddenIdsRef.current.includes(id)) return;

      const nextHidden = [...hiddenIdsRef.current, id];
      hiddenIdsRef.current = nextHidden;
      setHiddenIds(nextHidden);
      setLayoutEpoch((epoch) => epoch + 1);
      if (hydrated) {
        persist(layoutsRef.current, nextHidden);
      }
    },
    [hydrated, persist],
  );

  const showWidget = useCallback(
    (id: DashboardWidgetId) => {
      if (!hiddenIdsRef.current.includes(id)) return;
      const nextHidden = hiddenIdsRef.current.filter((widgetId) => widgetId !== id);
      hiddenIdsRef.current = nextHidden;
      setHiddenIds(nextHidden);
      setLayoutEpoch((epoch) => epoch + 1);
      if (hydrated) {
        persist(layoutsRef.current, nextHidden);
      }
    },
    [hydrated, persist],
  );

  const resetLayouts = useCallback(() => {
    const defaults = cloneLayouts(DEFAULT_DASHBOARD_LAYOUTS);
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    skipNextPersistRef.current = true;
    interactingRef.current = false;
    clearDashboardLayouts();
    layoutsRef.current = defaults;
    hiddenIdsRef.current = [];
    setLayouts(defaults);
    setHiddenIds([]);
    setLayoutEpoch((epoch) => epoch + 1);
  }, []);

  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);
  const visibleLayouts = useMemo(
    () => filterLayoutsByVisibility(layouts, hiddenSet),
    [layouts, hiddenSet],
  );
  const availableWidgetIds = hiddenIds;
  const canHideWidget = DASHBOARD_WIDGET_IDS.length - hiddenIds.length > 1;

  return {
    layouts: visibleLayouts,
    /** Full layouts including hidden widget positions (for debugging / future use). */
    allLayouts: layouts,
    hiddenIds,
    availableWidgetIds,
    canHideWidget,
    layoutEpoch,
    hydrated,
    onLayoutChange: handleLayoutChange,
    onInteractionStart: handleInteractionStart,
    onInteractionStop: handleInteractionStop,
    hideWidget,
    showWidget,
    resetLayouts,
  };
}
