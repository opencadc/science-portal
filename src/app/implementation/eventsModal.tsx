'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Box,
  Chip,
  Alert,
  Button,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  CloudDownload as CloudDownloadIcon,
  CloudDone as CloudDoneIcon,
  PlayCircle as PlayCircleIcon,
  Flag as FlagIcon,
  Description as LogsIcon,
} from '@mui/icons-material';
import type {
  EventsModalProps,
  EventType,
  EventReason,
} from '@/app/types/EventsModalProps';
import { PortalModal } from '@/app/components/PortalModal/PortalModal';
import { useSessionEventLog } from '@/lib/hooks/useSessions';
import { parseEventLog } from '@/lib/sessions/parseEventLog';

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return '-';

  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
};

/**
 * Get icon for event reason
 */
const getEventIcon = (reason: EventReason) => {
  switch (reason) {
    case 'Scheduled':
      return <ScheduleIcon fontSize="small" />;
    case 'Pulling':
      return <CloudDownloadIcon fontSize="small" />;
    case 'Pulled':
      return <CloudDoneIcon fontSize="small" />;
    case 'Created':
    case 'Started':
      return <PlayCircleIcon fontSize="small" />;
    case 'Failed':
    case 'BackOff':
    case 'Unhealthy':
      return <ErrorIcon fontSize="small" />;
    default:
      return <FlagIcon fontSize="small" />;
  }
};

/**
 * Get chip color for event type
 */
const getEventTypeColor = (type: EventType): 'success' | 'warning' | 'error' | 'default' => {
  switch (type) {
    case 'Normal':
      return 'success';
    case 'Warning':
      return 'warning';
    case 'Error':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * EventsModal implementation
 */
export const EventsModalImpl: React.FC<EventsModalProps> = ({
  open,
  sessionId,
  sessionName = 'Session',
  onClose,
  logView = 'events',
  maxEvents = 100,
  showRefreshButton = true,
  forceRawView = false,
  defaultView = 'table',
}) => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [showRawView, setShowRawView] = useState(forceRawView || defaultView === 'raw');

  const {
    data: rawData,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useSessionEventLog(sessionId, logView, open);

  // Whitespace-only bodies (e.g. "\n") count as empty — the endpoint returns
  // 200 before the container has produced output.
  const hasRawContent = !!rawData?.trim();

  const { events, hasParseErrors: parseError } = useMemo(() => {
    if (!rawData) return { events: [], hasParseErrors: false };
    return parseEventLog(rawData);
  }, [rawData]);

  const error = queryError?.message ?? null;

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const sortedEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => {
        const timeA = a.lastTime || a.firstTime || '';
        const timeB = b.lastTime || b.firstTime || '';
        return timeB.localeCompare(timeA);
      })
      .slice(0, maxEvents);
  }, [events, maxEvents]);

  useEffect(() => {
    if (parseError && !showRawView) {
      setShowRawView(true);
    }
  }, [parseError, showRawView]);

  // Same convention as DashboardWidget:
  // - isLoading: initial fetch, nothing cached yet → spinner + progress bar
  // - isFetching: background refetch → keep stale content visible + progress bar
  const isLogsView = logView === 'logs';
  const titleLabel = isLogsView ? 'Container Logs' : 'Container Events';

  return (
    <PortalModal
      open={open}
      onClose={onClose}
      title={`${titleLabel} - ${sessionName}`}
      icon={isLogsView ? <LogsIcon /> : <FlagIcon />}
      isLoading={isLoading}
      isFetching={isFetching}
      maxWidth="lg"
      titleId="events-modal-title"
      onRefresh={showRefreshButton ? handleRefresh : undefined}
      refreshAriaLabel={isLogsView ? 'refresh logs' : 'refresh events'}
      refreshTooltip={isLogsView ? 'Refresh logs' : 'Refresh events'}
      error={
        error && !isLoading ? (
          <>
            {error}
            <Button size="small" onClick={handleRefresh} sx={{ ml: 2 }}>
              Retry
            </Button>
          </>
        ) : undefined
      }
    >
        {/* View toggle and parse error warning (hidden when parsing is disabled) */}
        {!forceRawView && (
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showRawView}
                  onChange={(e) => setShowRawView(e.target.checked)}
                  color="primary"
                />
              }
              label="Raw view"
            />
            {parseError && !showRawView && (
              <Alert severity="warning" sx={{ flex: 1, ml: 2 }}>
                Some events could not be parsed. Enable raw view to see all data.
              </Alert>
            )}
          </Box>
        )}

        {/* Raw view display */}
        {!isLoading && showRawView && hasRawContent && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor:
                theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
            }}
          >
            <Typography
              component="pre"
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                m: 0,
              }}
            >
              {rawData}
            </Typography>
          </Paper>
        )}

        {/* Raw view empty state: the endpoint can return 200 with an empty body
            (e.g. logs of a container that hasn't started), which would otherwise
            leave the modal blank. */}
        {!isLoading && !error && showRawView && !hasRawContent && (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <Typography variant="h6" gutterBottom>
              {isLogsView ? 'No logs available' : 'No events available'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isLogsView
                ? 'The container has not produced any output yet.'
                : 'No container events have been recorded for this session yet.'}
            </Typography>
          </Box>
        )}

        {/* Table view display */}
        {!isLoading && !error && !showRawView && sortedEvents.length === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <Typography variant="h6" gutterBottom>
              No events available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No container events have been recorded for this session yet.
            </Typography>
          </Box>
        )}

        {!isLoading && !showRawView && sortedEvents.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Reason</TableCell>
                  {!isTablet && <TableCell>Message</TableCell>}
                  <TableCell>First Time</TableCell>
                  <TableCell>Last Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedEvents.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell>
                      <Chip
                        label={event.type}
                        color={getEventTypeColor(event.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        {getEventIcon(event.reason)}
                        <Typography variant="body2">{event.reason}</Typography>
                      </Box>
                    </TableCell>
                    {!isTablet && (
                      <TableCell>
                        <Tooltip title={event.message} placement="top">
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.message}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimestamp(event.firstTime)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimestamp(event.lastTime)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
    </PortalModal>
  );
};
