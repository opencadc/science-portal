import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_LAYOUT_VERSION,
  DASHBOARD_WIDGET_IDS,
  DEFAULT_DASHBOARD_LAYOUTS,
  cloneLayouts,
  filterLayoutsByVisibility,
  mergeLayoutsWithDefaults,
  normalizeHiddenWidgetIds,
  parsePersistedDashboardLayout,
} from '../dashboardLayout';

describe('mergeLayoutsWithDefaults', () => {
  it('returns defaults when saved is null', () => {
    const merged = mergeLayoutsWithDefaults(null);
    expect(merged.lg?.map((item) => item.i).sort()).toEqual([...DASHBOARD_WIDGET_IDS].sort());
    expect(merged.lg).toHaveLength(4);
  });

  it('keeps valid saved positions and fills missing widgets', () => {
    const merged = mergeLayoutsWithDefaults({
      lg: [{ i: 'active-sessions', x: 2, y: 4, w: 10, h: 8 }],
    });

    const sessions = merged.lg?.find((item) => item.i === 'active-sessions');
    expect(sessions).toMatchObject({ x: 2, y: 4, w: 10, h: 8, minW: 8, minH: 4 });
    expect(merged.lg).toHaveLength(4);
    expect(merged.lg?.map((item) => item.i).sort()).toEqual([...DASHBOARD_WIDGET_IDS].sort());
  });

  it('drops unknown widget ids and enforces min sizes', () => {
    const merged = mergeLayoutsWithDefaults({
      lg: [
        { i: 'unknown-widget', x: 0, y: 0, w: 3, h: 3 },
        { i: 'launch-form', x: 0, y: 0, w: 1, h: 1 },
      ],
    });

    expect(merged.lg?.some((item) => item.i === 'unknown-widget')).toBe(false);
    const launch = merged.lg?.find((item) => item.i === 'launch-form');
    expect(launch?.w).toBeGreaterThanOrEqual(8);
    expect(launch?.h).toBeGreaterThanOrEqual(12);
  });
});

describe('parsePersistedDashboardLayout', () => {
  it('rejects wrong version or invalid shape', () => {
    expect(parsePersistedDashboardLayout(null)).toBeNull();
    expect(parsePersistedDashboardLayout({ version: 99, layouts: {} })).toBeNull();
    expect(parsePersistedDashboardLayout({ version: DASHBOARD_LAYOUT_VERSION })).toBeNull();
  });

  it('accepts a valid payload and merges layouts', () => {
    const parsed = parsePersistedDashboardLayout({
      version: DASHBOARD_LAYOUT_VERSION,
      layouts: {
        lg: [{ i: 'user-storage', x: 0, y: 0, w: 3, h: 4 }],
      },
      hidden: ['platform-load', 'unknown', 'platform-load'],
    });

    expect(parsed?.version).toBe(DASHBOARD_LAYOUT_VERSION);
    expect(parsed?.layouts.lg).toHaveLength(4);
    expect(parsed?.layouts.md).toHaveLength(4);
    expect(parsed?.hidden).toEqual(['platform-load']);
  });
});

describe('normalizeHiddenWidgetIds', () => {
  it('keeps at least one widget visible', () => {
    expect(normalizeHiddenWidgetIds([...DASHBOARD_WIDGET_IDS])).toHaveLength(
      DASHBOARD_WIDGET_IDS.length - 1,
    );
  });
});

describe('filterLayoutsByVisibility', () => {
  it('omits hidden widget ids from each breakpoint', () => {
    const filtered = filterLayoutsByVisibility(DEFAULT_DASHBOARD_LAYOUTS, ['launch-form']);
    expect(filtered.lg?.every((item) => item.i !== 'launch-form')).toBe(true);
    expect(filtered.lg).toHaveLength(3);
  });
});

describe('cloneLayouts', () => {
  it('deep-clones layout items', () => {
    const clone = cloneLayouts(DEFAULT_DASHBOARD_LAYOUTS);
    expect(clone).toEqual(DEFAULT_DASHBOARD_LAYOUTS);
    expect(clone.lg).not.toBe(DEFAULT_DASHBOARD_LAYOUTS.lg);
    expect(clone.lg?.[0]).not.toBe(DEFAULT_DASHBOARD_LAYOUTS.lg?.[0]);
  });
});
