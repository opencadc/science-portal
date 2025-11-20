import React, { useState, useEffect, useCallback, useMemo } from "react";
import Form from "react-bootstrap/Form";
import './CanfarRange.css';

/**
 * CanfarRange - A custom range slider component with visual gradient feedback
 *
 * Steps: Increments by 1 for smooth continuous sliding
 * Behavior: Slider moves continuously between min and max values
 *
 * @param {Object} props - Component props
 * @param {number} props.value - The current numeric value
 * @param {number} props.min - Minimum value
 * @param {number} props.max - Maximum value
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
    // Validate min and max
    const validMin = useMemo(() => {
        if (min === undefined || typeof min !== 'number') {
            console.error('CanfarRange: min must be a number');
            return 0;
        }
        return min;
    }, [min]);

    const validMax = useMemo(() => {
        if (max === undefined || typeof max !== 'number') {
            console.error('CanfarRange: max must be a number');
            return 100;
        }
        return max;
    }, [max]);

    // Ensure min is not greater than max
    const [minValue, maxValue] = useMemo(() => {
        if (validMin > validMax) {
            console.warn('CanfarRange: min cannot be greater than max, swapping values');
            return [validMax, validMin];
        }
        return [validMin, validMax];
    }, [validMin, validMax]);

    // Clamp value to valid range
    const clampedValue = useMemo(() => {
        const val = parseInt(value);
        if (isNaN(val)) return minValue;
        return Math.max(minValue, Math.min(maxValue, val));
    }, [value, minValue, maxValue]);

    const [currentValue, setCurrentValue] = useState(clampedValue);

    // Handle slider change events
    const handleChange = useCallback((e) => {
        const newValue = parseInt(e.target.value);
        setCurrentValue(newValue);

        // Call onChange with the actual value
        if (onChange && typeof onChange === 'function') {
            onChange(newValue);
        }
    }, [onChange]);

    // Sync internal state when external value changes
    useEffect(() => {
        setCurrentValue(clampedValue);
    }, [clampedValue]);

    // Calculate percentage for the gradient
    const percentage = useMemo(() => {
        const range = maxValue - minValue;
        if (range === 0) return 100; // Single value - fill to 100%
        return ((currentValue - minValue) / range) * 100;
    }, [currentValue, minValue, maxValue]);

    return (
        <>
            <Form.Range
                value={currentValue}
                min={minValue}
                max={maxValue}
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