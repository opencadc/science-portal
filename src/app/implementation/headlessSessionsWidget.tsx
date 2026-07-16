'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Select,
  Skeleton,
  Switch,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Delete as DeleteIcon,
  Description as LogsIcon,
  Flag as FlagIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DashboardWidget } from '@/app/components/DashboardWidget/DashboardWidget';
import type {
  HeadlessAutoRefreshIntervalSec,
  HeadlessSessionsWidgetProps,
} from '@/app/types/HeadlessSessionsWidgetProps';
import { HEADLESS_AUTO_REFRESH_INTERVALS_SEC } from '@/app/types/HeadlessSessionsWidgetProps';
import type { Session } from '@/lib/api/skaha';
import { useSessionModalsActions } from '@/lib/stores';
import {
  filterHeadlessJobsByGroup,
  groupHeadlessJobsByState,
  type HeadlessJobGroup,
} from '@/lib/sessions/headlessJobs';
import { hasAssignedSessionId } from '@/lib/sessions/sessionQuota';

const EMPTY_OPERATING_IDS: Map<string, 'delete' | 'renew'> = new Map();

const DEFAULT_INTERVAL_SEC: HeadlessAutoRefreshIntervalSec = 45;
const LIST_MAX_HEIGHT = 150;
const ROW_HEIGHT = 44;

const GROUP_TABS: { id: HeadlessJobGroup; label: string; color: string }[] = [
  { id: 'pending', label: 'Pending', color: '#FF9800' },
  { id: 'running', label: 'Running', color: '#4CAF50' },
  { id: 'completed', label: 'Completed', color: '#2196F3' },
  { id: 'failed', label: 'Failed', color: '#F44336' },
];

function formatIntervalLabel(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const mins = sec / 60;
  return Number.isInteger(mins) ? `${mins}m` : `${sec}s`;
}

function shortImageLabel(image: string): string {
  if (!image) return 'N/A';
  const parts = image.split('/');
  return parts.length >= 2 ? parts.slice(-2).join('/') : image;
}

function statusChipColor(
  status: Session['status'],
): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'Running':
      return 'success';
    case 'Pending':
    case 'Terminating':
      return 'warning';
    case 'Failed':
    case 'Error':
      return 'error';
    case 'Succeeded':
    case 'Completed':
      return 'info';
    default:
      return 'default';
  }
}

interface HeadlessJobRowProps {
  session: Session;
  isTerminating: boolean;
  onEvents: () => void;
  onLogs: () => void;
  onDelete: () => void;
}

const HeadlessJobRow = React.memo(function HeadlessJobRow({
  session,
  isTerminating,
  onEvents,
  onLogs,
  onDelete,
}: HeadlessJobRowProps) {
  const theme = useTheme();
  const actionsDisabled = isTerminating || !hasAssignedSessionId(session.id);
  const imageLabel = shortImageLabel(session.containerImage);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr auto',
          sm: 'minmax(72px, 0.7fr) minmax(100px, 1.2fr) minmax(0, 2fr) auto auto',
        },
        gap: { xs: 1, sm: 1.5 },
        alignItems: 'center',
        px: 1.5,
        height: ROW_HEIGHT,
        boxSizing: 'border-box',
        borderBottom: `1px solid ${theme.palette.divider}`,
        opacity: isTerminating ? 0.6 : 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          color: 'text.secondary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: { xs: 'none', sm: 'block' },
        }}
        title={session.id}
      >
        {session.id}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
        title={session.sessionName}
      >
        {session.sessionName}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          display: { xs: 'none', sm: 'block' },
        }}
        title={session.containerImage}
      >
        {imageLabel}
      </Typography>

      <Chip
        label={isTerminating ? 'Terminating' : session.status}
        color={statusChipColor(isTerminating ? 'Terminating' : session.status)}
        size="small"
        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, justifySelf: 'center' }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }}>
        <Tooltip title="View events">
          <span>
            <IconButton
              size="small"
              aria-label="View events"
              onClick={onEvents}
              disabled={actionsDisabled}
            >
              <FlagIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="View logs">
          <span>
            <IconButton
              size="small"
              aria-label="View logs"
              onClick={onLogs}
              disabled={actionsDisabled}
            >
              <LogsIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete job">
          <span>
            <IconButton
              size="small"
              aria-label="Delete job"
              onClick={onDelete}
              disabled={actionsDisabled}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
});

interface VirtualizedJobListProps {
  jobs: Session[];
  operatingSessionIds: Map<string, 'delete' | 'renew'>;
  onOpenModal: (session: Session, kind: 'events' | 'logs' | 'delete') => void;
  /** Reset scroll position when the active status tab changes. */
  scrollResetKey: HeadlessJobGroup;
}

