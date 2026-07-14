'use client';

import React, { useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  IconButton,
  Box,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ActiveSessionsWidgetProps } from '@/app/types/ActiveSessionsWidgetProps';
import { SessionCard } from '@/app/components/SessionCard/SessionCard';
import { SessionCheckModal } from '@/app/components/SessionCheckModal/SessionCheckModal';
import { useSessionHealthCheck, useSessionModalsActions } from '@/lib/stores';

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

// Hoisted so callers omitting `operatingSessionIds` get a stable Set reference;
// otherwise a fresh `new Set()` per render breaks downstream memoization.
const EMPTY_OPERATING_IDS: Set<string> = new Set();

export function ActiveSessionsWidgetImpl({
  sessions = [],
  operatingSessionIds = EMPTY_OPERATING_IDS,
  isLoading = false,
  onRefresh,
  title = 'Active Sessions',
  showSessionCount = true,
  maxSessionsToShow,
  emptyMessage = 'No active sessions',
  fillHeight = false,
}: ActiveSessionsWidgetProps) {
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const skeletonCount = isLgUp ? VISIBLE_DESKTOP_CARDS : 3;
  const healthCheck = useSessionHealthCheck();
  const { openHealthCheck, closeHealthCheck, setHealthCheckChecking } = useSessionModalsActions();

  const displayTitle =
    showSessionCount && sessions.length > 0 ? `${title} (${sessions.length})` : title;

  const sessionsToDisplay = maxSessionsToShow ? sessions.slice(0, maxSessionsToShow) : sessions;

  const hasMoreSessions = maxSessionsToShow && sessions.length > maxSessionsToShow;

  const sessionsLayoutSx = isLgUp ? desktopRowSx : mobileGridSx;
  const sessionCardSx = isLgUp ? desktopCardSx : mobileCardSx;

  // Keep refs to in-flight timers so we can cancel on unmount; otherwise
  // setState fires on an unmounted component when the user navigates away
  // mid-check.
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleRefreshClick = () => {
    openHealthCheck();
    setHealthCheckChecking(true);

    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    checkTimerRef.current = setTimeout(() => {
      setHealthCheckChecking(false);
      onRefresh?.();
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        closeHealthCheck();
      }, 1000);
    }, 2000);
  };

  const renderSessionCard = (session: (typeof sessionsToDisplay)[number], index: number) => (
    <SessionCard
      key={session.sessionName || `session-${index}`}
      {...session}
      compact
      isOperating={
        !!(session.id && operatingSessionIds.has(session.id)) || session.status === 'Pending'
      }
      disableHover={true}
      sx={sessionCardSx}
    />
  );

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        position: 'relative',
        padding: theme.spacing(2),
        overflow: 'hidden',
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        ...(fillHeight && { height: '100%', flex: 1 }),
      }}
      component="div"
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing(1),
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" component="h2">
          {displayTitle}
        </Typography>
        {onRefresh && (
          <IconButton
            aria-label="refresh"
            onClick={handleRefreshClick}
            disabled={isLoading}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        )}
      </Box>

      {/* Loading Bar */}
      <LinearProgress
        color={isLoading ? 'primary' : 'success'}
        variant={isLoading ? 'indeterminate' : 'determinate'}
        value={isLoading ? undefined : 100}
        sx={{
          width: '100%',
          height: 4,
          marginBottom: theme.spacing(2),
          borderRadius: 2,
          flexShrink: 0,
          '& .MuiLinearProgress-bar': {
            borderRadius: 2,
          },
        }}
      />

      {/* Content - Session Cards */}
      <Box
        sx={{
          flex: fillHeight ? 1 : undefined,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {isLoading ? (
          <Box sx={sessionsLayoutSx}>
            {Array.from({ length: skeletonCount }, (_, index) => (
              <SessionCard
                key={`skeleton-${index}`}
                compact
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
        ) : sessions.length === 0 ? (
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
        ) : (
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
        )}
      </Box>

      {/* Session Check Modal */}
      <SessionCheckModal
        open={healthCheck.open}
        onClose={closeHealthCheck}
        isChecking={healthCheck.checking}
      />
    </Paper>
  );
}
