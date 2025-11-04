import React, { useState, useEffect, useCallback, useMemo } from "react";
import Form from "react-bootstrap/Form";
import './CanfarRange.css';

/**
 * CanfarRange - A custom range slider component with visual gradient feedback
 *
 * @param {Object} props - Component props
 * @param {number} props.value - The current numeric value
 * @param {number[]} props.range - Array of valid numeric options
 * @param {function} props.onChange - Callback function that receives the selected value
 * @param {boolean} [props.disabled=false] - Whether the slider is disabled
 * @param {string} [props.label] - Accessible label for the slider
 * @returns {JSX.Element} Range slider component
 */
function CanfarRange({
    value,
    range,
    onChange,
    disabled = false,
    label = "Range slider"
}) {
    // Validate and sanitize range prop
    const validRange = useMemo(() => {
        if (!Array.isArray(range) || range.length === 0) {
            console.warn('CanfarRange: range prop must be a non-empty array, using default [0]');
            return [0];
        }
        return range;
    }, [range]);

    // Find the initial index in the range array, defaulting to 0 if not found
    const getIndexForValue = useCallback((val) => {
        if (val === null || val === undefined) return 0;

        const parsedValue = parseInt(val);
        const index = validRange.findIndex((el) => parseInt(el) === parsedValue);

        // Return 0 if not found (-1), otherwise return the found index
        return index === -1 ? 0 : index;
    }, [validRange]);

    const initialValue = useMemo(() => getIndexForValue(value), [getIndexForValue, value]);
    const [rangePos, setRangePos] = useState(initialValue);

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
        if (value !== null && value !== undefined) {
            const newRangePos = getIndexForValue(value);
            setRangePos(newRangePos);
        }
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
        <Form.Range
            value={rangePos}
            name="range-slider"
            min={0}
            max={validRange.length - 1}
            step="1"
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
    );
}

export default CanfarRange;