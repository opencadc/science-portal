'use client';

import React, { useCallback, useState } from 'react';
import {
  Typography,
  Box,
  Tooltip,
  ButtonBase,
  Popover,
  IconButton,
  Skeleton,
} from '@mui/material';
import {
  MonitorOutlined as SessionsIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { UsageRing } from '@/app/components/UsageRing/UsageRing';
import { tokens } from '@/app/design-system/tokens';
import {
  USAGE_RING_SIZE,
  clampUsagePct,
  usageFillColor,
  usageTrackColor,
} from '@/app/design-system/usageMeter';
import { MAX_INTERACTIVE_SESSIONS } from '@/lib/sessions/sessionQuota';
import type { SessionQuotaWidgetProps } from '@/app/types/SessionQuotaWidgetProps';

const TITLE = 'Interactive Sessions Limit';

function SessionQuotaPanel({
  count,
  max,
  isLoading,
  isFetching,
  errorMessage,
  onClose,
  onRefresh,
}: {
  count: number;
  max: number;
  isLoading: boolean;
  isFetching: boolean;
  errorMessage?: string;
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const theme = useTheme();
  const usage = max > 0 ? clampUsagePct((count / max) * 100) : 0;
  const usedColor = usageFillColor(usage, theme);
  const trackColor = usageTrackColor(theme);
  const showError = Boolean(errorMessage) && count === 0 && !isLoading;

  return (
    <Box sx={{ width: '100%', maxWidth: 320, p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1.25,
        }}
      >
        {isLoading ? (
          <Skeleton width="75%" height={20} sx={{ flex: 1 }} />
        ) : (
          <Typography variant="body2" sx={{ minWidth: 0, flex: 1, fontWeight: 600 }}>
            {TITLE}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {onRefresh && (
            <Tooltip title="Refresh sessions">
              <span>
                <IconButton
                  size="small"
                  onClick={onRefresh}
                  disabled={isLoading || isFetching}
                  aria-label="refresh sessions"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <IconButton size="small" onClick={onClose} aria-label="close session details">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {showError ? (
        <Typography variant="body2" color="error">
          {errorMessage}
        </Typography>
      ) : (
        <>
          <Box sx={{ mb: 1.25 }}>
            {isLoading ? (
              <Skeleton width={72} height={24} />
            ) : (
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, fontFamily: tokens.typography.fontFamily.mono }}
              >
                {count} / {max}
              </Typography>
            )}
          </Box>

          <Box
            aria-hidden
            sx={{
              height: 8,
              borderRadius: tokens.borderRadius.fullCSS,
              overflow: 'hidden',
              display: 'flex',
              backgroundColor: trackColor,
              mb: 1.25,
            }}
          >
            {isLoading ? (
              <Skeleton variant="rectangular" width="100%" height={8} />
            ) : (
              <Box
                sx={{
                  width: `${usage}%`,
                  minWidth: usage > 0 ? 4 : 0,
                  backgroundColor: usedColor,
                  borderRadius: tokens.borderRadius.fullCSS,
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {[
                { key: 'used', label: 'Used', color: usedColor },
                { key: 'available', label: 'Available', color: trackColor },
              ].map((item) => (
                <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '2px',
                      backgroundColor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
            {!isLoading && count >= max && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
                At the limit
              </Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

export function SessionQuotaWidgetImpl({
  count,
  max = MAX_INTERACTIVE_SESSIONS,
  isLoading = false,
  isFetching = false,
  errorMessage,
  onRefresh,
}: SessionQuotaWidgetProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const usage = max > 0 ? clampUsagePct((count / max) * 100) : 0;
  const unavailable = Boolean(errorMessage) && count === 0 && !isLoading;
  const usedColor = unavailable ? theme.palette.error.main : usageFillColor(usage, theme);
  const trackColor = usageTrackColor(theme);
  const ariaLabel = unavailable
    ? `${TITLE} unavailable. ${errorMessage}`
    : isLoading
      ? `${TITLE}, loading`
      : `${TITLE}, ${count} of ${max}. Show details.`;

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleToggle = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl((current) => (current ? null : event.currentTarget));
  }, []);

  return (
    <Box sx={{ display: 'inline-flex' }}>
      <Tooltip title={open ? '' : `${TITLE} — click for details`} disableHoverListener={open}>
        <ButtonBase
          onClick={handleToggle}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: USAGE_RING_SIZE,
            height: USAGE_RING_SIZE,
            minHeight: USAGE_RING_SIZE,
            p: 0,
            borderRadius: '50%',
            color: 'text.primary',
            transition: `transform ${tokens.transitions.press.duration} ${tokens.transitions.easing.easeOut}, background-color ${tokens.transitions.duration.fastCSS} ${tokens.transitions.easing.emphasized}`,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            '&:active': {
              transform: `scale(${tokens.transitions.press.scale})`,
            },
            '@media (prefers-reduced-motion: reduce)': {
              '&:active': { transform: 'none' },
            },
          }}
        >
          <UsageRing
            usage={unavailable ? 0 : usage}
            isLoading={isLoading}
            usedColor={usedColor}
            trackColor={trackColor}
            icon={<SessionsIcon />}
          />
        </ButtonBase>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { overflow: 'visible', width: 320 },
          },
        }}
      >
        <SessionQuotaPanel
          count={unavailable ? 0 : count}
          max={max}
          isLoading={isLoading}
          isFetching={isFetching}
          errorMessage={errorMessage}
          onClose={handleClose}
          onRefresh={onRefresh}
        />
      </Popover>
    </Box>
  );
}
