export default function throwIfNull<T>(
  value: T | null,
  failureMessage: string
) {
  if (value === null) {
    throw new Error(failureMessage)
  }

  return value
}
