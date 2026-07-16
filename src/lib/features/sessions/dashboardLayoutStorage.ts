import {
  DASHBOARD_LAYOUT_STORAGE_KEY,
  DASHBOARD_LAYOUT_VERSION,
  DEFAULT_DASHBOARD_LAYOUTS,
  cloneLayouts,
  parsePersistedDashboardLayout,
  type DashboardLayouts,
  type DashboardWidgetId,
  type PersistedDashboardLayout,
} from './dashboardLayout';

export interface StoredDashboardLayout {
  layouts: DashboardLayouts;
  hidden: DashboardWidgetId[];
}

function readStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) {
      window.localStorage.removeItem(DASHBOARD_LAYOUT_STORAGE_KEY);
    } else {
      window.localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, value);
    }
  } catch (error) {
    console.warn('Failed to update dashboard layout storage:', error);
  }
}

export function loadDashboardLayoutState(): StoredDashboardLayout {
  const defaults: StoredDashboardLayout = {
    layouts: cloneLayouts(DEFAULT_DASHBOARD_LAYOUTS),
    hidden: [],
  };

  const raw = readStorage();
  if (!raw) return defaults;

  try {
    const parsed = parsePersistedDashboardLayout(JSON.parse(raw) as unknown);
    if (!parsed) return defaults;
    return { layouts: parsed.layouts, hidden: parsed.hidden };
  } catch {
    return defaults;
  }
}

/** @deprecated Prefer loadDashboardLayoutState — kept for call-site clarity. */
export function loadDashboardLayouts(): DashboardLayouts {
  return loadDashboardLayoutState().layouts;
}

export function saveDashboardLayoutState(state: StoredDashboardLayout): void {
  const payload: PersistedDashboardLayout = {
    version: DASHBOARD_LAYOUT_VERSION,
    layouts: state.layouts,
    hidden: state.hidden,
  };
  writeStorage(JSON.stringify(payload));
}

export function saveDashboardLayouts(
  layouts: DashboardLayouts,
  hidden: DashboardWidgetId[] = [],
): void {
  saveDashboardLayoutState({ layouts, hidden });
}

export function clearDashboardLayouts(): void {
  writeStorage(null);
}