function VirtualizedJobList({
  jobs,
  operatingSessionIds,
  onOpenModal,
  scrollResetKey,
}: VirtualizedJobListProps) {
  const theme = useTheme();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
  });

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [scrollResetKey]);

  return (
    <Box
      ref={parentRef}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: 'auto',
        maxHeight: LIST_MAX_HEIGHT,
      }}
    >
      <Box
        sx={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const session = jobs[virtualRow.index];
          const operation = operatingSessionIds.get(session.id);
          const isTerminating = operation === 'delete' || session.status === 'Terminating';

          return (
            <Box
              key={session.id}
              data-index={virtualRow.index}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <HeadlessJobRow
                session={session}
                isTerminating={isTerminating}
                onEvents={() => onOpenModal(session, 'events')}
                onLogs={() => onOpenModal(session, 'logs')}
                onDelete={() => onOpenModal(session, 'delete')}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function HeadlessSessionsWidgetImpl({
  sessions = [],
  operatingSessionIds = EMPTY_OPERATING_IDS,
  isLoading = false,
  isFetching = false,
  hasLoaded = false,
  groupLoading = {},
  groupLoaded = {},
  onRefresh,
  onAutoRefreshSettingsChange,
  title = 'Headless Sessions',
  showSessionCount = true,
  emptyMessage = 'No headless jobs in this group',
  idleMessage = 'Click Fetch now or enable auto-refresh to load headless jobs',
}: HeadlessSessionsWidgetProps) {
  const theme = useTheme();
  const { openSessionModal } = useSessionModalsActions();
  const [group, setGroup] = useState<HeadlessJobGroup>('pending');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [intervalSec, setIntervalSec] =
    useState<HeadlessAutoRefreshIntervalSec>(DEFAULT_INTERVAL_SEC);

  useEffect(() => {
    onAutoRefreshSettingsChange?.({ enabled: autoRefresh, intervalSec });
  }, [autoRefresh, intervalSec, onAutoRefreshSettingsChange]);

  const counts = useMemo(() => groupHeadlessJobsByState(sessions), [sessions]);
  const visibleJobs = useMemo(
    () => filterHeadlessJobsByGroup(sessions, group),
    [sessions, group],
  );

  const currentGroupLoading = Boolean(groupLoading[group]);
  const currentGroupLoaded = Boolean(groupLoaded[group]);
  const showGroupSkeleton =
    hasLoaded && currentGroupLoading && visibleJobs.length === 0 && !currentGroupLoaded;

  const displayTitle =
    showSessionCount && sessions.length > 0 ? `${title} (${sessions.length})` : title;
  const isBusy = isLoading || isFetching;

  const openModal = (session: Session, kind: 'events' | 'logs' | 'delete') => {
    if (!hasAssignedSessionId(session.id)) return;
    openSessionModal({
      sessionId: session.id,
      sessionName: session.sessionName,
      kind,
    });
  };

  return (
    <DashboardWidget title={displayTitle} isLoading={isLoading} isFetching={isFetching}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={autoRefresh}
              onChange={(_e, checked) => setAutoRefresh(checked)}
              inputProps={{ 'aria-label': 'Auto-refresh headless sessions' }}
            />
          }
          label="Auto-refresh"
          sx={{ mr: 0.5 }}
        />

        <FormControl size="small" sx={{ minWidth: 96 }} disabled={!autoRefresh}>
          <Select
            value={intervalSec}
            onChange={(e) =>
              setIntervalSec(Number(e.target.value) as HeadlessAutoRefreshIntervalSec)
            }
            displayEmpty
            inputProps={{ 'aria-label': 'Auto-refresh interval' }}
          >
            {HEADLESS_AUTO_REFRESH_INTERVALS_SEC.map((sec) => (
              <MenuItem key={sec} value={sec}>
                {formatIntervalLabel(sec)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => onRefresh?.()}
          disabled={isBusy || !onRefresh}
        >
          Fetch now
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
        <Tabs
          value={group}
          onChange={(_e, value: HeadlessJobGroup) => setGroup(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="headless job status groups"
        >
          {GROUP_TABS.map((tab) => {
            const loaded = Boolean(groupLoaded[tab.id]);
            const countLabel = !hasLoaded
              ? '0'
              : loaded
                ? String(counts[tab.id])
                : '…';
            return (
              <Tab
                key={tab.id}
                value={tab.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="span"
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: tab.color,
                        flexShrink: 0,
                      }}
                    />
                    <span>
                      {tab.label} ({countLabel})
                    </span>
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Box>

      {isLoading ? (
        <Box sx={{ px: 1.5, py: 1 }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1 }}>
              <Skeleton variant="text" width="15%" height={20} />
              <Skeleton variant="text" width="25%" height={20} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rounded" width={64} height={22} />
            </Box>
          ))}
        </Box>
      ) : !hasLoaded ? (
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            color: theme.palette.text.secondary,
          }}
        >
          <Typography variant="body2">{idleMessage}</Typography>
        </Box>
      ) : showGroupSkeleton ? (
        <Box sx={{ px: 1.5, py: 1 }}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1 }}>
              <Skeleton variant="text" width="15%" height={20} />
              <Skeleton variant="text" width="25%" height={20} />
              <Skeleton variant="text" width="40%" height={20} />
              <Skeleton variant="rounded" width={64} height={22} />
            </Box>
          ))}
        </Box>
      ) : visibleJobs.length === 0 ? (
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            color: theme.palette.text.secondary,
          }}
        >
          <Typography variant="body2">{emptyMessage}</Typography>
        </Box>
      ) : (
        <VirtualizedJobList
          jobs={visibleJobs}
          operatingSessionIds={operatingSessionIds}
          onOpenModal={openModal}
          scrollResetKey={group}
        />
      )}
    </DashboardWidget>
  );
}
