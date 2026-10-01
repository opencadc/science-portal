'use client';

import React from 'react';
import { Slider, Box, useTheme, alpha } from '@mui/material';
import { CanfarRangeProps } from '@/app/types/CanfarRangeProps';

export const CanfarRangeImpl = React.forwardRef<HTMLDivElement, CanfarRangeProps>(
  (
    { value, min, max, step = 1, marks, onChange, onChangeCommitted, disabled = false, label, valueText, valueMin, valueMax, valueNow },
    ref,
  ) => {
    const theme = useTheme();

    const [lo, hi] = min > max ? [max, min] : [min, max];
    const clamped = Math.min(Math.max(value, lo), hi);

    const handleChange = (_event: Event, newValue: number | number[]) => {
      const next = Array.isArray(newValue) ? newValue[0] : newValue;
      onChange(next);
    };

    const handleCommitted = (
      _event: Event | React.SyntheticEvent,
      newValue: number | number[],
    ) => {
      if (!onChangeCommitted) return;
      const next = Array.isArray(newValue) ? newValue[0] : newValue;
      onChangeCommitted(next);
    };

    return (
      <Box ref={ref} sx={{ width: '100%' }}>
        <Slider
          size="small"
          value={clamped}
          min={lo}
          max={hi}
          step={step}
          marks={marks}
          onChange={handleChange}
          onChangeCommitted={handleCommitted}
          disabled={disabled || lo === hi}
          aria-label={label}
          slotProps={{
            input: {
              'aria-valuemin': valueMin ?? lo,
              'aria-valuemax': valueMax ?? hi,
              'aria-valuenow': valueNow ?? clamped,
              'aria-valuetext': valueText ?? `${clamped} out of ${hi}`,
            },
          }}
          sx={{
            color: theme.palette.primary.main,
            boxSizing: 'border-box',
            display: 'block',
            width: '100%',
            height: 5,
            py: '8px',
            // Inset the thumb without growing past the column (content-box + 100% overflows).
            px: '10px',
            '& .MuiSlider-track': {
              border: 'none',
              height: 5,
              borderRadius: 999,
              transition: 'none',
            },
            '& .MuiSlider-thumb': {
              height: 20,
              width: 20,
              backgroundColor: theme.palette.primary.main,
              border: 'none',
              boxShadow: 'none',
              // No transform/transition on the thumb — scaling or animating
              // position while dragging desyncs from the pointer and jumps.
              transition: 'none',
              '&:focus, &:hover, &.Mui-focusVisible': {
                boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.16)}`,
              },
              '&.Mui-active': {
                boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.22)}`,
              },
              '&:before': { display: 'none' },
            },
            '& .MuiSlider-rail': {
              color:
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[700]
                  : theme.palette.grey[300],
              opacity: 1,
              height: 5,
              borderRadius: 999,
              // MUI sizes the rail to the padding box, so horizontal padding
              // otherwise pushes it into the next column.
              width: 'calc(100% - 20px)',
            },
            '& .MuiSlider-mark': {
              width: 2,
              height: 5,
              borderRadius: 0.5,
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[500]
                  : theme.palette.grey[400],
            },
            '& .MuiSlider-markActive': {
              backgroundColor: theme.palette.primary.contrastText,
              opacity: 0.72,
            },
          }}
        />
      </Box>
    );
  },
);

CanfarRangeImpl.displayName = 'CanfarRangeImpl';
