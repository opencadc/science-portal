'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, FormLabel } from '@mui/material';
import { CanfarRange } from '@/app/components/CanfarRange/CanfarRange';
import { nearestOption, resourceSliderMarkIndices } from '@/lib/utils/resource-options';
import { ResourceFieldProps } from '@/app/types/ResourceFieldProps';
import { tokens } from '@/app/design-system/tokens';

const ResourceFieldComponent = React.forwardRef<HTMLDivElement, ResourceFieldProps>(
  ({ label, value, options, unit, onChange, disabled = false }, ref) => {
    const inputId = `${label.replace(/\s+/g, '-').toLowerCase()}-value`;

    const [draft, setDraft] = useState(value);
    const [text, setText] = useState(String(value));
    const isInteracting = useRef(false);

    const validOptions = useMemo(() => {
      const sorted = [...options].filter((n) => n >= 1).sort((a, b) => a - b);
      return sorted.length > 0 ? sorted : [1];
    }, [options]);
    const floor = validOptions[0];
    const hi = validOptions[validOptions.length - 1] ?? 0;
    const axis = validOptions;

    const sliderMarks = useMemo(() => {
      return resourceSliderMarkIndices(axis).map((index) => ({ value: index }));
    }, [axis]);

    const sliderIndex = useMemo(() => {
      const index = axis.indexOf(draft);
      return index >= 0 ? index : 0;
    }, [axis, draft]);

    const resolveIndex = useCallback(
      (index: number) => {
        const clamped = Math.min(Math.max(Math.round(index), 0), axis.length - 1);
        return axis[clamped] ?? floor;
      },
      [axis, floor],
    );

    useEffect(() => {
      if (isInteracting.current) return;
      const next = value < floor ? floor : value;
      setDraft(next);
      setText(String(next));
      if (next !== value) {
        onChange(next);
      }
    }, [floor, onChange, value]);

    const commit = useCallback(
      (next: number) => {
        const snapped = nearestOption(Math.max(next, floor), validOptions);
        setDraft(snapped);
        setText(String(snapped));
        if (snapped !== value) {
          onChange(snapped);
        }
      },
      [floor, onChange, validOptions, value],
    );

    const handleSliderChange = useCallback(
      (next: number) => {
        isInteracting.current = true;
        const resolved = resolveIndex(next);
        setDraft(resolved);
        setText(String(resolved));
      },
      [resolveIndex],
    );

    const handleSliderCommitted = useCallback(
      (next: number) => {
        isInteracting.current = false;
        commit(resolveIndex(next));
      },
      [commit, resolveIndex],
    );

    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      isInteracting.current = true;
      setText(event.target.value);
    }, []);

    const commitFromText = useCallback(() => {
      isInteracting.current = false;
      const parsed = Number(text);
      if (Number.isInteger(parsed)) {
        commit(parsed);
      } else {
        setText(String(draft));
      }
    }, [text, draft, commit]);

    const handleInputKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        commitFromText();
        event.currentTarget.blur();
      },
      [commitFromText],
    );

    return (
      <Box
        ref={ref}
        sx={{
          display: 'grid',
          gridTemplateColumns: '4.75rem minmax(0, 1fr) 6.5rem',
          columnGap: 2,
          alignItems: 'center',
          minWidth: 0,
        }}
      >
        <FormLabel
          htmlFor={inputId}
          sx={{
            m: 0,
            typography: 'body2',
            fontWeight: 600,
            color: 'text.primary',
          }}
        >
          {label}
        </FormLabel>
        <Box sx={{ minWidth: 0 }}>
          <CanfarRange
            value={sliderIndex}
            min={0}
            max={Math.max(axis.length - 1, 0)}
            marks={sliderMarks}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderCommitted}
            disabled={disabled}
            label={label}
            valueMin={floor}
            valueMax={hi}
            valueNow={draft}
            valueText={unit ? `${draft} ${unit}` : String(draft)}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxSizing: 'border-box',
            gap: 0.5,
            height: 32,
            width: '6.5rem',
            flexShrink: 0,
            px: 1,
            borderRadius: tokens.borderRadius.smCSS,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            fontFamily: tokens.typography.fontFamily.mono,
            '&:focus-within': {
              bgcolor: 'background.paper',
              borderColor: 'primary.main',
            },
          }}
        >
          <Box
            component="input"
            id={inputId}
            inputMode="numeric"
            aria-label={unit ? `${label} in ${unit}` : label}
            value={text}
            disabled={disabled}
            onChange={handleInputChange}
            onBlur={commitFromText}
            onKeyDown={handleInputKeyDown}
            sx={{
              width: '4ch',
              m: 0,
              p: 0,
              border: 0,
              outline: 0,
              bgcolor: 'transparent',
              color: 'text.primary',
              font: 'inherit',
              fontSize: '0.8125rem',
              fontWeight: 500,
              lineHeight: 1,
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          {unit ? (
            <Box
              component="span"
              sx={{
                font: 'inherit',
                fontSize: '0.8125rem',
                fontWeight: 500,
                lineHeight: 1,
                color: 'text.primary',
                whiteSpace: 'nowrap',
              }}
            >
              {unit}
            </Box>
          ) : null}
        </Box>
      </Box>
    );
  },
);

ResourceFieldComponent.displayName = 'ResourceFieldImpl';

export const ResourceFieldImpl = React.memo(ResourceFieldComponent);
