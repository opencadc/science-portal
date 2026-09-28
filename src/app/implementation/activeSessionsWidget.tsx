'use client';

import React, { useCallback, useState } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
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
import { useTheme, type Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ActiveSessionsWidgetProps } from '@/app/types/ActiveSessionsWidgetProps';
import { DashboardWidget } from '@/app/components/DashboardWidget/DashboardWidget';
import { SessionCard } from '@/app/components/SessionCard/SessionCard';
import { tokens } from '@/app/design-system/tokens';
import { MAX_INTERACTIVE_SESSIONS } from '@/lib/sessions/sessionQuota';

/** Same geometry and color bands as the home-storage ring. */
const QUOTA_RING_SIZE = 32;
const QUOTA_RING_STROKE = 5;
const QUOTA_ICON_SIZE = 14;
const USAGE_WARN_PCT = 70;
const USAGE_CRITICAL_PCT = 90;

function quotaFillColor(usage: number, theme: Theme) {
  if (usage > USAGE_CRITICAL_PCT) return theme.palette.error.main;
  if (usage >= USAGE_WARN_PCT) return theme.palette.warning.main;
  return theme.palette.success.light;
}

const SESSIONS_TITLE = 'Interactive Sessions Limit';

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
  const usage = max > 0 ? Math.min(100, Math.max(0, (count / max) * 100)) : 0;
  const usedColor = quotaFillColor(usage, theme);
  const trackColor =
    theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300];
  const usedPct = usage;
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
            {SESSIONS_TITLE}
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 1,
              mb: 1.25,
            }}
          >
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
                  width: `${usedPct}%`,
                  minWidth: usedPct > 0 ? 4 : 0,
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

function SessionQuotaIndicator({
  count,
  max,
  isLoading,
  isFetching = false,
  errorMessage,
  onRefresh,
}: {
  count: number;
  max: number;
  isLoading: boolean;
  isFetching?: boolean;
  errorMessage?: string;
  onRefresh?: () => void;
}) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const usage = max > 0 ? Math.min(100, Math.max(0, (count / max) * 100)) : 0;
  const unavailable = Boolean(errorMessage) && count === 0 && !isLoading;
  const usedColor = unavailable ? theme.palette.error.main : quotaFillColor(usage, theme);
  const trackColor =
    theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300];
  const radius = (QUOTA_RING_SIZE - QUOTA_RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (usage / 100) * circumference;
  const center = QUOTA_RING_SIZE / 2;
  const empty = count <= 0 && !isLoading && !unavailable;
  const ariaLabel = unavailable
    ? `${SESSIONS_TITLE} unavailable. ${errorMessage}`
    : isLoading
      ? `${SESSIONS_TITLE}, loading`
      : `${SESSIONS_TITLE}, ${count} of ${max}. Show details.`;

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleToggle = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl((current) => (current ? null : event.currentTarget));
  }, []);

  return (
    <Box sx={{ display: 'inline-flex' }}>
      <Tooltip title={open ? '' : `${SESSIONS_TITLE} — click for details`} disableHoverListener={open}>
        <ButtonBase
          onClick={handleToggle}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: QUOTA_RING_SIZE,
            height: QUOTA_RING_SIZE,
            minHeight: QUOTA_RING_SIZE,
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
          <Box
            sx={{ position: 'relative', width: QUOTA_RING_SIZE, height: QUOTA_RING_SIZE, flexShrink: 0 }}
          >
            <Box
              component="svg"
              width={QUOTA_RING_SIZE}
              height={QUOTA_RING_SIZE}
              viewBox={`0 0 ${QUOTA_RING_SIZE} ${QUOTA_RING_SIZE}`}
              aria-hidden
              sx={{
                display: 'block',
                transform: 'rotate(-90deg)',
                ...(isLoading && {
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    to: { transform: 'rotate(270deg)' },
                  },
                  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }),
              }}
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={trackColor}
                strokeWidth={QUOTA_RING_STROKE}
              />
              {(isLoading || !empty) && (
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={usedColor}
                  strokeWidth={QUOTA_RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={
                    isLoading ? `${circumference * 0.25} ${circumference}` : `${dash} ${circumference}`
                  }
                />
              )}
            </Box>
            <SessionsIcon
              aria-hidden
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: QUOTA_ICON_SIZE,
                height: QUOTA_ICON_SIZE,
                marginTop: `${-QUOTA_ICON_SIZE / 2}px`,
                marginLeft: `${-QUOTA_ICON_SIZE / 2}px`,
                color: usedColor,
                pointerEvents: 'none',
              }}
            />
          </Box>
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

const SESSION_CARD_MIN = 260;
const VISIBLE_DESKTOP_CARDS = 3;

const mobileGridSx = {
  display: 'grid',
  gap: 2,
  alignItems: 'stretch',
  gridTemplateColumns: `repeat(auto-fill, minmax(${SESSION_CARD_MIN}px, 1fr))`,
} as const;

