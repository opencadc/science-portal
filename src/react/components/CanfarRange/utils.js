export function startsWithNumber(num1, num2) {
    const pattern = new RegExp(`^${num1}`);
    return pattern.test(String(num2));
}