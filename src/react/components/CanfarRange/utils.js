export function startsWithNumber(num1, num2) {
    const pattern = new RegExp(`^${num1}`);
    return pattern.test(String(num2));
}

/**
 * Generates an array of values using powers of 2 (2, 4, 8, 16, 32, ...)
 * Starting from min (or next power of 2), up to max
 *
 * @param {number} min - Minimum value (always included)
 * @param {number} max - Maximum value (always included)
 * @returns {number[]} Array of valid values (powers of 2 with min/max endpoints)
 *
 * @example
 * generateValuesWithPowersOfTwo(1, 64)  // [1, 2, 4, 8, 16, 32, 64]
 */
export function generateValuesWithPowersOfTwo(min, max) {
    const values = [];

    // Start with min
    let current = min;

    // If min is 0, start with 1
    if (current === 0) {
        values.push(0);
        current = 1;
    } else {
        values.push(current);
    }

    // Generate powers of 2: 2, 4, 8, 16, 32, ...
    let powerOfTwo = 2;
    while (powerOfTwo <= max) {
        if (powerOfTwo > current) {
            values.push(powerOfTwo);
            current = powerOfTwo;
        }
        powerOfTwo *= 2;
    }

    // Ensure max is included if it's not already
    if (values[values.length - 1] !== max) {
        values.push(max);
    }

    return values;
}