const desktopRowSx = {
  display: 'flex',
  flexWrap: 'nowrap',
  gap: 2,
  overflowX: 'auto',
  overflowY: 'hidden',
  flex: 1,
  minHeight: 0,
  alignItems: 'stretch',
  scrollbarWidth: 'thin',
  pb: 0.25,
} as const;

const desktopCardSx = {
  flex: '0 0 auto',
  width: `calc((100% - ${(VISIBLE_DESKTOP_CARDS - 1) * 16}px) / ${VISIBLE_DESKTOP_CARDS})`,
  minWidth: 240,
  height: '100%',
  alignSelf: 'stretch',
};

const mobileCardSx = {
  width: '100%',
};

// Hoisted so callers omitting `operatingSessionIds` get a stable Map reference;
// otherwise a fresh `new Map()` per render breaks downstream memoization.
const EMPTY_OPERATING_IDS: Map<string, 'delete' | 'renew'> = new Map();

export function ActiveSessionsWidgetImpl({
  sessions = [],
  operatingSessionIds = EMPTY_OPERATING_IDS,
  isLoading = false,
  isFetching = false,
  errorMessage,
  onRefresh,
  title = 'Active Sessions',
  showSessionCount = true,
  maxSessionsToShow,
  emptyMessage = 'No active sessions',
  headerActions,
  fillHeight = false,
}: ActiveSessionsWidgetProps) {
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const skeletonCount = isLgUp ? VISIBLE_DESKTOP_CARDS : 3;

  const sessionsToDisplay = maxSessionsToShow ? sessions.slice(0, maxSessionsToShow) : sessions;

  const hasMoreSessions = maxSessionsToShow && sessions.length > maxSessionsToShow;

  const sessionsLayoutSx = isLgUp ? desktopRowSx : mobileGridSx;
  const sessionCardSx = isLgUp ? desktopCardSx : mobileCardSx;

  const renderSessionCard = (session: (typeof sessionsToDisplay)[number], index: number) => {
    const operation = session.id ? operatingSessionIds.get(session.id) : undefined;
    // A session is "terminating" from the moment the user confirms the delete
    // (client mark) until the server stops listing it; Skaha also reports the
    // Terminating status directly once the pod starts winding down.
    const isTerminating = operation === 'delete' || session.status === 'Terminating';
    return (
      <SessionCard
        key={session.id || session.sessionName || `session-${index}`}
        {...session}
        isOperating={!!operation || session.status === 'Pending'}
        isTerminating={isTerminating}
        sx={sessionCardSx}
      />
    );
  };

  return (
    <DashboardWidget
      title={title}
      isLoading={isLoading}
      isFetching={isFetching}
      error={errorMessage}
      onRefresh={onRefresh}
      headerActions={
        <>
          {showSessionCount ? (
            <SessionQuotaIndicator
              count={sessions.length}
              max={MAX_INTERACTIVE_SESSIONS}
              isLoading={isLoading}
              isFetching={isFetching}
              errorMessage={errorMessage}
              onRefresh={onRefresh}
            />
          ) : null}
          {headerActions}
        </>
      }
      fillHeight={fillHeight}
    >
      {/* Content - Session Cards */}
      {isLoading ? (
        <Box sx={sessionsLayoutSx}>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <SessionCard
              key={`skeleton-${index}`}
              sessionType="notebook"
              sessionName=""
              status="Running"
              containerImage=""
              startedTime=""
              expiresTime=""
              memoryAllocated=""
              cpuAllocated=""
              loading={true}
              sx={sessionCardSx}
            />
          ))}
        </Box>
      ) : sessions.length > 0 ? (
        <>
          <Box sx={sessionsLayoutSx}>
            {sessionsToDisplay.map((session, index) => renderSessionCard(session, index))}
          </Box>
          {hasMoreSessions && (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ pt: 1, flexShrink: 0 }}
            >
              And {sessions.length - maxSessionsToShow} more...
            </Typography>
          )}
        </>
      ) : errorMessage ? null : (
        <Card
          elevation={0}
          variant="outlined"
          sx={{
            width: '100%',
            flex: fillHeight ? 1 : undefined,
            display: 'flex',
            flexDirection: 'column',
            minHeight: fillHeight ? 0 : 120,
            border: `1px solid ${theme.palette.divider}`,
            cursor: 'default',
          }}
        >
          <CardContent
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 3,
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.05) 100%)',
              [theme.breakpoints.down('sm')]: {
                padding: theme.spacing(2),
                '&:last-child': {
                  paddingBottom: theme.spacing(2),
                },
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color:
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontWeight: 400,
              }}
            >
              {emptyMessage}
            </Typography>
          </CardContent>
        </Card>
      )}
    </DashboardWidget>
  );
}
