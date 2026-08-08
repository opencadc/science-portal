import type { Layout, LayoutItem, ResponsiveLayouts } from 'react-grid-layout';

/** Stable ids for dashboard grid items (must match React keys). */
export const DASHBOARD_WIDGET_IDS = [
  'active-sessions',
  'user-storage',
  'launch-form',
  'platform-load',
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

/** Catalog labels for the customize tray / a11y (not the live widget title). */
export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  'active-sessions': 'Active Sessions',
  'user-storage': 'User Storage',
  'launch-form': 'Launch Session',
  'platform-load': 'Platform Load',
};

export type DashboardBreakpoint = 'lg' | 'md' | 'sm' | 'xs';

/** MUI breakpoint at/above which Customize / drag / resize are enabled. */
export const DASHBOARD_CUSTOMIZE_MIN_BREAKPOINT = 'md' as const;

export const DASHBOARD_BREAKPOINTS: Record<DashboardBreakpoint, number> = {
  lg: 1200,
  md: 900,
  sm: 600,
  xs: 0,
};

/**
 * Column counts — 2× denser than a classic 12-col dashboard so width
 * resize steps are ~half as large (~4% of container per unit on lg).
 */
export const DASHBOARD_COLS: Record<DashboardBreakpoint, number> = {
  lg: 24,
  md: 20,
  sm: 12,
  xs: 8,
};

/** CSS class for the drag handle on DashboardWidget (RGL `dragConfig.handle`). */
export const DASHBOARD_DRAG_HANDLE_CLASS = 'dashboard-widget-drag-handle';

/** Must match selectors in `dashboardGrid.css`. */
export const DASHBOARD_GRID_ITEM_CLASS = 'dashboard-grid-item';
export const DASHBOARD_GRID_ROOT_CLASS = 'dashboard-grid-root';

/** Bumped when factory heights/density/schema change so stale layouts are discarded. */
export const DASHBOARD_LAYOUT_VERSION = 10;
export const DASHBOARD_LAYOUT_STORAGE_KEY = `canfar-dashboard-layout-v${DASHBOARD_LAYOUT_VERSION}`;

/** Row height in px — smaller = finer vertical resize steps. */
export const DASHBOARD_ROW_HEIGHT = 40;
export const DASHBOARD_MARGIN: readonly [number, number] = [12, 12];
export const DASHBOARD_GRID_SKELETON_HEIGHT = 480;

export type DashboardLayouts = ResponsiveLayouts<DashboardBreakpoint>;

export interface PersistedDashboardLayout {
  version: number;
  layouts: DashboardLayouts;
  /** Widget ids not rendered on the grid (positions kept in `layouts`). */
  hidden: DashboardWidgetId[];
}

const baseConstraints: Record<DashboardWidgetId, Pick<LayoutItem, 'minW' | 'minH'>> = {
  'active-sessions': { minW: 8, minH: 4 },
  'user-storage': { minW: 4, minH: 4 },
  /** Fits Advanced tab without a large empty footer region. */
  'launch-form': { minW: 8, minH: 12 },
  /** Tall enough for metrics + disabled overlay without an inner scrollbar. */
  'platform-load': { minW: 6, minH: 7 },
};

function item(
  id: DashboardWidgetId,
  x: number,
  y: number,
  w: number,
  h: number,
): LayoutItem {
  return { i: id, x, y, w, h, ...baseConstraints[id] };
}

/** Single-column stack used for sm/xs — only `cols` differs. */
function stackedLayout(cols: number): LayoutItem[] {
  return [
    item('active-sessions', 0, 0, cols, 7),
    item('user-storage', 0, 7, cols, 5),
    item('launch-form', 0, 12, cols, 14),
    item('platform-load', 0, 26, cols, 9),
  ];
}

/**
 * Initial (factory) layouts — original portal proportions:
 * top row ~80/20 (sessions / storage), bottom ~60/40 (launch / platform).
 * Heights kept compact; users can grow widgets in Customize mode.
 */
export const DEFAULT_DASHBOARD_LAYOUTS: DashboardLayouts = {
  lg: [
    // 80% / 20% of 24 cols — ~320px tall
    item('active-sessions', 0, 0, 19, 8),
    item('user-storage', 19, 0, 5, 8),
    // Launch ~560px; Platform 9 rows
    item('launch-form', 0, 8, 14, 14),
    item('platform-load', 14, 8, 10, 9),
  ],
  md: [
    item('active-sessions', 0, 0, 14, 7),
    item('user-storage', 14, 0, 6, 7),
    item('launch-form', 0, 7, 12, 14),
    item('platform-load', 12, 7, 8, 9),
  ],
  sm: stackedLayout(DASHBOARD_COLS.sm),
  xs: stackedLayout(DASHBOARD_COLS.xs),
};

