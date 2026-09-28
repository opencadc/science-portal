import type { Theme } from '@mui/material/styles';

/** Shared header-meter geometry (sessions quota + home storage). */
export const USAGE_RING_SIZE = 32;
export const USAGE_RING_STROKE = 5;
export const USAGE_RING_ICON_SIZE = 14;

export const USAGE_WARN_PCT = 70;
export const USAGE_CRITICAL_PCT = 90;

export function clampUsagePct(usage: number): number {
  return Math.min(100, Math.max(0, usage));
}

export function usageFillColor(usage: number, theme: Theme): string {
  if (usage > USAGE_CRITICAL_PCT) return theme.palette.error.main;
  if (usage >= USAGE_WARN_PCT) return theme.palette.warning.main;
  return theme.palette.success.light;
}

export function usageTrackColor(theme: Theme): string {
  return theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300];
}
