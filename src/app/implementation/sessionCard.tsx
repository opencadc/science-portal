'use client';

import {
  Card as MuiCard,
  CardContent,
  CardActions,
  Box,
  Typography,
  IconButton,
  Chip,
  useTheme,
  Skeleton,
  Stack,
  Tooltip,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Description as LogsIcon,
  Schedule as ExtendIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { SessionCardProps, SessionType, SessionStatus } from '@/app/types/SessionCardProps';
import React, { useState, useCallback } from 'react';
import { alpha, type Theme } from '@mui/material/styles';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
import { usePublicRuntimeConfig } from '@/lib/providers/PublicRuntimeConfigProvider';
import Image from 'next/image';
import { EventsModal } from '@/app/components/EventsModal/EventsModal';
import { DeleteSessionModal } from '@/app/components/DeleteSessionModal/DeleteSessionModal';
import { SessionRenewModal } from '@/app/components/SessionRenewModal/SessionRenewModal';

const ICON_SIZE = 22;

const getSessionIcon = (basePath: string, type: SessionType): React.ReactNode => {
  switch (type) {
    case 'notebook':
    case 'contributednotebook':
      return (
        <Image
          src={`${basePath}/notebook_icon.jpg`}
          alt="Notebook"
          width={ICON_SIZE}
          height={ICON_SIZE}
          style={{ objectFit: 'contain' }}
        />
      );
    case 'desktop':
    case 'contributeddesktop':
      return (
        <Image
          src={`${basePath}/desktop_icon.png`}
          alt="Desktop"
          width={ICON_SIZE}
          height={ICON_SIZE}
          style={{ objectFit: 'contain' }}
        />
      );
    case 'carta':
      return (
        <Image
          src={`${basePath}/carta_icon.png`}
          alt="CARTA"
          width={ICON_SIZE}
          height={ICON_SIZE}
          style={{ objectFit: 'contain' }}
        />
      );
    case 'contributed':
      return (
        <Image
          src={`${basePath}/contributed_icon.png`}
          alt="Contributed"
          width={ICON_SIZE}
          height={ICON_SIZE}
          style={{ objectFit: 'contain' }}
        />
      );
    case 'firefly':
      return (
        <Image
          src={`${basePath}/firefly_icon.png`}
          alt="Firefly"
          width={ICON_SIZE}
          height={ICON_SIZE}
          style={{ objectFit: 'contain' }}
        />
      );
    default:
      return <CodeIcon />;
  }
};

const getStatusColor = (status: SessionStatus): 'success' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'Running':
      return 'success';
    case 'Pending':
    case 'Terminating':
      return 'warning';
    case 'Failed':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Skaha reports a session as `Failed` once its lifetime elapses; from the
 * user's perspective the session simply expired (it didn't crash). Surface
 * that distinction in the chip label.
 */
const getStatusLabel = (status: SessionStatus): string => {
  return status === 'Failed' ? 'Expired' : status;
};

const hasResourceModeBadge = (isFixedResources: boolean | undefined): isFixedResources is boolean =>
  isFixedResources === true || isFixedResources === false;

/**
 * Corner badge for the session's resource mode. Rendered inside CardContent
 * (without a z-index) so the operating/terminating backdrop dims it along
 * with the rest of the content.
 */
const ResourceModeChip = ({ isFixedResources }: { isFixedResources: boolean }) => {
  const theme = useTheme();
  return (
    <Tooltip
      title={
        isFixedResources
          ? 'Fixed resources — the session gets exactly the CPU and RAM it requested'
          : 'Flexible resources — the session shares idle cluster capacity'
      }
    >
      <Chip
        label={isFixedResources ? 'FIXED' : 'FLEX'}
        size="small"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '20px',
          fontSize: '0.7rem',
          fontWeight: 700,
          borderRadius: '0 0 8px 0',
          backgroundColor: isFixedResources
            ? theme.palette.primary.dark
            : theme.palette.success.light,
          color: isFixedResources
            ? theme.palette.primary.contrastText
            : theme.palette.success.contrastText,
        }}
      />
    </Tooltip>
  );
};

