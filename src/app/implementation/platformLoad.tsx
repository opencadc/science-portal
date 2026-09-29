'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Box, Stack } from '@mui/material';
import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { PlatformLoadProps, type PlatformLoadData } from '../types/PlatformLoadProps';
import { DashboardWidget } from '@/app/components/DashboardWidget/DashboardWidget';
import { MetricBlock } from '../components/MetricBlock/MetricBlock';
import { PLATFORM_LOAD_DISABLED_MESSAGE } from '@/lib/config/static-platform-load';
import { tokens } from '@/app/design-system/tokens';
import { usageTrackColor } from '@/app/design-system/usageMeter';
import { formatRelativeToNow } from '@/lib/utils/relative-time';

const PLATFORM_STATS_UNAVAILABLE = 'Platform statistics unavailable';

function toLastUpdateMs(lastUpdate: string | Date): number | null {
  const ms = typeof lastUpdate === 'string' ? Date.parse(lastUpdate) : lastUpdate.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function PlatformMetricsSection({
  data,
  isLoading = false,
}: {
  data: PlatformLoadData | null;
  isLoading?: boolean;
}) {
  const theme = useTheme();
  const trackColor = usageTrackColor(theme);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const lastUpdateMs = data?.lastUpdate ? toLastUpdateMs(data.lastUpdate) : null;

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (lastUpdateMs != null) setNowMs(Date.now());
  }, [lastUpdateMs]);

  const formattedLastUpdate =
    lastUpdateMs != null ? `Updated ${formatRelativeToNow(lastUpdateMs, nowMs)}` : null;

  if (!data && !isLoading) {
    return (
      <Typography variant="body1" color="text.secondary">
        {PLATFORM_STATS_UNAVAILABLE}
      </Typography>
    );
  }

  if (!data) {
    return (
      <Stack spacing={1}>
        <MetricBlock label="CPU" series={{ name: 'CPU', used: 0, free: 0 }} max={1} isLoading />
        <MetricBlock label="RAM" series={{ name: 'RAM', used: 0, free: 0 }} max={1} isLoading />
      </Stack>
    );
  }

  return (
    <>
      <Stack spacing={0.5}>
        <MetricBlock label="CPU" series={data.cpu} max={data.maxValues.cpu} isLoading={isLoading} />
        <MetricBlock label="RAM" series={data.ram} max={data.maxValues.ram} isLoading={isLoading} />
      </Stack>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mt: 0.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '2px',
                flexShrink: 0,
                backgroundImage: (t) =>
                  `linear-gradient(to right, ${t.palette.success.light}, ${t.palette.warning.main}, ${t.palette.error.main})`,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Used
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '2px',
                flexShrink: 0,
                backgroundColor: trackColor,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Free
            </Typography>
          </Box>
        </Box>
        {formattedLastUpdate && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {formattedLastUpdate}
          </Typography>
        )}
      </Box>
    </>
  );
}

export const PlatformLoadImpl: React.FC<PlatformLoadProps> = ({
  data = null,
  isLoading = false,
  isFetching = false,
  error,
  onRefresh,
  className,
  title = 'Platform Load',
  showDisabledOverlay = false,
}) => {
  const theme = useTheme();
  const effectiveLoading = showDisabledOverlay ? false : isLoading;

  return (
    <DashboardWidget
      className={className}
      title={title}
      isLoading={effectiveLoading}
      isFetching={showDisabledOverlay ? false : isFetching}
      error={showDisabledOverlay ? undefined : error}
      onRefresh={showDisabledOverlay ? undefined : onRefresh}
    >
      <Box sx={{ mb: 2, position: 'relative' }}>
        {showDisabledOverlay ? (
          <>
            <Box sx={{ opacity: 0.32, pointerEvents: 'none', userSelect: 'none' }}>
              <PlatformMetricsSection data={data} isLoading={effectiveLoading} />
            </Box>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                px: 2,
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(44, 44, 46, 0.82)'
                    : 'rgba(255, 255, 255, 0.82)',
                borderRadius: tokens.borderRadius.mdCSS,
                zIndex: 5,
              }}
            >
              <WarningAmberIcon
                sx={{ color: 'warning.main', fontSize: 28, mb: 1.25 }}
                aria-hidden
              />
              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.4,
                  color: 'text.primary',
                  fontWeight: 500,
                  maxWidth: '90%',
                }}
              >
                {PLATFORM_LOAD_DISABLED_MESSAGE}
              </Typography>
            </Box>
          </>
        ) : (
          <PlatformMetricsSection data={data} isLoading={effectiveLoading} />
        )}
      </Box>
    </DashboardWidget>
  );
};
