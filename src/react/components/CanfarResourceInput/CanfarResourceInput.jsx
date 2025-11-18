import React, { useState, useEffect, useCallback, useMemo } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { generateValuesWithPowersOfTwo } from '../CanfarRange/utils';
import './CanfarResourceInput.css';

/**
 * CanfarResourceInput - A numeric input with increment/decrement buttons
 *
 * Validation: Accepts ANY numeric value between min and max (not restricted to powers of 2)
 * Buttons: Step through powers of 2 (2, 4, 8, 16, 32, ...) for quick selection
 *
 * @param {Object} props - Component props
 * @param {number} props.value - The current numeric value
 * @param {number} props.min - Minimum value (validation bound)
 * @param {number} props.max - Maximum value (validation bound)
 * @param {function} props.onChange - Callback function that receives the selected value
 * @param {function} [props.onValidationChange] - Callback when validation state changes
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 * @param {string} [props.label] - Accessible label for the input
 * @param {boolean} [props.error=false] - Whether to show error state
 * @param {string} [props.helperText] - Helper text to display on error
 * @returns {JSX.Element} Resource input component with increment/decrement buttons
 */
function CanfarResourceInput({
    value,
    min,
    max,
    onChange,
    onValidationChange,
    disabled = false,
    label = "Resource input",
    error = false,
    helperText
}) {
    // Generate options using powers of 2
    const validOptions = useMemo(() => {
        if (min === undefined || max === undefined) {
            console.error('CanfarResourceInput: min and max are required props');
            return [0];
        }
        if (typeof min !== 'number' || typeof max !== 'number') {
            console.error('CanfarResourceInput: min and max must be numbers');
            return [0];
        }
        if (min > max) {
            console.warn('CanfarResourceInput: min cannot be greater than max, swapping values');
            return generateValuesWithPowersOfTwo(max, min);
        }
        return generateValuesWithPowersOfTwo(min, max);
    }, [min, max]);
    const [inputValue, setInputValue] = useState(String(value));
    const [internalError, setInternalError] = useState(false);
    const [invalidValue, setInvalidValue] = useState('');

    // Update input value when prop value changes
    useEffect(() => {
        setInputValue(String(value));
        setInternalError(false);
        setInvalidValue('');
        // Notify parent that error is cleared
        if (onValidationChange && typeof onValidationChange === 'function') {
            onValidationChange(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Find next/previous values in validOptions (handles non-power-of-2 values)
    const findNextValue = useCallback(() => {
        // Find first value greater than current value
        return validOptions.find((opt) => opt > value);
    }, [validOptions, value]);

    const findPreviousValue = useCallback(() => {
        // Find last value less than current value
        for (let i = validOptions.length - 1; i >= 0; i--) {
            if (validOptions[i] < value) {
                return validOptions[i];
            }
        }
        return undefined;
    }, [validOptions, value]);

    const nextValue = findNextValue();
    const previousValue = findPreviousValue();
    const isAtMax = nextValue === undefined;
    const isAtMin = previousValue === undefined;

    const handleIncrement = useCallback(() => {
        const next = validOptions.find((opt) => opt > value);
        if (next !== undefined) {
            if (onChange && typeof onChange === 'function') {
                onChange(next);
            }
            setInputValue(String(next));
            setInternalError(false);
            setInvalidValue('');
            // Clear validation error - enable button
            if (onValidationChange && typeof onValidationChange === 'function') {
                onValidationChange(false);
            }
        }
    }, [validOptions, value, onChange, onValidationChange]);

    const handleDecrement = useCallback(() => {
        // Find last value less than current value
        let prev = undefined;
        for (let i = validOptions.length - 1; i >= 0; i--) {
            if (validOptions[i] < value) {
                prev = validOptions[i];
                break;
            }
        }
        if (prev !== undefined) {
            if (onChange && typeof onChange === 'function') {
                onChange(prev);
            }
            setInputValue(String(prev));
            setInternalError(false);
            setInvalidValue('');
            // Clear validation error - enable button
            if (onValidationChange && typeof onValidationChange === 'function') {
                onValidationChange(false);
            }
        }
    }, [validOptions, value, onChange, onValidationChange]);

    const handleInputChange = useCallback((event) => {
        const newValue = event.target.value;
        // Limit to 4 digits
        if (newValue.length <= 4) {
            setInputValue(newValue);

            // Check if the new value is valid (within min/max range)
            const numValue = Number(newValue);
            const isValid = numValue >= min && numValue <= max;

            if (!isValid && newValue !== '') {
                // Invalid value while typing - disable button
                setInternalError(true);
                setInvalidValue(newValue);
                if (onValidationChange && typeof onValidationChange === 'function') {
                    onValidationChange(true);
                }
            } else {
                // Valid value or empty - clear error
                setInternalError(false);
                setInvalidValue('');
                if (onValidationChange && typeof onValidationChange === 'function') {
                    onValidationChange(false);
                }
            }
        }
    }, [min, max, onValidationChange]);

    const handleInputBlur = useCallback(() => {
        const numValue = Number(inputValue);

        // Check if the value is within min/max range
        if (numValue >= min && numValue <= max && !isNaN(numValue)) {
            if (onChange && typeof onChange === 'function') {
                onChange(numValue);
            }
            setInternalError(false);
            setInvalidValue('');
            // Clear validation error - enable button
            if (onValidationChange && typeof onValidationChange === 'function') {
                onValidationChange(false);
            }
        } else {
            // Invalid value - store it for error message, reset to valid value
            const invalidValueToShow = inputValue;
            setInvalidValue(invalidValueToShow);
            setInputValue(String(value)); // Reset to current valid value

            // Keep error visible but enable button since we reset to valid
            setInternalError(true);
            // Clear validation error - enable button
            if (onValidationChange && typeof onValidationChange === 'function') {
                onValidationChange(false);
            }
        }
    }, [inputValue, min, max, onChange, onValidationChange, value]);

    const showError = error || internalError;
    const errorMessage = internalError && invalidValue
        ? `Value must be between ${min} and ${max}`
        : helperText;

    return (
        <div className="canfar-resource-input-wrapper">
            <div className="canfar-resource-input-container">
                <Form.Control
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    disabled={disabled}
                    className={`canfar-resource-input ${showError ? 'is-invalid' : ''}`}
                    aria-label={label}
                    maxLength={4}
                />
                <div className={`canfar-resource-buttons ${showError ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
                    <Button
                        variant="light"
                        size="sm"
                        onClick={handleIncrement}
                        disabled={disabled || isAtMax}
                        className="canfar-resource-button canfar-resource-button-up"
                        aria-label={`Increase ${label}`}
                    >
                        <FontAwesomeIcon icon={faChevronUp} />
                    </Button>
                    <Button
                        variant="light"
                        size="sm"
                        onClick={handleDecrement}
                        disabled={disabled || isAtMin}
                        className="canfar-resource-button canfar-resource-button-down"
                        aria-label={`Decrease ${label}`}
                    >
                        <FontAwesomeIcon icon={faChevronDown} />
                    </Button>
                </div>
            </div>
            {showError && errorMessage && (
                <Form.Text className="text-danger canfar-resource-error">
                    {errorMessage}
                </Form.Text>
            )}
        </div>
    );
}

export default CanfarResourceInput;
