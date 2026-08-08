'use client';

import { Box, Button, Chip, Typography } from '@mui/material';
import {
  DashboardCustomize as CustomizeIcon,
  RestartAlt as ResetIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  DASHBOARD_WIDGET_LABELS,
  type DashboardWidgetId,
} from './dashboardLayout';

export interface DashboardLayoutToolbarProps {
  isEditing: boolean;
  onToggleEditing: () => void;
  onReset: () => void;
  /** Hidden widgets shown as a restore tray while editing. */
  availableWidgetIds?: DashboardWidgetId[];
  onShowWidget?: (id: DashboardWidgetId) => void;
  /** When false, hide the toolbar (e.g. below md where drag is disabled). */
  visible?: boolean;
}

export function DashboardLayoutToolbar({
  isEditing,
  onToggleEditing,
  onReset,
  availableWidgetIds = [],
  onShowWidget,
  visible = true,
}: DashboardLayoutToolbarProps) {
  if (!visible) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {isEditing
            ? 'Drag to rearrange, resize from the edges, or hide a widget with the eye icon.'
            : 'Customize the dashboard layout to rearrange, resize, and show or hide widgets.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<ResetIcon />}
            onClick={onReset}
            aria-label="Reset to initial layout"
          >
            Reset to initial layout
          </Button>
          <Button
            size="small"
            variant={isEditing ? 'contained' : 'outlined'}
            startIcon={<CustomizeIcon />}
            onClick={onToggleEditing}
            aria-pressed={isEditing}
          >
            {isEditing ? 'Done' : 'Customize layout'}
          </Button>
        </Box>
      </Box>

      {isEditing && (
        <Box
          sx={{
            mt: 1.5,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            Available widgets
          </Typography>
          {availableWidgetIds.length === 0 ? (
            <Typography variant="caption" color="text.disabled">
              All widgets are on the dashboard
            </Typography>
          ) : (
            availableWidgetIds.map((id) => (
              <Chip
                key={id}
                size="small"
                icon={<VisibilityIcon />}
                label={DASHBOARD_WIDGET_LABELS[id]}
                onClick={() => onShowWidget?.(id)}
                clickable
                variant="outlined"
                color="primary"
                aria-label={`Show ${DASHBOARD_WIDGET_LABELS[id]}`}
              />
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
