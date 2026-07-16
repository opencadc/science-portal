'use client';

import React, { useMemo } from 'react';
import { Typography, Box, useMediaQuery, Stack } from '@mui/material';
import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { PlatformLoadProps } from '../types/PlatformLoadProps';
import { DashboardWidget } from '@/app/components/DashboardWidget/DashboardWidget';
import { MetricBlock } from '../components/MetricBlock/MetricBlock';
import { PLATFORM_LOAD_DISABLED_MESSAGE } from '@/lib/config/static-platform-load';

/**
 * PlatformLoad implementation component
 */
export const PlatformLoadImpl: React.FC<PlatformLoadProps> = ({
  data,
  isLoading = false,
  onRefresh,
  className,
  title = 'Platform Load',
  showDisabledOverlay = false,
  fillHeight = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const effectiveLoading = showDisabledOverlay ? false : isLoading;

  // Memoized to prevent recalculation on every render
  // Only recalculates when the date actually changes
  const formattedLastUpdate = useMemo(() => {
    const dateStr =
      typeof data.lastUpdate === 'string' ? data.lastUpdate : data.lastUpdate.toISOString();
    return dateStr.replace('T', ' ').slice(0, -5) + ' UTC';
  }, [data.lastUpdate]);

  const metricsContent = (
    <>
      {isMobile ? (
        <Stack spacing={2}>
          <MetricBlock
            label="CPU"
            series={data.cpu}
            max={data.maxValues.cpu}
            isLoading={effectiveLoading}
          />
          <MetricBlock
            label="RAM"
            series={data.ram}
            max={data.maxValues.ram}
            isLoading={effectiveLoading}
          />
        </Stack>
      ) : (
        <Stack spacing={1}>
          <MetricBlock
            label="CPU"
            series={data.cpu}
            max={data.maxValues.cpu}
            isLoading={effectiveLoading}
          />
          <MetricBlock
            label="RAM"
            series={data.ram}
            max={data.maxValues.ram}
            isLoading={effectiveLoading}
          />
        </Stack>
      )}
    </>
  );

  // Footer with the last-update timestamp; hidden when live stats are disabled.
  const lastUpdateFooter = !showDisabledOverlay && (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        [theme.breakpoints.down('sm')]: {
          justifyContent: 'center', // Center text on mobile
        },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontSize: '10px',
          [theme.breakpoints.down('sm')]: {
            textAlign: 'center',
          },
        }}
      >
        Last update:{' '}
        <Typography
          component="span"
          variant="caption"
          sx={{
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            color: 'primary.500',
          }}
        >
          {formattedLastUpdate}
        </Typography>
      </Typography>
    </Box>
  );

  return (
    <DashboardWidget
      className={className}
      title={title}
      isLoading={effectiveLoading}
      onRefresh={showDisabledOverlay ? undefined : onRefresh}
      footer={lastUpdateFooter || undefined}
      fillHeight={fillHeight}
    >
      {/* Content - Responsive MetricBlock layout; blurred when live stats disabled (CADC-15555) */}
      <Box sx={{ marginBottom: theme.spacing(2), position: 'relative' }}>
        {showDisabledOverlay ? (
          <>
            <Box
              sx={{
                filter: 'blur(4px)',
                WebkitFilter: 'blur(4px)',
                opacity: 0.85,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {metricsContent}
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
                    ? 'rgba(0, 0, 0, 0.72)'
                    : 'rgba(255, 255, 255, 0.72)',
                borderRadius: 1,
                zIndex: 5,
              }}
            >
              <WarningAmberIcon
                sx={{
                  color: '#b58900',
                  fontSize: 28,
                  mb: 1.25,
                }}
                aria-hidden
              />
              <Typography
                variant="body1"
                sx={{
                  fontSize: 16,
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
          metricsContent
        )}
      </Box>
    </DashboardWidget>
  );
};
