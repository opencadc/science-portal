'use client';

import { useMemo } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveGridLayout,
  useContainerWidth,
  type Layout,
  type ResponsiveLayouts,
} from 'react-grid-layout';
import {
  DASHBOARD_BREAKPOINTS,
  DASHBOARD_COLS,
  DASHBOARD_CUSTOMIZE_MIN_BREAKPOINT,
  DASHBOARD_DRAG_HANDLE_CLASS,
  DASHBOARD_GRID_ROOT_CLASS,
  DASHBOARD_MARGIN,
  DASHBOARD_ROW_HEIGHT,
  type DashboardBreakpoint,
  type DashboardLayouts,
} from './dashboardLayout';
import { DashboardGridSkeleton } from './dashboardGridUi';
import 'react-grid-layout/css/styles.css';
import './dashboardGrid.css';

const DRAG_CANCEL =
  'button,a,input,textarea,select,.MuiIconButton-root';
const RESIZE_HANDLES = ['e', 's', 'se'] as const;

export interface DashboardGridProps {
  layouts: DashboardLayouts;
  /** Change this (e.g. on reset) to force the grid to remount with new layouts. */
  layoutEpoch?: number;
  isEditing: boolean;
  onLayoutChange: (
    current: Layout,
    allLayouts: ResponsiveLayouts<DashboardBreakpoint>,
  ) => void;
  onInteractionStart?: () => void;
  onInteractionStop?: () => void;
  children: React.ReactNode;
}

export function DashboardGrid({
  layouts,
  layoutEpoch = 0,
  isEditing,
  onLayoutChange,
  onInteractionStart,
  onInteractionStop,
  children,
}: DashboardGridProps) {
  const theme = useTheme();
  const canInteract = useMediaQuery(
    theme.breakpoints.up(DASHBOARD_CUSTOMIZE_MIN_BREAKPOINT),
  );
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
    initialWidth: 1280,
  });

  const interactionEnabled = isEditing && canInteract;

  const cssVars = useMemo(
    () =>
      ({
        '--dashboard-grid-placeholder':
          theme.palette.mode === 'dark'
            ? 'rgba(144, 202, 249, 0.45)'
            : 'rgba(25, 118, 210, 0.35)',
        '--dashboard-grid-outline': theme.palette.divider,
        '--dashboard-grid-resize':
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.55)'
            : 'rgba(0, 0, 0, 0.45)',
      }) as React.CSSProperties,
    [theme.palette.mode, theme.palette.divider],
  );

  const dragConfig = useMemo(
    () => ({
      enabled: interactionEnabled,
      handle: `.${DASHBOARD_DRAG_HANDLE_CLASS}`,
      cancel: DRAG_CANCEL,
      threshold: 3,
    }),
    [interactionEnabled],
  );

  const resizeConfig = useMemo(
    () => ({
      enabled: interactionEnabled,
      handles: RESIZE_HANDLES,
    }),
    [interactionEnabled],
  );

  return (
    <Box
      ref={containerRef}
      className={[DASHBOARD_GRID_ROOT_CLASS, interactionEnabled ? 'dashboard-grid--editing' : '']
        .filter(Boolean)
        .join(' ')}
      style={cssVars}
      sx={{ width: '100%', minHeight: mounted ? undefined : 480 }}
    >
      {!mounted ? (
        <DashboardGridSkeleton />
      ) : (
        <ResponsiveGridLayout
          key={layoutEpoch}
          width={width}
          layouts={layouts}
          breakpoints={DASHBOARD_BREAKPOINTS}
          cols={DASHBOARD_COLS}
          rowHeight={DASHBOARD_ROW_HEIGHT}
          margin={DASHBOARD_MARGIN}
          containerPadding={[0, 0]}
          dragConfig={dragConfig}
          resizeConfig={resizeConfig}
          onLayoutChange={onLayoutChange}
          onDragStart={onInteractionStart}
          onDragStop={onInteractionStop}
          onResizeStart={onInteractionStart}
          onResizeStop={onInteractionStop}
          autoSize
        >
          {children}
        </ResponsiveGridLayout>
      )}
    </Box>
  );
}