/**
 * Split a full container image path into project and image name.
 * Example: "images.canfar.net/skaha/firefly:2025.2" -> { project: "skaha", image: "firefly:2025.2" }
 */
const parseImagePath = (fullImagePath: string): { project: string; image: string } => {
  if (!fullImagePath) return { project: 'N/A', image: 'N/A' };
  const parts = fullImagePath.split('/');
  if (parts.length >= 3) {
    return { project: parts[1], image: parts.slice(2).join('/') };
  }
  if (parts.length === 2) {
    return { project: parts[0], image: parts[1] };
  }
  return { project: 'N/A', image: parts[0] };
};

/**
 * Skaha returns memory either as bare GB numbers ("1.4", "16") or, occasionally,
 * with a unit suffix ("8G"). Render with a "GB" suffix. Falsy / "<none>" → "N/A".
 */
const formatMemoryUnit = (value: string | undefined): string => {
  if (!value || value === '<none>') return 'N/A';
  if (/[KMGT]$/.test(value)) return `${value}B`;
  if (/^\d+(\.\d+)?$/.test(value)) return `${value}GB`;
  return value;
};

/**
 * Strip any unit suffix; used for the usage side of "usage / allocated" so the
 * unit appears only once at the end (e.g. "1.4 / 16GB").
 */
const stripMemoryUnit = (value: string | undefined): string => {
  if (!value || value === '<none>') return 'N/A';
  return value.replace(/[KMGT]B?$/, '');
};

/** Format ISO timestamp as "YYYY-MM-DD HH:mm" in UTC. */
const formatTimestamp = (timestamp: string): string => {
  if (!timestamp) return 'Pending...';
  const d = dayjs.utc(timestamp);
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : 'Pending...';
};

// --- Hoisted styles (static, or theme-derived via sx callbacks) ---

// No borderRadius: the card root has overflow:hidden, so it clips the
// backdrop to its own radius. (Careful when tempted to add one back — in sx,
// numeric borderRadius values are multiplied by theme.shape.borderRadius, so
// `borderRadius: theme.shape.borderRadius` renders 16px on a 6px card.)
const backdropSx = (theme: Theme) => ({
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  backgroundColor: alpha(theme.palette.background.paper, 0.7),
});

const actionButtonSx = (theme: Theme) => ({
  [theme.breakpoints.down('sm')]: {
    minWidth: '44px',
    minHeight: '44px',
  },
});

const detailLabelSx = { fontWeight: 600 } as const;

