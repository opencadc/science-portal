'use client';

import React, { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  HelpOutline as HelpOutlineIcon,
  DragIndicator as DragIndicatorIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { DashboardWidgetProps, DashboardWidgetHelp } from '@/app/types/DashboardWidgetProps';
import {
  useDashboardLayoutEdit,
  useDashboardWidgetId,
} from '@/lib/features/sessions/DashboardLayoutEditContext';
import {
  DASHBOARD_DRAG_HANDLE_CLASS,
  DASHBOARD_WIDGET_LABELS,
} from '@/lib/features/sessions/dashboardLayout';

function HelpAffordance({ help, widgetTitle }: { help: DashboardWidgetHelp; widgetTitle: React.ReactNode }) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  if (help.url) {
    return (
      <Link
        href={help.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="help"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: theme.spacing(2.5) }} />
      </Link>
    );
  }

  if (!help.content) return null;

  return (
    <>
      <Tooltip title="More information">
        <IconButton size="small" onClick={handleOpen} sx={{ p: 0.5 }} aria-label="help">
          <HelpOutlineIcon sx={{ fontSize: theme.spacing(2.5) }} />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            {help.title ?? widgetTitle}
          </Typography>
          <Typography variant="body2">{help.content}</Typography>
        </Box>
      </Popover>
    </>
  );
}

/**
 * Universal shell for portal dashboard widgets. Presentational only — data
 * hooks, store selectors, and modals live in the composing widget and are
 * passed through as `children` / callbacks.
 */
export function DashboardWidgetImpl({
  title,
  isLoading = false,
  isFetching = false,
  error,
  alert,
  onRefresh,
  refreshAriaLabel = 'refresh',
  refreshTooltip,
  help,
  showStatusBar = true,
  statusValue = 100,
  footer,
  fillHeight = false,
  showDragHandle,
  dragHandleAriaLabel,
  maxWidth,
  sx,
  className,
  ref,
  children,
}: DashboardWidgetProps) {
  const theme = useTheme();
  const { isEditing, canHideWidget, hideWidget } = useDashboardLayoutEdit();
  const widgetId = useDashboardWidgetId();
  const dragHandleVisible = showDragHandle ?? isEditing;
  const showHideControl = isEditing && widgetId !== null;
  const resolvedDragHandleLabel =
    dragHandleAriaLabel ??
    (typeof title === 'string'
      ? `Drag to rearrange ${title}`
      : 'Drag to rearrange widget');
  const hideLabel =
    widgetId !== null
      ? `Hide ${DASHBOARD_WIDGET_LABELS[widgetId]}`
      : 'Hide widget';

  // isLoading = initial load (skeleton children); isFetching = background
  // refetch (content stays). Both animate the status bar and block refresh.
  const isBusy = isLoading || isFetching;

  const refreshButton = onRefresh && (
    <IconButton
      aria-label={refreshAriaLabel}
      onClick={onRefresh}
      disabled={isBusy}
      size="small"
      sx={{
        [theme.breakpoints.down('sm')]: {
          alignSelf: 'flex-end',
          mt: -1,
        },
      }}
    >
      <RefreshIcon />
    </IconButton>
  );

  return (
    <Paper
      ref={ref}
      className={className}
      elevation={0}
      variant="outlined"
      sx={[
        {
          position: 'relative',
          padding: theme.spacing(2),
          overflow: 'hidden',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          ...(maxWidth !== undefined && { maxWidth }),
          ...(fillHeight && { height: '100%', flex: 1, minHeight: 0 }),
          [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(1.5),
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {alert}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing(1),
          flexShrink: 0,
          [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
          {dragHandleVisible && (
            <Box
              component="span"
              className={DASHBOARD_DRAG_HANDLE_CLASS}
              aria-label={resolvedDragHandleLabel}
              title={resolvedDragHandleLabel}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'text.secondary',
                borderRadius: 1,
                p: 0.25,
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
              }}
            >
              <DragIndicatorIcon fontSize="small" aria-hidden />
            </Box>
          )}
          {showHideControl && (
            <Tooltip
              title={
                canHideWidget ? hideLabel : 'At least one widget must stay visible'
              }
            >
              <Box component="span" sx={{ display: 'inline-flex' }}>
                <IconButton
                  size="small"
                  aria-label={hideLabel}
                  disabled={!canHideWidget}
                  onClick={() => {
                    if (widgetId) hideWidget(widgetId);
                  }}
                  sx={{ p: 0.25, color: 'text.secondary' }}
                >
                  <VisibilityOffIcon fontSize="small" />
                </IconButton>
              </Box>
            </Tooltip>
          )}
          <Typography
            variant="h6"
            component="h2"
            sx={{
              [theme.breakpoints.down('sm')]: {
                fontSize: theme.typography.body1.fontSize,
                fontWeight: theme.typography.fontWeightBold,
              },
            }}
          >
            {title}
          </Typography>
          {help && <HelpAffordance help={help} widgetTitle={title} />}
        </Box>
        {refreshButton &&
          (refreshTooltip ? (
            // span keeps the tooltip working while the button is disabled
            <Tooltip title={refreshTooltip}>
              <Box component="span" sx={{ display: 'inline-flex' }}>
                {refreshButton}
              </Box>
            </Tooltip>
          ) : (
            refreshButton
          ))}
      </Box>

      {/* Status bar */}
      {showStatusBar && (
        <LinearProgress
          color={isBusy ? 'primary' : 'success'}
          variant={isBusy ? 'indeterminate' : 'determinate'}
          value={isBusy ? undefined : statusValue}
          sx={{
            width: '100%',
            height: 4,
            marginBottom: theme.spacing(2),
            borderRadius: 2,
            flexShrink: 0,
            '& .MuiLinearProgress-bar': { borderRadius: 2 },
          }}
        />
      )}

      {/* Content */}
      <Box
        sx={{
          flex: fillHeight ? 1 : undefined,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: fillHeight ? 'auto' : undefined,
        }}
      >
        {children}
      </Box>

      {footer}
    </Paper>
  );
}
