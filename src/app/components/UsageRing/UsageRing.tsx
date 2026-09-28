'use client';

import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import {
  USAGE_RING_ICON_SIZE,
  USAGE_RING_SIZE,
  USAGE_RING_STROKE,
  clampUsagePct,
} from '@/app/design-system/usageMeter';

type UsageRingProps = {
  usage: number;
  isLoading?: boolean;
  usedColor: string;
  trackColor: string;
  size?: number;
  /** Center mark (folder, monitor, …). Colored by the caller. */
  icon: ReactNode;
};

/**
 * Circular usage meter used by home-storage and interactive-session quota.
 * Omits the fill stroke at 0% so rounded caps do not leave a phantom sliver.
 */
export function UsageRing({
  usage,
  isLoading = false,
  usedColor,
  trackColor,
  size = USAGE_RING_SIZE,
  icon,
}: UsageRingProps) {
  const clamped = clampUsagePct(usage);
  const radius = (size - USAGE_RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const center = size / 2;
  const showFill = isLoading || clamped > 0;

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <Box
        component="svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
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
          strokeWidth={USAGE_RING_STROKE}
        />
        {showFill && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={usedColor}
            strokeWidth={USAGE_RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={
              isLoading ? `${circumference * 0.25} ${circumference}` : `${dash} ${circumference}`
            }
          />
        )}
      </Box>
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: USAGE_RING_ICON_SIZE,
          height: USAGE_RING_ICON_SIZE,
          marginTop: `${-USAGE_RING_ICON_SIZE / 2}px`,
          marginLeft: `${-USAGE_RING_ICON_SIZE / 2}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: usedColor,
          pointerEvents: 'none',
          '& > *': {
            width: USAGE_RING_ICON_SIZE,
            height: USAGE_RING_ICON_SIZE,
            fontSize: USAGE_RING_ICON_SIZE,
          },
        }}
      >
        {icon}
      </Box>
    </Box>
  );
}