export const SessionCardImpl = React.forwardRef<HTMLDivElement, SessionCardProps>(
  (
    {
      // Consume `id` so it doesn't fall through to the DOM via {...cardProps}.
      id,
      sessionType,
      sessionName,
      status,
      containerImage,
      startedTime,
      expiresTime,
      memoryUsage,
      memoryAllocated,
      cpuUsage,
      cpuAllocated,
      gpuAllocated,
      isFixedResources,
      connectUrl,
      onDelete,
      onExtendTime,
      loading = false,
      isOperating = false,
      isTerminating = false,
      sx,
      ...cardProps
    },
    ref,
  ) => {
    const { basePath } = usePublicRuntimeConfig();
    const theme = useTheme();
    const [showEventsModal, setShowEventsModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRenewing, setIsRenewing] = useState(false);

    // While terminating, the server may still report the pre-delete status
    // (Running/Pending) for a few polls — surface Terminating instead.
    const displayStatus: SessionStatus = isTerminating ? 'Terminating' : status;
    const isConnectable = status === 'Running' && !isTerminating && !!connectUrl;

    const handleCardClick = () => {
      if (isConnectable) {
        window.open(connectUrl, '_blank');
      }
    };

    const handleCardKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardClick();
      }
    };

    const handleShowEvents = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowEventsModal(true);
    };

    const handleShowLogs = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowLogsModal(true);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteModal(true);
    };

    const handleDeleteConfirm = useCallback(async () => {
      setIsDeleting(true);
      try {
        if (onDelete) {
          await onDelete();
        }
        // Wait a bit to show the deleting state before closing modal
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch {
        // Swallow — the underlying mutation surfaces the error to the user.
      } finally {
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    }, [onDelete]);

    const handleExtendClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowRenewModal(true);
    };

    const handleRenewConfirm = useCallback(
      async (_hours: number) => {
        setIsRenewing(true);
        try {
          if (onExtendTime) {
            await onExtendTime();
          }
          // Wait a bit to show success state
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch {
          // Swallow — the underlying mutation surfaces the error to the user.
        } finally {
          setIsRenewing(false);
          setTimeout(() => {
            setShowRenewModal(false);
          }, 500);
        }
      },
      [onExtendTime],
    );

    if (loading) {
      return (
        <MuiCard
          ref={ref}
          {...cardProps}
          elevation={0}
          variant="outlined"
          sx={[
            { border: `1px solid ${theme.palette.divider}`, height: '100%' },
            ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
          ]}
        >
          <CardContent sx={{ p: 2, height: '100%', '&:last-child': { pb: 2 } }}>
            <Stack spacing={1.25}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <Skeleton variant="circular" width={22} height={22} />
                  <Skeleton variant="text" width={140} height={22} />
                </Box>
                <Skeleton variant="rectangular" width={64} height={22} />
              </Box>
              <Skeleton variant="text" width="100%" height={18} />
              <Skeleton variant="text" width="100%" height={18} />
              <Skeleton variant="text" width="90%" height={18} />
              <Skeleton variant="text" width="75%" height={18} />
              <Box display="flex" gap={0.5} mt={0.5}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="circular" width={32} height={32} />
                ))}
              </Box>
            </Stack>
          </CardContent>
        </MuiCard>
      );
    }

    const { project, image } = parseImagePath(containerImage);
    const memoryDisplay =
      isFixedResources === false
        ? formatMemoryUnit(memoryUsage)
        : `${stripMemoryUnit(memoryUsage)} / ${formatMemoryUnit(memoryAllocated)}`;
    const cpuDisplay =
      isFixedResources === false
        ? cpuUsage || 'N/A'
        : `${cpuUsage || 'N/A'} / ${cpuAllocated}`;
    const showGpu = !!(gpuAllocated && gpuAllocated !== '0');
    const showResourceMode = hasResourceModeBadge(isFixedResources);

    // The session id drives the modal API calls; fall back to the name for
    // resilience with older payloads.
    const apiSessionId = id || sessionName;

    return (
      <>
        <MuiCard
          ref={ref}
          {...cardProps}
          onClick={handleCardClick}
          onKeyDown={isConnectable ? handleCardKeyDown : undefined}
          role={isConnectable ? 'link' : undefined}
          tabIndex={isConnectable ? 0 : undefined}
          aria-label={isConnectable ? `Open session ${sessionName}` : undefined}
          elevation={0}
          raised={false}
          variant="outlined"
          sx={[
            {
              cursor: isConnectable ? 'pointer' : 'default',
              border: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: '100%',
            },
            ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
          ]}
        >
          <CardContent
            sx={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              px: 2,
              pb: 1.5,
              pt: showResourceMode ? 4.5 : 2,
              '&:last-child': { pb: 1.5 },
            }}
          >
            {showResourceMode && <ResourceModeChip isFixedResources={isFixedResources} />}

            {/* Operating overlay covers the content only; the actions row below
                stays visible and clickable (e.g. delete) during operations.
                Terminating gets a dedicated actions-row backdrop instead. */}
            {(isOperating || isTerminating) && (
              <Backdrop open sx={backdropSx(theme)}>
                <CircularProgress size={32} />
              </Backdrop>
            )}

            <Box display="flex" alignItems="center" gap={1} mb={1} minWidth={0}>
              <Box sx={{ color: theme.palette.primary.main, display: 'flex', flexShrink: 0 }}>
                {getSessionIcon(basePath, sessionType)}
              </Box>
              <Typography
                variant="subtitle1"
                component="div"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                  flex: 1,
                  fontWeight: theme.typography.fontWeightBold,
                  lineHeight: 1.2,
                }}
              >
                {sessionName}
              </Typography>
              <Chip
                label={getStatusLabel(displayStatus)}
                color={getStatusColor(displayStatus)}
                size="small"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}
              />
            </Box>

            <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" color="text.secondary" noWrap title={project}>
                <Box component="span" sx={detailLabelSx}>
                  Project:{' '}
                </Box>
                <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {project}
                </Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap title={image}>
                <Box component="span" sx={detailLabelSx}>
                  Image:{' '}
                </Box>
                <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {image}
                </Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                <Box component="span" sx={detailLabelSx}>
                  Memory:{' '}
                </Box>
                {memoryDisplay}
                {' · '}
                <Box component="span" sx={detailLabelSx}>
                  CPU:{' '}
                </Box>
                {cpuDisplay}
                {showGpu && (
                  <>
                    {' · '}
                    <Box component="span" sx={detailLabelSx}>
                      GPU:{' '}
                    </Box>
                    {gpuAllocated}
                  </>
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                <Box component="span" sx={detailLabelSx}>
                  Started:{' '}
                </Box>
                {formatTimestamp(startedTime)} UTC
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                <Box component="span" sx={detailLabelSx}>
                  Expires:{' '}
                </Box>
                {formatTimestamp(expiresTime)} UTC
              </Typography>
            </Stack>
          </CardContent>

          <CardActions
            disableSpacing
            sx={{
              position: 'relative',
              borderTop: 1,
              borderColor: 'divider',
              justifyContent: 'flex-end',
              gap: 0.25,
              px: 1.5,
              py: 0.5,
            }}
          >
            {/* Extra overlay for the actions row, terminating case only: the
                content backdrop deliberately leaves the footer clickable (so
                Pending sessions can still be deleted), but a terminating
                session must not accept any further actions. */}
            {isTerminating && <Backdrop open sx={backdropSx(theme)} />}
            {/* Footer buttons stay active for Pending/operating sessions (a
                stuck Pending session must remain deletable) and are only
                disabled while the session is terminating. */}
            <Tooltip
              title={status === 'Pending' ? 'Cannot extend a pending session' : 'Extend time'}
            >
              <span>
                <IconButton
                  size="small"
                  onClick={handleExtendClick}
                  aria-label="Extend time"
                  disabled={status === 'Pending' || isTerminating}
                  sx={actionButtonSx(theme)}
                >
                  <ExtendIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="View session logs">
              <span>
                <IconButton
                  size="small"
                  onClick={handleShowLogs}
                  aria-label="View logs"
                  disabled={isTerminating}
                  sx={actionButtonSx(theme)}
                >
                  <LogsIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="View launch info">
              <span>
                <IconButton
                  size="small"
                  onClick={handleShowEvents}
                  aria-label="View events"
                  disabled={isTerminating}
                  sx={actionButtonSx(theme)}
                >
                  <FlagIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete session">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDeleteClick}
                  aria-label="Delete session"
                  disabled={isTerminating}
                  sx={actionButtonSx(theme)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </CardActions>
        </MuiCard>

        <EventsModal
          open={showEventsModal}
          sessionId={apiSessionId}
          sessionName={sessionName}
          onClose={() => setShowEventsModal(false)}
          showRefreshButton={true}
          logView="events"
        />
        <EventsModal
          open={showLogsModal}
          sessionId={apiSessionId}
          sessionName={`${sessionName} - Logs`}
          onClose={() => setShowLogsModal(false)}
          showRefreshButton={true}
          forceRawView={true}
          defaultView="raw"
          logView="logs"
        />
        <DeleteSessionModal
          open={showDeleteModal}
          sessionName={sessionName}
          sessionId={apiSessionId}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
        <SessionRenewModal
          open={showRenewModal}
          sessionName={sessionName}
          sessionId={apiSessionId}
          onClose={() => setShowRenewModal(false)}
          onConfirm={handleRenewConfirm}
          isRenewing={isRenewing}
        />
      </>
    );
  },
);

SessionCardImpl.displayName = 'SessionCardImpl';
