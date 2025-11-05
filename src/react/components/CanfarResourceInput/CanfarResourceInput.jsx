import React, { useState, useEffect, useCallback } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import './CanfarResourceInput.css';

/**
 * CanfarResourceInput - A numeric input with increment/decrement buttons
 *
 * @param {Object} props - Component props
 * @param {number} props.value - The current numeric value
 * @param {number[]} props.options - Array of valid numeric options
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
    options,
    onChange,
    onValidationChange,
    disabled = false,
    label = "Resource input",
    error = false,
    helperText
}) {
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

    // Find current index in options array
    const currentIndex = options.findIndex((opt) => opt === value);
    const isAtMax = currentIndex >= options.length - 1;
    const isAtMin = currentIndex <= 0;

    const handleIncrement = useCallback(() => {
        if (currentIndex < options.length - 1) {
            const newValue = options[currentIndex + 1];
            if (onChange && typeof onChange === 'function') {
                onChange(newValue);
            }
            setInputValue(String(newValue));
            setInternalError(false);
            setInvalidValue('');
            // Clear validation error - enable button
            if (onValidationChange && typeof onValidationChange === 'function') {
                onValidationChange(false);
            }
        }
    }, [currentIndex, options, onChange, onValidationChange]);

    const handleDecrement = useCallback(() => {
        if (currentIndex > 0) {
            const newValue = options[currentIndex - 1];
            if (onChange && typeof onChange === 'function') {
                onChange(newValue);
            }
            setInputValue(String(newValue));
            setInternalError(false);
            setInvalidValue('');
            // Clear validation error - enable button
            if (onValidationChange && typeof onValidationChange === 'function') {
                onValidationChange(false);
            }
        }
    }, [currentIndex, options, onChange, onValidationChange]);

    const handleInputChange = useCallback((event) => {
        const newValue = event.target.value;
        // Limit to 4 digits
        if (newValue.length <= 4) {
            setInputValue(newValue);

            // Check if the new value is valid
            const numValue = Number(newValue);
            const isValid = options.includes(numValue);

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
    }, [options, onValidationChange]);

    const handleInputBlur = useCallback(() => {
        const numValue = Number(inputValue);

        // Check if the value is in the options array
        if (options.includes(numValue)) {
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
    }, [inputValue, options, onChange, onValidationChange, value]);

    const showError = error || internalError;
    const errorMessage = internalError && invalidValue
        ? `Value ${invalidValue} is not supported`
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