export function isDashboardWidgetId(value: string): value is DashboardWidgetId {
  return (DASHBOARD_WIDGET_IDS as readonly string[]).includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isLayoutItemLike(value: unknown): value is LayoutItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.i === 'string' &&
    isFiniteNumber(item.x) &&
    isFiniteNumber(item.y) &&
    isFiniteNumber(item.w) &&
    isFiniteNumber(item.h)
  );
}

/**
 * Merge a possibly partial/invalid saved layout with defaults.
 * Unknown widget ids are dropped; missing widgets are filled from defaults.
 */
export function mergeLayoutsWithDefaults(
  saved: DashboardLayouts | null | undefined,
  defaults: DashboardLayouts = DEFAULT_DASHBOARD_LAYOUTS,
): DashboardLayouts {
  const breakpoints = Object.keys(defaults) as DashboardBreakpoint[];
  const result: DashboardLayouts = {};

  for (const bp of breakpoints) {
    const defaultLayout = defaults[bp] ?? [];
    const defaultById = new Map(defaultLayout.map((entry) => [entry.i, entry]));
    const savedLayout = saved?.[bp];
    const merged: LayoutItem[] = [];
    const seen = new Set<string>();

    if (Array.isArray(savedLayout)) {
      for (const raw of savedLayout) {
        if (!isLayoutItemLike(raw) || !isDashboardWidgetId(raw.i) || seen.has(raw.i)) {
          continue;
        }
        const fallback = defaultById.get(raw.i);
        if (!fallback) continue;
        const constraints = baseConstraints[raw.i];
        merged.push({
          ...fallback,
          ...constraints,
          x: Math.max(0, Math.floor(raw.x)),
          y: Math.max(0, Math.floor(raw.y)),
          w: Math.max(constraints.minW ?? 1, Math.floor(raw.w)),
          h: Math.max(constraints.minH ?? 1, Math.floor(raw.h)),
          i: raw.i,
        });
        seen.add(raw.i);
      }
    }

    for (const id of DASHBOARD_WIDGET_IDS) {
      if (!seen.has(id)) {
        const fallback = defaultById.get(id);
        if (fallback) merged.push({ ...fallback });
      }
    }

    result[bp] = merged;
  }

  return result;
}

export function normalizeHiddenWidgetIds(raw: unknown): DashboardWidgetId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<DashboardWidgetId>();
  for (const value of raw) {
    if (typeof value === 'string' && isDashboardWidgetId(value)) {
      seen.add(value);
    }
  }
  // Never allow hiding every widget — keep at least one visible.
  if (seen.size >= DASHBOARD_WIDGET_IDS.length) {
    seen.delete(DASHBOARD_WIDGET_IDS[0]);
  }
  return DASHBOARD_WIDGET_IDS.filter((id) => seen.has(id));
}

/** Layouts passed to RGL — omit hidden widgets so slots collapse. */
export function filterLayoutsByVisibility(
  layouts: DashboardLayouts,
  hidden: ReadonlySet<DashboardWidgetId> | readonly DashboardWidgetId[],
): DashboardLayouts {
  const hiddenSet = hidden instanceof Set ? hidden : new Set(hidden);
  const result: DashboardLayouts = {};
  for (const [bp, layout] of Object.entries(layouts) as [
    DashboardBreakpoint,
    Layout | undefined,
  ][]) {
    if (!layout) continue;
    result[bp] = layout.filter(
      (entry) => isDashboardWidgetId(entry.i) && !hiddenSet.has(entry.i),
    );
  }
  return result;
}

/** Validate and normalize a persisted blob; returns null if unusable. */
export function parsePersistedDashboardLayout(raw: unknown): PersistedDashboardLayout | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;
  if (candidate.version !== DASHBOARD_LAYOUT_VERSION) return null;
  if (!candidate.layouts || typeof candidate.layouts !== 'object') return null;

  const layouts = mergeLayoutsWithDefaults(candidate.layouts as DashboardLayouts);
  const hidden = normalizeHiddenWidgetIds(candidate.hidden);
  return { version: DASHBOARD_LAYOUT_VERSION, layouts, hidden };
}

export function cloneLayouts(layouts: DashboardLayouts): DashboardLayouts {
  const clone: DashboardLayouts = {};
  for (const [bp, layout] of Object.entries(layouts) as [DashboardBreakpoint, Layout | undefined][]) {
    if (layout) {
      clone[bp] = layout.map((entry) => ({ ...entry }));
    }
  }
  return clone;
}
