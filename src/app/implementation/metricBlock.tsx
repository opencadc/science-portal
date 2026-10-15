'use client';

import React from 'react';
import { Box, Skeleton, Tooltip, Typography } from '@mui/material';
import { useTheme, type Theme } from '@mui/material/styles';
import { MetricBlockProps } from '../types/MetricBlockProps';
import { tokens } from '@/app/design-system/tokens';
import { usageTrackColor } from '@/app/design-system/usageMeter';

function usageGradient(theme: Theme): string {
  const green = theme.palette.success.light;
  const yellow = theme.palette.warning.main;
  const red = theme.palette.error.main;
  return `linear-gradient(to right, ${green} 0%, ${green} 70%, ${yellow} 80%, ${red} 90%, ${red} 100%)`;
}

function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const digits = Math.abs(value) >= 100 || Number.isInteger(value) ? 0 : 1;
  return value.toFixed(digits);
}

function metricCopy(label: string): { heading: string; unit: string } {
  if (label === 'RAM') return { heading: 'Memory', unit: 'GB' };
  if (label === 'GPU') return { heading: 'GPUs', unit: 'GPUs' };
  return { heading: 'CPUs', unit: 'CPUs' };
}

function MeterHeading({
  heading,
  detail,
  muted = false,
}: {
  heading: string;
  detail: string;
  muted?: boolean;
}) {
  const color = muted ? 'text.disabled' : 'text.primary';
  const detailColor = muted ? 'text.disabled' : 'text.secondary';
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 1.5,
        mb: 0.75,
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color }}>
        {heading}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontFamily: tokens.typography.fontFamily.mono,
          fontVariantNumeric: 'tabular-nums',
          fontSize: '0.8125rem',
          color: detailColor,
          whiteSpace: 'nowrap',
        }}
      >
        {detail}
      </Typography>
    </Box>
  );
}

export const MetricBlockImpl: React.FC<MetricBlockProps> = React.memo(
  ({ label, series, max = 0, isLoading = false, unavailable = false, className }) => {
    const theme = useTheme();
    const { heading, unit } = metricCopy(label);
    const used = series?.used ?? 0;
    const safeMax = max > 0 ? max : 1;
    const usedPct = Math.min(100, Math.max(0, (used / safeMax) * 100));
    const usedPercentLabel = `${Math.round(usedPct)}%`;
    const hoverLabel = `${formatQuantity(used)} / ${formatQuantity(max)} ${unit}`;
    const trackColor = usageTrackColor(theme);

    return (
      <Box className={className} sx={{ mb: 2.5 }}>
        {isLoading ? (
          <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
        ) : unavailable ? (
          <>
            <MeterHeading heading={heading} detail="Unavailable" muted />
            <Box
              role="img"
              aria-label={`${heading} unavailable`}
              sx={{
                height: 8,
                borderRadius: tokens.borderRadius.fullCSS,
                backgroundColor: trackColor,
                opacity: 0.45,
              }}
            />
          </>
        ) : (
          <>
            <MeterHeading heading={heading} detail={usedPercentLabel} />

            <Tooltip
              title={hoverLabel}
              placement="top"
              enterDelay={200}
              slotProps={{
                tooltip: {
                  sx: {
                    fontFamily: tokens.typography.fontFamily.mono,
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    px: 1,
                    py: 0.5,
                  },
                },
              }}
            >
              <Box
                role="img"
                aria-label={`${heading}: ${usedPercentLabel} used (${hoverLabel})`}
                sx={{
                  height: 8,
                  borderRadius: tokens.borderRadius.fullCSS,
                  overflow: 'hidden',
                  backgroundColor: trackColor,
                }}
              >
                <Box
                  sx={{
                    width: `${usedPct}%`,
                    minWidth: usedPct > 0 ? 4 : 0,
                    height: '100%',
                    borderRadius: tokens.borderRadius.fullCSS,
                    backgroundImage: usageGradient(theme),
                    backgroundSize: usedPct > 0 ? `${10000 / usedPct}% 100%` : '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </Box>
            </Tooltip>
          </>
        )}
      </Box>
    );
  },
);

MetricBlockImpl.displayName = 'MetricBlockImpl';
