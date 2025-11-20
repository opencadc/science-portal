import React, { useState, useEffect, useCallback, useMemo } from "react";
import Form from "react-bootstrap/Form";
import { generateValuesWithPowersOfTwo } from './utils';
import './CanfarRange.css';

/**
 * CanfarRange - A custom range slider component with visual gradient feedback
 *
 * Steps: Uses powers of 2 (2, 4, 8, 16, 32, ...) as selectable positions
 * Behavior: If value is not a power of 2, slider snaps to nearest power of 2
 *
 * @param {Object} props - Component props
 * @param {number} props.value - The current numeric value
 * @param {number} props.min - Minimum value (generates range starting point)
 * @param {number} props.max - Maximum value (generates range ending point)
 * @param {function} props.onChange - Callback function that receives the selected value
 * @param {boolean} [props.disabled=false] - Whether the slider is disabled
 * @param {string} [props.label] - Accessible label for the slider
 * @returns {JSX.Element} Range slider component
 */
function CanfarRange({
    value,
    min,
    max,
    onChange,
    disabled = false,
    label = "Range slider",
    name
}) {
    // Generate range using powers of 2
    const validRange = useMemo(() => {
        if (min === undefined || max === undefined) {
            console.error('CanfarRange: min and max are required props');
            return [0];
        }
        if (typeof min !== 'number' || typeof max !== 'number') {
            console.error('CanfarRange: min and max must be numbers');
            return [0];
        }
        if (min > max) {
            console.warn('CanfarRange: min cannot be greater than max, swapping values');
            return generateValuesWithPowersOfTwo(max, min);
        }
        return generateValuesWithPowersOfTwo(min, max);
    }, [min, max]);

    // Find the index in the range array, or nearest value if not exact match
    const getIndexForValue = useCallback((val) => {
        if (val === null || val === undefined || validRange.length === 0) return 0;

        const parsedValue = parseInt(val);
        if (isNaN(parsedValue)) return 0;

        // First try to find exact match
        const exactIndex = validRange.findIndex((el) => parseInt(el) === parsedValue);
        if (exactIndex !== -1) return exactIndex;

        // If not found, find the nearest value
        let nearestIndex = 0;
        let minDiff = Math.abs(validRange[0] - parsedValue);

        for (let i = 1; i < validRange.length; i++) {
            const diff = Math.abs(validRange[i] - parsedValue);
            if (diff < minDiff) {
                minDiff = diff;
                nearestIndex = i;
            }
        }

        return nearestIndex;
    }, [validRange]);

    const [rangePos, setRangePos] = useState(() => getIndexForValue(value));

    // Handle slider change events
    const handleChange = useCallback((e) => {
        const newIndex = parseInt(e.target.value);
        const newValue = parseInt(validRange[newIndex]);

        setRangePos(newIndex);

        // Call onChange with the actual value from the range array
        if (onChange && typeof onChange === 'function') {
            onChange(newValue);
        }
    }, [validRange, onChange]);

    // Sync internal state when external value changes
    useEffect(() => {
        const newIndex = getIndexForValue(value);
        setRangePos(newIndex);
    }, [value, getIndexForValue]);

    // Calculate percentage for the gradient (handle edge case of single item)
    const percentage = useMemo(() => {
        const maxIndex = validRange.length - 1;
        if (maxIndex === 0) return 100; // Single item - fill to 100%
        return ((rangePos) / maxIndex) * 100;
    }, [rangePos, validRange.length]);

    // Get min and max values for accessibility
    const minValue = validRange[0];
    const maxValue = validRange[validRange.length - 1];
    const currentValue = validRange[rangePos];

    return (
        <>
            <Form.Range
                value={rangePos}
                min={0}
                max={validRange.length - 1}
                step={1}
                onChange={handleChange}
                disabled={disabled}
                className="canfar-range"
                style={{ '--value-percent': `${percentage}%` }}
                aria-label={label}
                aria-valuemin={minValue}
                aria-valuemax={maxValue}
                aria-valuenow={currentValue}
                aria-valuetext={`${currentValue} out of ${maxValue}`}
            />
            {name && <input type="hidden" name={name} value={currentValue} />}
        </>
    );
}

export default CanfarRange;