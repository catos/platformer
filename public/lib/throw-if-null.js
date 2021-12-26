export default function throwIfNull(value, failureMessage) {
    if (value === null) {
        throw new Error(failureMessage);
    }
    return value;
}
